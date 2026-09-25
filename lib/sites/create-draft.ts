import { WebsiteSchema } from '@/lib/schemas/website';
import { determineEffectivePlan } from '@/lib/billing/effective-plan';
import { isSiteLimitReached, resolveSiteLimit } from '@/lib/billing/site-limits';
import { appendSlugSuffix, generateSlug } from '@/lib/slug-format';
import type { Plan } from '@/lib/billing/plans';

// Minimal structural types so this module can be unit-tested with fakes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = { from: (table: string) => any };

// Validate only the columns we copy out of the content. The full editor state is
// stored as-is (same as the previous client insert), so a draft mid-edit that does
// not yet satisfy the full WebsiteSchema can still be saved.
const DraftIdentitySchema = WebsiteSchema.pick({
  business_name: true,
  business_type: true,
  city: true,
}).passthrough();

export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'] as const;

export type CreateDraftResult =
  | { ok: true; status: 201; id: string; slug: string }
  | { ok: false; status: 400 | 403 | 500; error: string; details?: Record<string, unknown> };

export interface CreateDraftDeps {
  /** Signed-in user's id, taken from the server session. Never from the request body. */
  userId: string;
  /** Untrusted request payload. */
  content: unknown;
  /** Supabase client bound to the user's session (RLS applies). Used for reads only. */
  sessionClient: AnyClient;
  /** Returns the service-role client. Only called after validation and the limit check pass. */
  getAdminClient: () => AnyClient;
  /** Random suffix for the temporary draft slug; injectable for tests. */
  randomSuffix?: () => string;
}

/**
 * Server-side draft creation. Order matters:
 * 1. validate content, 2. resolve plan and count sites with the user's session,
 * 3. enforce the site limit, 4. only then insert with the service role.
 */
export async function createDraftSite(deps: CreateDraftDeps): Promise<CreateDraftResult> {
  const { userId, content, sessionClient, getAdminClient } = deps;

  const parsed = DraftIdentitySchema.safeParse(content);
  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Invalid website content.' };
  }

  const [profileResult, subscriptionResult, countResult] = await Promise.all([
    sessionClient.from('profiles').select('plan').eq('id', userId).single(),
    sessionClient
      .from('subscriptions')
      .select('status, stripe_price_id, updated_at')
      .eq('user_id', userId)
      .in('status', [...ACTIVE_SUBSCRIPTION_STATUSES])
      .order('updated_at', { ascending: false })
      .limit(1),
    sessionClient.from('sites').select('id', { head: true, count: 'exact' }).eq('user_id', userId),
  ]);

  if (countResult?.error) {
    return { ok: false, status: 500, error: 'Could not check your site limit.' };
  }

  const plan: Plan = determineEffectivePlan(
    profileResult?.data?.plan,
    subscriptionResult?.data?.[0]?.stripe_price_id,
  );
  const totalSites: number = countResult?.count ?? 0;

  if (isSiteLimitReached(plan, totalSites)) {
    const siteLimit = resolveSiteLimit(plan);
    return {
      ok: false,
      status: 403,
      error:
        siteLimit == null
          ? 'Site creation is temporarily unavailable.'
          : `Site limit reached (${totalSites}/${siteLimit}). Upgrade your plan to create more sites.`,
      details: { requiresUpgrade: true, currentPlan: plan, siteCount: totalSites, siteLimit },
    };
  }

  // Store the editor content as sent so no fields are dropped.
  const website = content as Record<string, unknown>;
  const randomSuffix = deps.randomSuffix ?? (() => crypto.randomUUID().slice(0, 8));
  // Temporary draft slug; the publish route generates the final slug.
  const slug = appendSlugSuffix(generateSlug(parsed.data.business_name), randomSuffix());

  const admin = getAdminClient();
  const { data: row, error } = await admin
    .from('sites')
    .insert({
      user_id: userId,
      slug,
      business_name: parsed.data.business_name,
      business_type: parsed.data.business_type,
      city: parsed.data.city,
      content: website,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !row?.id) {
    return { ok: false, status: 500, error: 'Failed to create draft.' };
  }

  return { ok: true, status: 201, id: row.id as string, slug };
}
