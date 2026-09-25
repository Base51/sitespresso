import { normalizePlan, type Plan } from '@/lib/billing/plans';
import { planFromPriceId } from '@/lib/stripe';

/**
 * The plan used for enforcement (site limits, generation quota).
 *
 * Mirrors the logic in `app/api/generate/route.ts`: a stored `agency` plan wins
 * (manual assignment), otherwise an active paid subscription wins, otherwise the
 * stored plan. This is only safe once clients can no longer write `profiles.plan`
 * (see docs/RLS_PLAN_AND_SITE_INSERTS.md).
 */
export function determineEffectivePlan(storedPlan: unknown, subscriptionPriceId: unknown): Plan {
  const stored = normalizePlan(storedPlan);
  if (stored === 'agency') return 'agency';

  const fromSubscription = planFromPriceId(
    typeof subscriptionPriceId === 'string' ? subscriptionPriceId : undefined,
  );
  return fromSubscription !== 'free' ? fromSubscription : stored;
}
