import { createClient } from './supabase/server';

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

/**
 * Generate a URL-safe slug from business name.
 */
export function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if a slug is reserved.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Find a unique slug by appending a counter if necessary.
 */
export async function findUniqueSlug(
  baseSlug: string,
  maxAttempts = 10,
): Promise<string | null> {
  if (isReservedSlug(baseSlug)) return null;

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
    const candidateSlug = `${baseSlug}-${i}`;
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
