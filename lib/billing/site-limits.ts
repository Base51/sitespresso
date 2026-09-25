import { normalizePlan, type Plan } from '@/lib/billing/plans';

const SITE_LIMIT_BY_PLAN: Record<Plan, number | null> = {
  free: 1,
  starter: 1,
  pro: 3,
  agency: null,
};

// Safe fallback for a plan with no entry in SITE_LIMIT_BY_PLAN.
const DEFAULT_SITE_LIMIT = 1;

/**
 * Returns the maximum number of sites for a plan, or `null` for unlimited.
 * Unknown/missing plans normalise to `free` (1 site). `null` in SITE_LIMIT_BY_PLAN
 * explicitly means unlimited, so don't use `??` here: it would turn `null` into the default.
 */
export function resolveSiteLimit(plan: unknown): number | null {
  const normalizedPlan = normalizePlan(plan);
  return Object.prototype.hasOwnProperty.call(SITE_LIMIT_BY_PLAN, normalizedPlan)
    ? SITE_LIMIT_BY_PLAN[normalizedPlan]
    : DEFAULT_SITE_LIMIT;
}

export function isSiteLimitReached(plan: unknown, siteCount: number): boolean {
  const limit = resolveSiteLimit(plan);
  if (limit == null) return false;
  return siteCount >= limit;
}

export function getSiteLimitMessage(plan: unknown): string {
  const limit = resolveSiteLimit(plan);
  if (limit == null) {
    return 'Unlimited sites available on Agency plan.';
  }

  return `This plan allows up to ${limit} site${limit === 1 ? '' : 's'}.`;
}
