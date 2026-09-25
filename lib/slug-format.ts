/**
 * Pure, client-safe slug helpers (no server imports), shared by `lib/slug.ts`
 * (publish path) and `components/SitePreview.tsx` (draft insert).
 */

/** Maximum slug length: a DNS label is at most 63 characters. */
export const MAX_SLUG_LENGTH = 63;

/** A valid slug: lowercase a-z, 0-9 and inner hyphens, 1-63 chars, no leading/trailing hyphen. */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const RESERVED_SLUGS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'dashboard',
  'login',
  'auth',
  'signup',
  'sign-up',
  'pricing',
  'docs',
  'help',
  'support',
  'contact',
  'blog',
  'status',
  'webhook',
  'cdn',
  'mail',
  'ftp',
  'smtp',
  'imap',
  'pop',
  'ssh',
  'vpn',
  'git',
  'svn',
]);

// Latin letters that NFKD does not decompose into base letter + combining mark.
const SPECIAL_LATIN: Record<string, string> = {
  ß: 'ss',
  æ: 'ae',
  ø: 'o',
  œ: 'oe',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ħ: 'h',
  ı: 'i',
  ŀ: 'l',
  ŧ: 't',
  ŋ: 'n',
  ĸ: 'k',
  ſ: 's',
};
const SPECIAL_LATIN_PATTERN = new RegExp(`[${Object.keys(SPECIAL_LATIN).join('')}]`, 'g');

// Characters treated as word separators (become a hyphen). Everything else outside
// [a-z0-9] (apostrophes, "&", "!", etc.) is removed, e.g. "John's" -> "johns".
const SEPARATOR_PATTERN = /[\s_\-./\\,:;|+·–—]+/g;

function trimHyphens(value: string): string {
  return value.replace(/^-+|-+$/g, '');
}

/** Short deterministic hash (FNV-1a, 32-bit, base36) used for the empty-slug fallback. */
function shortHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Generate a URL- and DNS-safe slug from a business name.
 *
 * - Accents are transliterated (NFKD + strip combining marks, plus common Latin letters
 *   that don't decompose, e.g. ß -> ss, ø -> o).
 * - Output contains only [a-z0-9-], has no leading/trailing or repeated hyphens, and is at
 *   most 63 characters.
 * - If nothing usable remains (e.g. a name written only in a non-Latin script), returns a
 *   deterministic `site-<hash>` fallback. Uniqueness is still handled by findUniqueSlug().
 */
export function generateSlug(businessName: string): string {
  const slug = trimHyphens(
    businessName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/\p{M}+/gu, '')
      .replace(SPECIAL_LATIN_PATTERN, (char) => SPECIAL_LATIN[char] ?? '')
      .replace(SEPARATOR_PATTERN, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-'),
  );

  const capped = trimHyphens(slug.slice(0, MAX_SLUG_LENGTH));
  if (capped) return capped;

  return `site-${shortHash(businessName.trim())}`;
}

/** Check if a slug is reserved (exact, case-insensitive match against the reserved list). */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** Whether a value is a well-formed slug (see SLUG_PATTERN). Does not check the reserved list. */
export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/**
 * Append `-<suffix>` to a slug, truncating the base first so the result stays within
 * MAX_SLUG_LENGTH and never has a hyphen before the suffix separator.
 */
export function appendSlugSuffix(baseSlug: string, suffix: string): string {
  const room = MAX_SLUG_LENGTH - suffix.length - 1;
  const base = trimHyphens(baseSlug.slice(0, Math.max(room, 0)));
  return base ? `${base}-${suffix}` : suffix;
}
