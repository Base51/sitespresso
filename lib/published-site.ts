import { unstable_cache } from 'next/cache';
import { normalizeWebsiteContent, type Website } from '@/lib/schemas/website';
import { createAdminClient } from '@/lib/supabase/admin';

type PublishedSiteRow = {
  content: unknown;
  status: string;
};

const getPublishedSiteBySlugCached = unstable_cache(
  async (slug: string): Promise<Website | null> => {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('sites')
      .select('content, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !data) return null;
    const row = data as PublishedSiteRow;
    return normalizeWebsiteContent(row.content);
  },
  ['published-site-by-slug-v1'],
  { revalidate: 60 },
);

export async function getPublishedSiteBySlug(slug: string): Promise<Website | null> {
  return getPublishedSiteBySlugCached(slug);
}
