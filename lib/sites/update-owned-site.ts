import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Columns on `sites` that clients cannot UPDATE directly (see
 * docs/RLS_SITES_STATUS_AND_DOMAINS.md). Only server routes set them, after their
 * own auth, ownership and plan checks.
 */
export type ServerOnlySitePatch = Partial<{
  slug: string;
  status: 'draft' | 'published';
  published_at: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  domain_attached: boolean;
  updated_at: string;
}>;

type SitesUpdater = {
  update: (patch: ServerOnlySitePatch) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => PromiseLike<{ error: unknown }>;
    };
  };
};

/**
 * Writes server-only columns with the service role. The caller must already have
 * verified that `userId` owns `siteId`; the extra `user_id` filter keeps the
 * write scoped to the owner's row even though the service role bypasses RLS.
 */
export async function updateOwnedSite(
  siteId: string,
  userId: string,
  patch: ServerOnlySitePatch,
): Promise<{ error: unknown }> {
  const sites = createAdminClient().from('sites') as unknown as SitesUpdater;
  return sites.update(patch).eq('id', siteId).eq('user_id', userId);
}
