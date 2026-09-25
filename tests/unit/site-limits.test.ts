import { describe, expect, it } from 'vitest';
import { getSiteLimitMessage, isSiteLimitReached, resolveSiteLimit } from '@/lib/billing/site-limits';

// SUSPECTED BUG (reported, not fixed here; billing behaviour changes need owner approval):
// SITE_LIMIT_BY_PLAN maps agency -> null ("unlimited"), but resolveSiteLimit() returns
// `SITE_LIMIT_BY_PLAN[plan] ?? 1`, and `null ?? 1` is 1. So the Agency plan currently resolves
// to a 1-site limit (isSiteLimitReached('agency', 1) === true), which /api/generate enforces.
// The skipped tests below describe the intended behaviour. Un-skip them together with the fix.

describe('resolveSiteLimit', () => {
  it.each([
    ['free', 1],
    ['starter', 1],
    ['pro', 3],
  ])('%s -> %j', (plan, expected) => {
    expect(resolveSiteLimit(plan)).toBe(expected);
  });

  it.skip('agency -> null (unlimited) [BUG: currently returns 1]', () => {
    expect(resolveSiteLimit('agency')).toBeNull();
    expect(resolveSiteLimit('Agency')).toBeNull();
  });

  it('normalises case and whitespace', () => {
    expect(resolveSiteLimit('  PRO ')).toBe(3);
    expect(resolveSiteLimit('Starter')).toBe(1);
  });

  it('falls back to the free limit for unknown or non-string plans', () => {
    for (const plan of ['enterprise', '', null, undefined, 42, {}]) {
      expect(resolveSiteLimit(plan)).toBe(1);
    }
  });
});

describe('isSiteLimitReached', () => {
  it('free and starter allow exactly one site', () => {
    for (const plan of ['free', 'starter']) {
      expect(isSiteLimitReached(plan, 0)).toBe(false);
      expect(isSiteLimitReached(plan, 1)).toBe(true);
      expect(isSiteLimitReached(plan, 2)).toBe(true);
    }
  });

  it('pro allows three sites', () => {
    expect(isSiteLimitReached('pro', 2)).toBe(false);
    expect(isSiteLimitReached('pro', 3)).toBe(true);
  });

  it.skip('agency is unlimited [BUG: currently limited to 1 site]', () => {
    expect(isSiteLimitReached('agency', 1)).toBe(false);
    expect(isSiteLimitReached('agency', 10_000)).toBe(false);
  });

  it('treats unknown plans as free', () => {
    expect(isSiteLimitReached('bogus', 0)).toBe(false);
    expect(isSiteLimitReached('bogus', 1)).toBe(true);
  });
});

describe('getSiteLimitMessage', () => {
  it('uses singular and plural wording', () => {
    expect(getSiteLimitMessage('free')).toBe('This plan allows up to 1 site.');
    expect(getSiteLimitMessage('starter')).toBe('This plan allows up to 1 site.');
    expect(getSiteLimitMessage('pro')).toBe('This plan allows up to 3 sites.');
  });

  it.skip('agency shows the unlimited message [BUG: currently "up to 1 site"]', () => {
    expect(getSiteLimitMessage('agency')).toBe('Unlimited sites available on Agency plan.');
  });
});
