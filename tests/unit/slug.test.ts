import { beforeEach, describe, expect, it, vi } from 'vitest';

// findUniqueSlug() queries Supabase. Replace the server client with an in-memory fake
// so the collision logic can be tested without a database, cookies or network.
const takenSlugs = new Set<string>();
const queriedSlugs: string[] = [];

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: (_column: string, slug: string) => ({
          limit: async () => {
            queriedSlugs.push(slug);
            return { data: takenSlugs.has(slug) ? [{ id: `id-${slug}` }] : [], error: null };
          },
        }),
      }),
    }),
  }),
}));

const { generateSlug, isReservedSlug, findUniqueSlug } = await import('@/lib/slug');

describe('generateSlug', () => {
  it.each([
    // T-084.4 cases from docs/edge-case-test-plan.md
    ["John's Coffee Shop", 'johns-coffee-shop'],
    ["Jane's Coffee Shop", 'janes-coffee-shop'],
    ['A&B Solutions', 'ab-solutions'],
    ['Test---Multiple---Hyphens', 'test-multiple-hyphens'],
    ['  Leading spaces  ', 'leading-spaces'],
    ['ALL-CAPS SLUG', 'all-caps-slug'],
    // Additional cases carried over from scripts/test-slug-edge-cases.mjs
    ['Smith & Co.', 'smith-co'],
    ['123 Numbers 456', '123-numbers-456'],
    ["O'Reilly's Shop", 'oreillys-shop'],
    ['Tabs\tand\nnewlines', 'tabs-and-newlines'],
    ['- Leading and trailing -', 'leading-and-trailing'],
  ])('%j -> %j', (input, expected) => {
    expect(generateSlug(input)).toBe(expected);
  });

  it('returns an empty string for whitespace-only or punctuation-only input', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug('   ')).toBe('');
    expect(generateSlug('---!!!')).toBe('');
  });

  it('is idempotent on an already clean slug', () => {
    expect(generateSlug('janes-salon')).toBe('janes-salon');
  });

  // Suspected bugs, left as todos (no app-code changes in this PR). Current behaviour:
  //   generateSlug('Café Lisboa') === 'caf-lisboa', generateSlug('São Paulo') === 'so-paulo'
  //   (\w is ASCII-only, so accented letters are dropped rather than transliterated).
  it.todo('transliterates accented Latin letters (e.g. "Café Lisboa" -> "cafe-lisboa")');
  //   generateSlug('東京寿司') === '' -> the publish route does not reject an empty base slug.
  it.todo('never produces an empty slug for a non-empty business name (e.g. non-Latin scripts)');
  //   generateSlug('My_Shop') === 'my_shop' (\w keeps "_", which is not valid in hostnames).
  it.todo('replaces underscores, which are not valid in subdomain hostnames');
  //   No length cap: a 100-char name yields a 100-char slug; DNS labels allow at most 63.
  it.todo('caps slug length at the 63-character DNS label limit');
});

describe('isReservedSlug', () => {
  const reserved = [
    'www', 'app', 'api', 'admin', 'dashboard', 'login', 'auth', 'signup', 'sign-up',
    'pricing', 'docs', 'help', 'support', 'contact', 'blog', 'status', 'webhook', 'cdn',
    'mail', 'ftp', 'smtp', 'imap', 'pop', 'ssh', 'vpn', 'git', 'svn',
  ];

  it.each(reserved)('%s is reserved', (slug) => {
    expect(isReservedSlug(slug)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isReservedSlug('API')).toBe(true);
    expect(isReservedSlug('Admin')).toBe(true);
    expect(isReservedSlug('DASHBOARD')).toBe(true);
  });

  it('does not reserve ordinary slugs', () => {
    expect(isReservedSlug('my-business')).toBe(false);
    expect(isReservedSlug('')).toBe(false);
  });

  it('only matches whole slugs (names that merely start with a reserved word are allowed)', () => {
    // Current behaviour. docs/edge-case-test-plan.md T-084.1 lists "Admin Services" and
    // "API Solutions" as reserved examples, but they slugify to non-reserved slugs.
    expect(isReservedSlug(generateSlug('Admin Services'))).toBe(false);
    expect(isReservedSlug(generateSlug('API Solutions'))).toBe(false);
    expect(isReservedSlug(generateSlug('www-something'))).toBe(false);
    expect(isReservedSlug(generateSlug('Admin'))).toBe(true);
    expect(isReservedSlug(generateSlug('  API  '))).toBe(true);
  });
});

describe('findUniqueSlug (Supabase client mocked)', () => {
  beforeEach(() => {
    takenSlugs.clear();
    queriedSlugs.length = 0;
  });

  it('returns null for a reserved slug without querying the database', async () => {
    await expect(findUniqueSlug('admin')).resolves.toBeNull();
    expect(queriedSlugs).toEqual([]);
  });

  it('returns the base slug when it is free (T-084.2 first site)', async () => {
    await expect(findUniqueSlug('janes-salon')).resolves.toBe('janes-salon');
    expect(queriedSlugs).toEqual(['janes-salon']);
  });

  it('appends -2 when the base slug is taken (T-084.2 second site)', async () => {
    takenSlugs.add('janes-salon');
    await expect(findUniqueSlug('janes-salon')).resolves.toBe('janes-salon-2');
  });

  it('skips taken numbered variants in order', async () => {
    ['plumber', 'plumber-2', 'plumber-3'].forEach((slug) => takenSlugs.add(slug));
    await expect(findUniqueSlug('plumber')).resolves.toBe('plumber-4');
    expect(queriedSlugs).toEqual(['plumber', 'plumber-2', 'plumber-3', 'plumber-4']);
  });

  it('returns null once the base slug and -2..-10 are all taken (T-084.3, maxAttempts = 10)', async () => {
    takenSlugs.add('plumber');
    for (let i = 2; i <= 10; i++) takenSlugs.add(`plumber-${i}`);
    await expect(findUniqueSlug('plumber')).resolves.toBeNull();
    expect(queriedSlugs).toHaveLength(10);
    expect(queriedSlugs).not.toContain('plumber-11');
  });

  it('honours a custom maxAttempts', async () => {
    takenSlugs.add('cafe');
    takenSlugs.add('cafe-2');
    await expect(findUniqueSlug('cafe', 2)).resolves.toBeNull();
    await expect(findUniqueSlug('cafe', 3)).resolves.toBe('cafe-3');
  });
});
