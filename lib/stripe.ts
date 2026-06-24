import Stripe from 'stripe';
import { BILLING_CURRENCY_CODE } from '@/lib/billing/plans';

let stripeClient: Stripe | null = null;
const STRIPE_PRICING_CACHE_TTL_MS = 5 * 60 * 1000;
let stripePlanPricingOverridesCache: {
  expiresAt: number;
  data: Partial<Record<PaidPlan, Partial<Record<BillingInterval, number>>>>;
} | null = null;

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

export function isStripePriceConfigured(
  plan: PaidPlan,
  billing: BillingInterval = 'monthly',
): boolean {
  const envKey = STRIPE_PRICE_ENV_KEYS[plan][billing];
  return Boolean(process.env[envKey]);
}

export function getStripePlanAvailability(): Record<PaidPlan, Record<BillingInterval, boolean>> {
  return {
    starter: {
      monthly: isStripePriceConfigured('starter', 'monthly'),
      annual: isStripePriceConfigured('starter', 'annual'),
    },
    pro: {
      monthly: isStripePriceConfigured('pro', 'monthly'),
      annual: isStripePriceConfigured('pro', 'annual'),
    },
    agency: {
      monthly: isStripePriceConfigured('agency', 'monthly'),
      annual: isStripePriceConfigured('agency', 'annual'),
    },
  };
}

export async function getStripePlanPricingOverrides(): Promise<
  Partial<Record<PaidPlan, Partial<Record<BillingInterval, number>>>>
> {
  const now = Date.now();
  if (stripePlanPricingOverridesCache && stripePlanPricingOverridesCache.expiresAt > now) {
    return stripePlanPricingOverridesCache.data;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return {};
  }

  const stripe = getStripe();
  const overrides: Partial<Record<PaidPlan, Partial<Record<BillingInterval, number>>>> = {};
  const detectedCurrencies = new Set<string>();

  await Promise.all(
    (Object.keys(STRIPE_PRICE_ENV_KEYS) as PaidPlan[]).map(async (plan) => {
      await Promise.all(
        (Object.keys(STRIPE_PRICE_ENV_KEYS[plan]) as BillingInterval[]).map(async (billing) => {
          if (!isStripePriceConfigured(plan, billing)) return;

          try {
            const priceId = getStripePriceId(plan, billing);
            const price = await stripe.prices.retrieve(priceId);

            if (typeof price.unit_amount !== 'number' || !Number.isFinite(price.unit_amount)) {
              return;
            }

            if (typeof price.currency === 'string' && price.currency.length > 0) {
              detectedCurrencies.add(price.currency.toLowerCase());
            }

            const amount = price.unit_amount / 100;
            if (!overrides[plan]) {
              overrides[plan] = {};
            }
            overrides[plan]![billing] = amount;
          } catch (error) {
            console.warn(`Unable to retrieve Stripe price for ${plan} (${billing}).`, error);
          }
        }),
      );
    }),
  );

  if (detectedCurrencies.size > 0) {
    const expectedCurrency = BILLING_CURRENCY_CODE.toLowerCase();
    const hasMultipleCurrencies = detectedCurrencies.size > 1;
    const hasUnexpectedCurrency = !detectedCurrencies.has(expectedCurrency);

    if (hasMultipleCurrencies || hasUnexpectedCurrency) {
      console.warn(
        `Stripe pricing override rejected due to currency mismatch. Expected ${expectedCurrency}, received ${Array.from(detectedCurrencies).join(', ')}.`,
      );
      stripePlanPricingOverridesCache = {
        expiresAt: now + STRIPE_PRICING_CACHE_TTL_MS,
        data: {},
      };
      return {};
    }
  }

  stripePlanPricingOverridesCache = {
    expiresAt: now + STRIPE_PRICING_CACHE_TTL_MS,
    data: overrides,
  };

  return overrides;
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
