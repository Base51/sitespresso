export type PaidPlan = 'starter' | 'pro' | 'agency';
export type Plan = 'free' | PaidPlan;
export type BillingInterval = 'monthly' | 'annual';
export type PlanAvailability = Record<PaidPlan, Record<BillingInterval, boolean>>;
export type PlanPricing = Record<PaidPlan, Record<BillingInterval, number>>;
export type PlanPricingOverrides = Partial<Record<PaidPlan, Partial<Record<BillingInterval, number>>>>;

export const BILLING_CURRENCY_CODE = 'EUR';
export const BILLING_CURRENCY_SYMBOL = '€';

export const NEXT_PLAN: Record<Exclude<Plan, 'agency'>, PaidPlan> = {
  free: 'starter',
  starter: 'pro',
  pro: 'agency',
};

export const PLAN_LABELS: Record<PaidPlan, string> = {
  starter: 'Starter',
  pro: 'Pro',
  agency: 'Agency',
};

export const PLAN_PRICING: PlanPricing = {
  starter: {
    monthly: 9,
    annual: 79,
  },
  pro: {
    monthly: 19,
    annual: 159,
  },
  agency: {
    monthly: 49,
    annual: 399,
  },
};

export const PLAN_FEATURES: Record<PaidPlan, string[]> = {
  starter: [
    '1 live site on your SiteSpresso subdomain',
    '50 AI generations per month',
    'Ongoing edits and billing portal access',
  ],
  pro: [
    'Everything in Starter',
    '500 AI generations per month',
    'Best fit for heavier iteration and multiple launches',
  ],
  agency: [
    'Everything in Pro',
    '5,000 AI generations per month',
    'Built for agencies and high-volume workflows',
  ],
};

export const PLAN_ORDER: PaidPlan[] = ['starter', 'pro', 'agency'];

export function formatPlanPrice(value: number): string {
  return `${BILLING_CURRENCY_SYMBOL}${value}`;
}

export function mergePlanPricing(overrides?: PlanPricingOverrides | null): PlanPricing {
  const merged: PlanPricing = {
    starter: { ...PLAN_PRICING.starter },
    pro: { ...PLAN_PRICING.pro },
    agency: { ...PLAN_PRICING.agency },
  };

  if (!overrides) {
    return merged;
  }

  for (const plan of PLAN_ORDER) {
    const planOverrides = overrides[plan];
    if (!planOverrides) continue;

    for (const billing of ['monthly', 'annual'] as const) {
      const overrideValue = planOverrides[billing];
      if (typeof overrideValue === 'number' && Number.isFinite(overrideValue) && overrideValue > 0) {
        merged[plan][billing] = overrideValue;
      }
    }
  }

  return merged;
}