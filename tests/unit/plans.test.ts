import { describe, expect, it } from 'vitest';
import {
  BILLING_CURRENCY_CODE,
  PLAN_PRICING,
  formatPlanPrice,
  mergePlanPricing,
  normalizePlan,
} from '@/lib/billing/plans';

describe('normalizePlan', () => {
  it.each(['free', 'starter', 'pro', 'agency'])('accepts %s', (plan) => {
    expect(normalizePlan(plan)).toBe(plan);
  });

  it('trims and lowercases', () => {
    expect(normalizePlan('  Starter ')).toBe('starter');
    expect(normalizePlan('AGENCY')).toBe('agency');
  });

  it('returns free for unknown strings and non-strings', () => {
    for (const value of ['enterprise', '', 'pro-annual', null, undefined, 3, true, {}, []]) {
      expect(normalizePlan(value)).toBe('free');
    }
  });
});

describe('formatPlanPrice', () => {
  it('prefixes the euro symbol', () => {
    expect(BILLING_CURRENCY_CODE).toBe('EUR');
    expect(formatPlanPrice(9)).toBe('€9');
    expect(formatPlanPrice(159)).toBe('€159');
  });
});

describe('mergePlanPricing', () => {
  it('returns a copy of the defaults when there are no overrides', () => {
    const merged = mergePlanPricing();
    expect(merged).toEqual(PLAN_PRICING);
    expect(merged).not.toBe(PLAN_PRICING);
    expect(merged.pro).not.toBe(PLAN_PRICING.pro);
    expect(mergePlanPricing(null)).toEqual(PLAN_PRICING);
  });

  it('applies valid positive overrides per plan and interval', () => {
    const merged = mergePlanPricing({ pro: { monthly: 21 }, agency: { annual: 420 } });
    expect(merged.pro).toEqual({ monthly: 21, annual: PLAN_PRICING.pro.annual });
    expect(merged.agency).toEqual({ monthly: PLAN_PRICING.agency.monthly, annual: 420 });
    expect(merged.starter).toEqual(PLAN_PRICING.starter);
  });

  it('ignores zero, negative and non-finite overrides', () => {
    const merged = mergePlanPricing({
      starter: { monthly: 0, annual: -5 },
      pro: { monthly: Number.NaN, annual: Number.POSITIVE_INFINITY },
    });
    expect(merged.starter).toEqual(PLAN_PRICING.starter);
    expect(merged.pro).toEqual(PLAN_PRICING.pro);
  });

  it('does not mutate the default pricing table', () => {
    const before = structuredClone(PLAN_PRICING);
    mergePlanPricing({ starter: { monthly: 99 } });
    expect(PLAN_PRICING).toEqual(before);
  });
});
