import { createClient } from './supabase/server';
import { appendSlugSuffix, isReservedSlug, isValidSlug } from './slug-format';

export {
  MAX_SLUG_LENGTH,
  SLUG_PATTERN,
  appendSlugSuffix,
  generateSlug,
  isReservedSlug,
  isValidSlug,
} from './slug-format';

/**
 * Find a unique slug by appending a counter if necessary (`-2` … `-maxAttempts`).
 * Returns null for reserved or malformed base slugs, or when every candidate is taken.
 * Suffixed candidates are truncated to stay within the 63-character DNS label limit.
 */
export async function findUniqueSlug(
  baseSlug: string,
  maxAttempts = 10,
): Promise<string | null> {
  if (!isValidSlug(baseSlug) || isReservedSlug(baseSlug)) return null;

  const supabase = await createClient();

  // Check if base slug is free
  const { data: existing } = await supabase
    .from('sites')
    .select('id')
    .eq('slug', baseSlug)
    .limit(1);

  if (!existing || existing.length === 0) {
    return baseSlug;
  }

  // Try numbered variants
  for (let i = 2; i <= maxAttempts; i++) {
    const candidateSlug = appendSlugSuffix(baseSlug, String(i));
    const { data: exists } = await supabase
      .from('sites')
      .select('id')
      .eq('slug', candidateSlug)
      .limit(1);

    if (!exists || exists.length === 0) {
      return candidateSlug;
    }
  }

  return null;
}
