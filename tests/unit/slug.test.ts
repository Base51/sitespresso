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

const { MAX_SLUG_LENGTH, appendSlugSuffix, findUniqueSlug, generateSlug, isReservedSlug, isValidSlug } =
  await import('@/lib/slug');

const SLUG_SHAPE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

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

  it('never returns an empty slug: empty, whitespace-only or punctuation-only input gets a valid site-<hash> fallback', () => {
    // Changed expectation: these used to return '' (NEXT_ACTIONS item 8).
    for (const input of ['', '   ', '---!!!', '___']) {
      const slug = generateSlug(input);
      expect(slug).toMatch(/^site-[a-z0-9]+$/);
      expect(slug).toMatch(SLUG_SHAPE);
    }
  });

  it('is idempotent on an already clean slug', () => {
    expect(generateSlug('janes-salon')).toBe('janes-salon');
  });

  describe('transliterates accented Latin letters', () => {
    it.each([
      // Portuguese
      ['Café Lisboa', 'cafe-lisboa'],
      ['São Paulo', 'sao-paulo'],
      ['Açaí', 'acai'],
      ['Pastelaria Conceição & Irmãos', 'pastelaria-conceicao-irmaos'],
      // Spanish
      ['Peluquería Muñoz', 'peluqueria-munoz'],
      ['Jalapeño Niño', 'jalapeno-nino'],
      // French
      ['Crème Brûlée Pâtisserie', 'creme-brulee-patisserie'],
      ['Garçon Français', 'garcon-francais'],
      ['Œuvre Cœur', 'oeuvre-coeur'],
      // German
      ['Bäckerei Müller', 'backerei-muller'],
      ['Straße & Söhne', 'strasse-sohne'],
      ['GROẞE Brötchen', 'grosse-brotchen'],
      // Nordic / other Latin letters that don't decompose
      ['Smørrebrød', 'smorrebrod'],
      ['Ærø Æble', 'aero-aeble'],
      ['Łódź Pierogi', 'lodz-pierogi'],
      ['Đurđevac', 'durdevac'],
      ['Þórður Guðmundsson', 'thordur-gudmundsson'],
      // Compatibility forms
      ['ﬁne Ｃafé', 'fine-cafe'],
    ])('%j -> %j', (input, expected) => {
      expect(generateSlug(input)).toBe(expected);
    });
  });

  describe('separators', () => {
    it.each([
      ['My_Shop', 'my-shop'],
      ['snake_case__name', 'snake-case-name'],
      ['Joe.Coffee', 'joe-coffee'],
      ['Dr. Smith', 'dr-smith'],
      ['Food/Drink', 'food-drink'],
      ['Bar | Grill', 'bar-grill'],
      ['Café — Bar', 'cafe-bar'],
      ['3.5 Stars', '3-5-stars'],
    ])('%j -> %j', (input, expected) => {
      expect(generateSlug(input)).toBe(expected);
    });
  });

  describe('length cap (63-char DNS label)', () => {
    it('caps long names at 63 characters', () => {
      const slug = generateSlug('a'.repeat(100));
      expect(slug).toBe('a'.repeat(63));
      expect(slug).toMatch(SLUG_SHAPE);
    });

    it('trims a trailing hyphen left by the cut', () => {
      // 62 chars + space: the cut at 63 would land on the hyphen.
      const slug = generateSlug(`${'b'.repeat(62)} tail`);
      expect(slug).toBe('b'.repeat(62));
      expect(slug).toMatch(SLUG_SHAPE);
    });

    it('keeps long multi-word names valid', () => {
      const slug = generateSlug(
        'The Very Long Name Of A Family Owned Portuguese Bakery And Coffee Shop In Lisbon Since 1920',
      );
      expect(slug.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
      expect(slug).toMatch(SLUG_SHAPE);
      expect(slug.startsWith('the-very-long-name-of-a-family-owned')).toBe(true);
    });
  });

  describe('non-Latin names get a valid, deterministic fallback', () => {
    it.each(['東京カフェ', 'Москва', 'مطعم', '🍕🍕🍕'])('%j', (input) => {
      const slug = generateSlug(input);
      expect(slug).toMatch(/^site-[a-z0-9]+$/);
      expect(slug).toMatch(SLUG_SHAPE);
      expect(isReservedSlug(slug)).toBe(false);
      expect(generateSlug(input)).toBe(slug); // deterministic
    });

    it('different names get different fallbacks', () => {
      expect(generateSlug('東京カフェ')).not.toBe(generateSlug('Москва'));
    });

    it('mixed scripts keep the Latin part', () => {
      expect(generateSlug('Sushi 東京')).toBe('sushi');
    });
  });

  it('leading digits are allowed; output never starts or ends with a hyphen', () => {
    expect(generateSlug('24/7 Plumbing')).toBe('24-7-plumbing');
    for (const input of ['-x-', '__init__', ' ...dots... ', '—Café—']) {
      expect(generateSlug(input)).toMatch(SLUG_SHAPE);
    }
  });

  it.each([
    "John's Coffee Shop",
    'Café Lisboa',
    'Straße & Söhne',
    'My_Shop',
    '東京カフェ',
    'a'.repeat(100),
    `${'b'.repeat(62)} tail`,
    '',
  ])('is idempotent: generateSlug(generateSlug(%j)) === generateSlug(%j)', (input) => {
    const once = generateSlug(input);
    expect(generateSlug(once)).toBe(once);
  });
});

