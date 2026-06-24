import type { createAdminClient } from '@/lib/supabase/admin';

const ACTIVE_LIKE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'] as const;

type SubscriptionRow = {
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string | null;
  updated_at: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
};

type AdminSupabaseClient = ReturnType<typeof createAdminClient>;

export type BillingDuplicatesReport = {
  generatedAt: string;
  activeLikeStatuses: string[];
  totalAffectedUsers: number;
  duplicates: Array<{
    userId: string;
    email: string | null;
    activeLikeCount: number;
    hasAgencyAnnual: boolean;
    latestUpdatedAt: string | null;
    subscriptions: Array<{
      stripeSubscriptionId: string | null;
      stripePriceId: string | null;
      status: string | null;
      updatedAt: string | null;
    }>;
  }>;
};

export async function buildBillingDuplicatesReport(
  admin: AdminSupabaseClient,
): Promise<BillingDuplicatesReport> {
  const { data: rows, error } = await admin
    .from('subscriptions')
    .select('user_id, stripe_subscription_id, stripe_price_id, status, updated_at')
    .in('status', [...ACTIVE_LIKE_STATUSES]);

  if (error) {
    throw new Error('Failed to load subscription report.');
  }

  const grouped = new Map<string, SubscriptionRow[]>();
  for (const row of (rows ?? []) as SubscriptionRow[]) {
    if (!row.user_id) continue;
    const existing = grouped.get(row.user_id) ?? [];
    existing.push(row);
    grouped.set(row.user_id, existing);
  }

  const duplicates = [...grouped.entries()].filter(([, values]) => values.length > 1);
  const userIds = duplicates.map(([userId]) => userId);

  const emailMap = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    for (const row of (profiles ?? []) as ProfileRow[]) {
      emailMap.set(row.id, row.email);
    }
  }

  const agencyAnnualPriceId = process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID ?? null;

  const duplicateUsers = duplicates
    .map(([userId, values]) => {
      const sorted = [...values].sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      });

      return {
        userId,
        email: emailMap.get(userId) ?? null,
        activeLikeCount: values.length,
        hasAgencyAnnual:
          agencyAnnualPriceId !== null &&
          values.some((value) => value.stripe_price_id === agencyAnnualPriceId),
        latestUpdatedAt: sorted[0]?.updated_at ?? null,
        subscriptions: sorted.map((value) => ({
          stripeSubscriptionId: value.stripe_subscription_id,
          stripePriceId: value.stripe_price_id,
          status: value.status,
          updatedAt: value.updated_at,
        })),
      };
    })
    .sort((a, b) => b.activeLikeCount - a.activeLikeCount);

  return {
    generatedAt: new Date().toISOString(),
    activeLikeStatuses: [...ACTIVE_LIKE_STATUSES],
    totalAffectedUsers: duplicateUsers.length,
    duplicates: duplicateUsers,
  };
}
