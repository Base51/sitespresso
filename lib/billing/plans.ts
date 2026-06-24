export type PaidPlan = 'starter' | 'pro' | 'agency';
export type Plan = 'free' | PaidPlan;
export type BillingInterval = 'monthly' | 'annual';
export type PlanAvailability = Record<PaidPlan, Record<BillingInterval, boolean>>;

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

export const PLAN_PRICING: Record<PaidPlan, Record<BillingInterval, number>> = {
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