describe('appendSlugSuffix', () => {
  it('appends -suffix to short slugs', () => {
    expect(appendSlugSuffix('plumber', '2')).toBe('plumber-2');
  });

  it('truncates the base so the result stays within 63 characters', () => {
    const base = 'c'.repeat(63);
    expect(appendSlugSuffix(base, '10')).toBe(`${'c'.repeat(60)}-10`);
    expect(appendSlugSuffix(base, '10')).toHaveLength(63);
    expect(appendSlugSuffix(base, 'abcd1234')).toHaveLength(63);
  });

  it('does not leave a double hyphen when the cut lands on a hyphen', () => {
    const base = `${'d'.repeat(60)}-ee`; // 63 chars; cut at 61 ends with "-"
    const result = appendSlugSuffix(base, '2');
    expect(result).toBe(`${'d'.repeat(60)}-2`);
    expect(result).toMatch(SLUG_SHAPE);
  });
});

describe('isValidSlug', () => {
  it.each(['a', 'abc', 'a-b', '123', `${'a'.repeat(63)}`, 'site-1x2y3z'])('accepts %j', (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it.each(['', '-a', 'a-', 'A', 'a_b', 'café', 'a b', `${'a'.repeat(64)}`])('rejects %j', (slug) => {
    expect(isValidSlug(slug)).toBe(false);
  });
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
    // Reserved matching is exact (whole slug), as documented in docs/edge-case-test-plan.md T-084.1.
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

  it('returns null for a malformed base slug (e.g. empty) without querying the database', async () => {
    await expect(findUniqueSlug('')).resolves.toBeNull();
    await expect(findUniqueSlug('-bad-')).resolves.toBeNull();
    expect(queriedSlugs).toEqual([]);
  });

  it('keeps -N candidates within 63 characters for a 63-char base', async () => {
    const base = generateSlug('e'.repeat(80));
    expect(base).toHaveLength(63);
    takenSlugs.add(base);
    const result = await findUniqueSlug(base);
    expect(result).toBe(`${'e'.repeat(61)}-2`);
    expect(result).toMatch(SLUG_SHAPE);
  });

  it('a non-Latin name fallback works with the -N suffix', async () => {
    const base = generateSlug('東京カフェ');
    takenSlugs.add(base);
    await expect(findUniqueSlug(base)).resolves.toBe(`${base}-2`);
  });

  it('honours a custom maxAttempts', async () => {
    takenSlugs.add('cafe');
    takenSlugs.add('cafe-2');
    await expect(findUniqueSlug('cafe', 2)).resolves.toBeNull();
    await expect(findUniqueSlug('cafe', 3)).resolves.toBe('cafe-3');
  });
});
