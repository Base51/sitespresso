import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export type PaidPlan = 'starter' | 'pro' | 'agency';
export type Plan = 'free' | PaidPlan;
export type BillingInterval = 'monthly' | 'annual';

const STRIPE_PRICE_ENV_KEYS: Record<PaidPlan, Record<BillingInterval, string>> = {
  starter: {
    monthly: 'STRIPE_STARTER_PRICE_ID',
    annual: 'STRIPE_STARTER_ANNUAL_PRICE_ID',
  },
  pro: {
    monthly: 'STRIPE_PRO_PRICE_ID',
    annual: 'STRIPE_PRO_ANNUAL_PRICE_ID',
  },
  agency: {
    monthly: 'STRIPE_AGENCY_PRICE_ID',
    annual: 'STRIPE_AGENCY_ANNUAL_PRICE_ID',
  },
};

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripeStarterPriceId(): string {
  return getStripePriceId('starter', 'monthly');
}

export function getStripePriceId(plan: PaidPlan, billing: BillingInterval = 'monthly'): string {
  const envKey = STRIPE_PRICE_ENV_KEYS[plan][billing];
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`${envKey} is not configured.`);
  }

  return priceId;
}

export function isPaidPlan(value: string): value is PaidPlan {
  return value === 'starter' || value === 'pro' || value === 'agency';
}

export function isBillingInterval(value: string): value is BillingInterval {
  return value === 'monthly' || value === 'annual';
}

export function planFromPriceId(priceId: string | null | undefined): Plan {
  if (!priceId) return 'free';

  for (const [plan, billingMap] of Object.entries(STRIPE_PRICE_ENV_KEYS) as Array<
    [PaidPlan, Record<BillingInterval, string>]
  >) {
    for (const envKey of Object.values(billingMap)) {
      if (process.env[envKey] === priceId) {
        return plan;
      }
    }
  }

  return 'free';
}

export function billingIntervalFromPriceId(
  priceId: string | null | undefined,
): BillingInterval | null {
  if (!priceId) return null;

  for (const billingMap of Object.values(STRIPE_PRICE_ENV_KEYS)) {
    if (process.env[billingMap.monthly] === priceId) {
      return 'monthly';
    }
    if (process.env[billingMap.annual] === priceId) {
      return 'annual';
    }
  }

  return null;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return secret;
}

export function planFromStripeStatus(status: string, priceId?: string | null): Plan {
  if (status !== 'active' && status !== 'trialing') {
    return 'free';
  }

  return planFromPriceId(priceId);
}
