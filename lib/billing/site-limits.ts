import { normalizePlan, type Plan } from '@/lib/billing/plans';

const SITE_LIMIT_BY_PLAN: Record<Plan, number | null> = {
  free: 1,
  starter: 1,
  pro: 3,
  agency: null,
};

export function resolveSiteLimit(plan: unknown): number | null {
  const normalizedPlan = normalizePlan(plan);
  return SITE_LIMIT_BY_PLAN[normalizedPlan] ?? 1;
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
