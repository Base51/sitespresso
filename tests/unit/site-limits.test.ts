import { describe, expect, it } from 'vitest';
import { getSiteLimitMessage, isSiteLimitReached, resolveSiteLimit } from '@/lib/billing/site-limits';

// Agency is explicitly unlimited (null). Before the fix, `SITE_LIMIT_BY_PLAN[plan] ?? 1`
// turned that null into a 1-site limit (NEXT_ACTIONS item 8.1).

describe('resolveSiteLimit', () => {
  it.each([
    ['free', 1],
    ['starter', 1],
    ['pro', 3],
    ['agency', null],
  ])('%s -> %j (exact per-plan limits)', (plan, expected) => {
    expect(resolveSiteLimit(plan)).toBe(expected);
  });

  it('agency -> null (unlimited), regardless of case/whitespace', () => {
    expect(resolveSiteLimit('agency')).toBeNull();
    expect(resolveSiteLimit('Agency')).toBeNull();
    expect(resolveSiteLimit('  AGENCY ')).toBeNull();
  });

  it('normalises case and whitespace', () => {
    expect(resolveSiteLimit('  PRO ')).toBe(3);
    expect(resolveSiteLimit('Starter')).toBe(1);
  });

  it('falls back to the free limit (1) for unknown, missing or non-string plans', () => {
    for (const plan of ['enterprise', 'unlimited', 'agency-plus', '', null, undefined, 42, {}, []]) {
      expect(resolveSiteLimit(plan)).toBe(1);
    }
  });

  it('never returns null for anything except agency', () => {
    for (const plan of ['free', 'starter', 'pro', 'bogus', undefined]) {
      expect(resolveSiteLimit(plan)).not.toBeNull();
    }
  });
});

describe('isSiteLimitReached', () => {
  it.each([
    // plan, siteCount, reached
    ['free', 0, false],
    ['free', 1, true],
    ['free', 2, true],
    ['starter', 0, false],
    ['starter', 1, true],
    ['starter', 2, true],
    ['pro', 0, false],
    ['pro', 2, false],
    ['pro', 3, true],
    ['pro', 4, true],
  ])('%s with %i site(s) -> reached=%s (unchanged limits)', (plan, count, reached) => {
    expect(isSiteLimitReached(plan, count)).toBe(reached);
  });

  it('agency is unlimited: never reached, even at large counts', () => {
    for (const count of [0, 1, 3, 100, 10_000, Number.MAX_SAFE_INTEGER]) {
      expect(isSiteLimitReached('agency', count)).toBe(false);
    }
    expect(isSiteLimitReached('Agency', 5)).toBe(false);
  });

  it('treats unknown or missing plans as free', () => {
    expect(isSiteLimitReached('bogus', 0)).toBe(false);
    expect(isSiteLimitReached('bogus', 1)).toBe(true);
    expect(isSiteLimitReached(undefined, 1)).toBe(true);
    expect(isSiteLimitReached(null, 1)).toBe(true);
  });
});

describe('getSiteLimitMessage', () => {
  it('uses singular and plural wording for limited plans', () => {
    expect(getSiteLimitMessage('free')).toBe('This plan allows up to 1 site.');
    expect(getSiteLimitMessage('starter')).toBe('This plan allows up to 1 site.');
    expect(getSiteLimitMessage('pro')).toBe('This plan allows up to 3 sites.');
  });

  it('agency shows the unlimited message (never "up to 1" or "up to null")', () => {
    const message = getSiteLimitMessage('agency');
    expect(message).toBe('Unlimited sites available on Agency plan.');
    expect(message).not.toMatch(/up to|null|Infinity/);
  });

  it('unknown plans get the free-plan message', () => {
    expect(getSiteLimitMessage('bogus')).toBe('This plan allows up to 1 site.');
    expect(getSiteLimitMessage(undefined)).toBe('This plan allows up to 1 site.');
  });
});
