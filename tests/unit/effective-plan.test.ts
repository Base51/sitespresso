import { beforeEach, describe, expect, it, vi } from 'vitest';
import { determineEffectivePlan } from '@/lib/billing/effective-plan';

// Fake price IDs only; no Stripe client or network.
const FAKE_PRICES = {
  STRIPE_STARTER_PRICE_ID: 'price_fake_starter_monthly',
  STRIPE_STARTER_ANNUAL_PRICE_ID: 'price_fake_starter_annual',
  STRIPE_PRO_PRICE_ID: 'price_fake_pro_monthly',
  STRIPE_PRO_ANNUAL_PRICE_ID: 'price_fake_pro_annual',
  STRIPE_AGENCY_PRICE_ID: 'price_fake_agency_monthly',
  STRIPE_AGENCY_ANNUAL_PRICE_ID: 'price_fake_agency_annual',
} as const;

beforeEach(() => {
  for (const [key, value] of Object.entries(FAKE_PRICES)) vi.stubEnv(key, value);
});

describe('determineEffectivePlan (mirrors /api/generate)', () => {
  it('stored agency wins over any subscription', () => {
    expect(determineEffectivePlan('agency', 'price_fake_starter_monthly')).toBe('agency');
    expect(determineEffectivePlan(' Agency ', undefined)).toBe('agency');
  });

  it('an active paid subscription wins over a lower stored plan', () => {
    expect(determineEffectivePlan('free', 'price_fake_pro_monthly')).toBe('pro');
    expect(determineEffectivePlan('starter', 'price_fake_agency_annual')).toBe('agency');
  });

  it('falls back to the stored plan when there is no recognised subscription', () => {
    expect(determineEffectivePlan('pro', undefined)).toBe('pro');
    expect(determineEffectivePlan('starter', 'price_unknown')).toBe('starter');
  });

  it('unknown or missing stored plan with no subscription is free', () => {
    expect(determineEffectivePlan(undefined, null)).toBe('free');
    expect(determineEffectivePlan('enterprise', 42)).toBe('free');
  });
});
