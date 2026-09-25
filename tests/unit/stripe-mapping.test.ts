import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  billingIntervalFromPriceId,
  getStripePlanAvailability,
  getStripePriceId,
  isBillingInterval,
  isPaidPlan,
  isStripePriceConfigured,
  planFromPriceId,
  planFromStripeStatus,
} from '@/lib/stripe';

// Obviously fake price IDs. These tests only exercise env-var mapping: no Stripe client is
// created and no network call is made (the Stripe SDK is only instantiated by getStripe()).
const FAKE_PRICES = {
  STRIPE_STARTER_PRICE_ID: 'price_fake_starter_monthly',
  STRIPE_STARTER_ANNUAL_PRICE_ID: 'price_fake_starter_annual',
  STRIPE_PRO_PRICE_ID: 'price_fake_pro_monthly',
  STRIPE_PRO_ANNUAL_PRICE_ID: 'price_fake_pro_annual',
  STRIPE_AGENCY_PRICE_ID: 'price_fake_agency_monthly',
  STRIPE_AGENCY_ANNUAL_PRICE_ID: 'price_fake_agency_annual',
} as const;

function stubAllPrices(): void {
  for (const [key, value] of Object.entries(FAKE_PRICES)) vi.stubEnv(key, value);
}

beforeEach(() => {
  // Start every test from a known state, regardless of the developer's shell env.
  for (const key of Object.keys(FAKE_PRICES)) vi.stubEnv(key, '');
  vi.stubEnv('STRIPE_SECRET_KEY', '');
});

describe('planFromPriceId', () => {
  it.each([
    ['price_fake_starter_monthly', 'starter'],
    ['price_fake_starter_annual', 'starter'],
    ['price_fake_pro_monthly', 'pro'],
    ['price_fake_pro_annual', 'pro'],
    ['price_fake_agency_monthly', 'agency'],
    ['price_fake_agency_annual', 'agency'],
  ])('%s -> %s', (priceId, plan) => {
    stubAllPrices();
    expect(planFromPriceId(priceId)).toBe(plan);
  });

  it('returns free for unknown, empty, null and undefined price IDs', () => {
    stubAllPrices();
    expect(planFromPriceId('price_fake_unknown')).toBe('free');
    expect(planFromPriceId('')).toBe('free');
    expect(planFromPriceId(null)).toBe('free');
    expect(planFromPriceId(undefined)).toBe('free');
  });

  it('returns free when no price env vars are configured', () => {
    expect(planFromPriceId('price_fake_pro_monthly')).toBe('free');
  });
});

describe('billingIntervalFromPriceId', () => {
  it('maps monthly and annual price IDs', () => {
    stubAllPrices();
    expect(billingIntervalFromPriceId('price_fake_starter_monthly')).toBe('monthly');
    expect(billingIntervalFromPriceId('price_fake_pro_annual')).toBe('annual');
    expect(billingIntervalFromPriceId('price_fake_agency_annual')).toBe('annual');
  });

  it('returns null for unknown or missing price IDs', () => {
    stubAllPrices();
    expect(billingIntervalFromPriceId('price_fake_unknown')).toBeNull();
    expect(billingIntervalFromPriceId(null)).toBeNull();
    expect(billingIntervalFromPriceId(undefined)).toBeNull();
  });
});

describe('planFromStripeStatus', () => {
  it.each(['active', 'trialing'])('%s subscriptions map to the price plan', (status) => {
    stubAllPrices();
    expect(planFromStripeStatus(status, 'price_fake_pro_monthly')).toBe('pro');
    expect(planFromStripeStatus(status, 'price_fake_agency_annual')).toBe('agency');
  });

  it.each(['canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', ''])(
    '%j subscriptions map to free',
    (status) => {
      stubAllPrices();
      expect(planFromStripeStatus(status, 'price_fake_pro_monthly')).toBe('free');
    },
  );

  it('active with an unknown or missing price maps to free', () => {
    stubAllPrices();
    expect(planFromStripeStatus('active', 'price_fake_unknown')).toBe('free');
    expect(planFromStripeStatus('active')).toBe('free');
    expect(planFromStripeStatus('active', null)).toBe('free');
  });
});

describe('price configuration helpers', () => {
  it('getStripePriceId returns the configured ID and defaults to monthly', () => {
    stubAllPrices();
    expect(getStripePriceId('pro')).toBe('price_fake_pro_monthly');
    expect(getStripePriceId('agency', 'annual')).toBe('price_fake_agency_annual');
  });

  it('getStripePriceId throws a descriptive error when the env var is missing', () => {
    expect(() => getStripePriceId('starter', 'annual')).toThrow(
      'STRIPE_STARTER_ANNUAL_PRICE_ID is not configured.',
    );
  });

  it('isStripePriceConfigured and getStripePlanAvailability reflect which env vars are set', () => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', FAKE_PRICES.STRIPE_PRO_PRICE_ID);
    expect(isStripePriceConfigured('pro')).toBe(true);
    expect(isStripePriceConfigured('pro', 'annual')).toBe(false);
    expect(getStripePlanAvailability()).toEqual({
      starter: { monthly: false, annual: false },
      pro: { monthly: true, annual: false },
      agency: { monthly: false, annual: false },
    });
  });
});

describe('type guards', () => {
  it('isPaidPlan accepts only paid plan names (case-sensitive)', () => {
    expect(['starter', 'pro', 'agency'].every(isPaidPlan)).toBe(true);
    expect(['free', 'Pro', '', 'enterprise'].some(isPaidPlan)).toBe(false);
  });

  it('isBillingInterval accepts only monthly and annual', () => {
    expect(isBillingInterval('monthly')).toBe(true);
    expect(isBillingInterval('annual')).toBe(true);
    expect(isBillingInterval('yearly')).toBe(false);
    expect(isBillingInterval('Monthly')).toBe(false);
  });
});
