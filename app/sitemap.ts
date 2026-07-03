import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

type PublishedSiteRow = {
  slug: string;
  updated_at: string | null;
  custom_domain: string | null;
  domain_verified: boolean | null;
  domain_attached: boolean | null;
};

const ROOT_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sitespresso.com').replace(/\/$/, '');

function addEntry(
  entries: MetadataRoute.Sitemap,
  seen: Set<string>,
  url: string,
  lastModified: Date,
  changeFrequency: 'daily' | 'weekly',
  priority: number
): void {
  if (seen.has(url)) return;
  seen.add(url);
  entries.push({ url, lastModified, changeFrequency, priority });
}

async function getPublishedSites(): Promise<PublishedSiteRow[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('sites')
      .select('slug, updated_at, custom_domain, domain_verified, domain_attached')
      .eq('status', 'published');

    if (error || !data) return [];
    return data as PublishedSiteRow[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  addEntry(entries, seen, ROOT_URL, now, 'weekly', 1.0);

  const sites = await getPublishedSites();

  for (const site of sites) {
    const slug = site.slug?.trim();
    if (!slug) continue;

    const lastModified = site.updated_at ? new Date(site.updated_at) : now;

    addEntry(entries, seen, `${ROOT_URL}/sites/${slug}`, lastModified, 'weekly', 0.9);
    addEntry(entries, seen, `${ROOT_URL}/sites/${slug}/about`, lastModified, 'weekly', 0.8);
    addEntry(entries, seen, `${ROOT_URL}/sites/${slug}/contact`, lastModified, 'weekly', 0.8);

    const customDomain = site.custom_domain?.trim().toLowerCase();
    if (customDomain && site.domain_verified === true && site.domain_attached === true) {
      addEntry(entries, seen, `https://${customDomain}/`, lastModified, 'weekly', 0.9);
      addEntry(entries, seen, `https://${customDomain}/about`, lastModified, 'weekly', 0.8);
      addEntry(entries, seen, `https://${customDomain}/contact`, lastModified, 'weekly', 0.8);
    }
  }

  return entries;
}