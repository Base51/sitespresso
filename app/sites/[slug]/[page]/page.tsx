import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import type { Website } from '@/lib/schemas/website';
import { getPublishedSiteBySlug } from '@/lib/published-site';
import { normalizeLanguage } from '@/lib/i18n/languages';
import PageViewTracker from '@/components/PageViewTracker';

interface PageProps {
  params: { slug: string; page: string };
}

const ROOT_DOMAIN = 'sitespresso.com';
const PRIMARY_APP_HOSTS = new Set([ROOT_DOMAIN, `www.${ROOT_DOMAIN}`, 'localhost', '127.0.0.1']);
const PUBLISHED_PAGES = new Set(['about', 'contact']);
const PAGE_LABELS: Record<'about' | 'contact', string> = {
  about: 'About',
  contact: 'Contact',
};

type SectionKey = 'about' | 'services' | 'contact';
const DEFAULT_SECTION_BACKGROUNDS: Record<SectionKey, string> = {
  about: '#ffffff',
  services: '#f8fafc',
  contact: '#ffffff',
};

const getSiteBySlug = async (slug: string): Promise<Website | null> => getPublishedSiteBySlug(slug);

function resolvePublishedSiteUrl(slug: string, page: 'about' | 'contact'): string {
  const fallbackBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sitespresso.com').replace(/\/$/, '');
  const fallbackPath = `/sites/${slug}/${page}`;
  const headerStore = headers();
  const rawHost = headerStore.get('x-forwarded-host') || headerStore.get('host') || '';
  const hostname = rawHost.split(':')[0]?.toLowerCase().replace(/\.$/, '') || '';

  if (
    !hostname ||
    PRIMARY_APP_HOSTS.has(hostname) ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.vercel.dev') ||
    hostname.endsWith('.vercel.local')
  ) {
    return `${fallbackBaseUrl}${fallbackPath}`;
  }

  const protocol = headerStore.get('x-forwarded-proto') || (hostname === 'localhost' ? 'http' : 'https');
  return `${protocol}://${hostname}/${page}`;
}

function resolvePublishedNavPath(slug: string, target: 'home' | 'about' | 'contact'): string {
  const headerStore = headers();
  const rawHost = headerStore.get('x-forwarded-host') || headerStore.get('host') || '';
  const hostname = rawHost.split(':')[0]?.toLowerCase().replace(/\.$/, '') || '';

  const isPrimaryHost =
    !hostname ||
    PRIMARY_APP_HOSTS.has(hostname) ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.vercel.dev') ||
    hostname.endsWith('.vercel.local');

  if (isPrimaryHost) {
    if (target === 'home') return `/sites/${slug}`;
    return `/sites/${slug}/${target}`;
  }

  if (target === 'home') return '/';
  return `/${target}`;
}

function resolvePageDescription(site: Website, page: 'about' | 'contact'): string {
  if (page === 'about') {
    return site.pages?.about?.seo?.description?.trim() || site.pages?.about?.about?.content?.trim() || site.about.content;
  }

  return site.pages?.contact?.seo?.description?.trim() || site.contact.hours?.trim() || site.tagline;
}

function sanitizeMapEmbedUrl(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (!/^https:\/\//i.test(raw)) return null;
  if (/^javascript:/i.test(raw)) return null;

  const lower = raw.toLowerCase();
  if (!lower.includes('google.com/maps') && !lower.includes('google.com/maps/embed') && !lower.includes('maps.google.com')) {
    return null;
  }

  return raw;
}

function sanitizeBookingEmbedUrl(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (!/^https:\/\//i.test(raw)) return null;
  if (/^javascript:/i.test(raw)) return null;

  const lower = raw.toLowerCase();
  if (!lower.includes('calendly.com')) {
    return null;
  }

  return raw;
}

function sanitizeGoogleBusinessProfileEmbedUrl(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (!/^https:\/\//i.test(raw)) return null;
  if (/^javascript:/i.test(raw)) return null;

  const lower = raw.toLowerCase();
  if (!lower.includes('google.com')) {
    return null;
  }

  if (!lower.includes('/maps/embed') && !lower.includes('maps.google.com')) {
    return null;
  }

  return raw;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!PUBLISHED_PAGES.has(params.page)) {
    return { title: 'Not Found' };
  }

  const page = params.page as 'about' | 'contact';
  const site = await getSiteBySlug(params.slug);
  if (!site) return { title: 'Not Found' };

  const label = PAGE_LABELS[page];
  const title = site.pages?.[page]?.seo?.title?.trim() || `${site.business_name} | ${label}`;
  const description = resolvePageDescription(site, page);
  const url = resolvePublishedSiteUrl(params.slug, page);
  const heroImage = site.hero.hero_image_url?.trim();

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: site.business_name,
      type: 'website',
      ...(heroImage ? { images: [heroImage] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(heroImage ? { images: [heroImage] } : {}),
    },
  };
}

export default async function PublishedSiteSubPage({ params }: PageProps) {
  const renderStart = performance.now();
  if (!PUBLISHED_PAGES.has(params.page)) {
    notFound();
  }

  const page = params.page as 'about' | 'contact';
  const site = await getSiteBySlug(params.slug);
  if (!site) notFound();
  const dataFetchMs = performance.now() - renderStart;

  const { color_scheme } = site;
  const primary = color_scheme.primary;
  const siteLanguage = normalizeLanguage(site.language);

  const fontFamilyMap: Record<string, string> = {
    'Playfair Display': '"Playfair Display", serif',
    Lora: '"Lora", serif',
    Georgia: '"Georgia", serif',
    Inter: '"Inter", sans-serif',
    Roboto: '"Roboto", sans-serif',
    Poppins: '"Poppins", sans-serif',
  };
  const googleFontsSet = new Set(['Playfair Display', 'Lora', 'Inter', 'Roboto', 'Poppins']);
  const headingFont = site.fonts?.heading || 'Playfair Display';
  const bodyFont = site.fonts?.body || 'Inter';
  const headingCss = fontFamilyMap[headingFont] || '"Playfair Display", serif';
  const bodyCss = fontFamilyMap[bodyFont] || '"Inter", sans-serif';
  const googleFamilies: string[] = [];
  if (googleFontsSet.has(headingFont)) googleFamilies.push(headingFont.replace(' ', '+') + ':ital,wght@0,400;0,700;1,400');
  if (googleFontsSet.has(bodyFont) && bodyFont !== headingFont) googleFamilies.push(bodyFont.replace(' ', '+') + ':wght@400;500;600');
  const googleFontsUrl = googleFamilies.length
    ? `https://fonts.googleapis.com/css2?${googleFamilies.map(f => `family=${f}`).join('&')}&display=swap`
    : null;

  const aboutSection = {
    ...site.about,
    ...(site.pages?.about?.about ?? {}),
  };

  const contactSection = {
    ...site.contact,
    ...(site.pages?.about?.contact ?? {}),
    ...(site.pages?.contact?.contact ?? {}),
  };

  const sectionOrder: SectionKey[] = page === 'about' ? ['about', 'contact'] : ['contact'];

  const pageUrl = resolvePublishedSiteUrl(params.slug, page);
  const websitePath = resolvePublishedNavPath(params.slug, 'home');
  const absoluteWebsiteUrl = (() => {
    if (/^https?:\/\//i.test(websitePath)) return websitePath;
    const origin = new URL(pageUrl).origin;
    return `${origin}${websitePath}`;
  })();

  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page === 'about' ? `${site.business_name} About` : `${site.business_name} Contact`,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: site.business_name,
      url: absoluteWebsiteUrl,
    },
    ...(page === 'about'
      ? {
          description: site.pages?.about?.seo?.description?.trim() || aboutSection.content,
          mainEntity: {
            '@type': 'Organization',
            name: site.business_name,
          },
        }
      : {
          description: site.pages?.contact?.seo?.description?.trim() || site.contact.hours || site.tagline,
          mainEntity: {
            '@type': 'ContactPage',
            name: `${site.business_name} Contact`,
          },
        }),
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.business_name,
    url: absoluteWebsiteUrl,
    ...(site.logo?.url && { logo: site.logo.url }),
    ...((contactSection.email || contactSection.phone)
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            ...(contactSection.email && { email: contactSection.email }),
            ...(contactSection.phone && { telephone: contactSection.phone }),
          },
        }
      : {}),
  };

  const renderPrepMs = performance.now() - renderStart;

  const contentSections: Record<SectionKey, ReactNode> = {
    about: (
      <section
        className="px-6 py-14 text-slate-800 md:px-16"
        style={{
          backgroundColor:
            site.layout?.section_backgrounds?.about ||
            DEFAULT_SECTION_BACKGROUNDS.about,
        }}
      >
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold" style={{ color: primary, fontFamily: headingCss }}>
            {aboutSection.title}
          </h2>
          <p className="leading-relaxed text-slate-600" style={{ fontFamily: bodyCss }}>{aboutSection.content}</p>
          {aboutSection.cta_text && (
            <a
              href={aboutSection.cta_url || '#'}
              className="inline-block rounded-lg px-5 py-2 font-semibold text-white transition hover:opacity-90"
              style={{ background: primary }}
            >
              {aboutSection.cta_text}
            </a>
          )}
        </div>
      </section>
    ),
    services: <></>,
    contact: (
      <section
        className="px-6 py-14 md:px-16"
        style={{
          backgroundColor:
            site.layout?.section_backgrounds?.contact ||
            DEFAULT_SECTION_BACKGROUNDS.contact,
        }}
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold" style={{ color: primary, fontFamily: headingCss }}>
            {contactSection.title}
          </h2>
          <div className="space-y-3 text-slate-600" style={{ fontFamily: bodyCss }}>
            {contactSection.phone && (
              <div className="flex gap-2">
                <span>📞</span>
                <span>{contactSection.phone}</span>
              </div>
            )}
            {contactSection.email && (
              <div className="flex gap-2">
                <span>✉️</span>
                <a href={`mailto:${contactSection.email}`} className="hover:underline">
                  {contactSection.email}
                </a>
              </div>
            )}
            {contactSection.address && (
              <div className="flex gap-2">
                <span>📍</span>
                <span>{contactSection.address}</span>
              </div>
            )}
            {contactSection.hours && (
              <div className="flex gap-2">
                <span>🕐</span>
                <span>{contactSection.hours}</span>
              </div>
            )}
          </div>

          {sanitizeMapEmbedUrl(contactSection.map_embed_url) && (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <iframe
                src={sanitizeMapEmbedUrl(contactSection.map_embed_url) || undefined}
                title={`${site.business_name} location map`}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          {sanitizeBookingEmbedUrl(contactSection.booking_embed_url) && (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <iframe
                src={sanitizeBookingEmbedUrl(contactSection.booking_embed_url) || undefined}
                title={`${site.business_name} booking widget`}
                className="h-[700px] w-full"
                loading="lazy"
              />
            </div>
          )}

          {sanitizeGoogleBusinessProfileEmbedUrl(contactSection.google_business_profile_embed_url) && (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <iframe
                src={sanitizeGoogleBusinessProfileEmbedUrl(contactSection.google_business_profile_embed_url) || undefined}
                title={`${site.business_name} Google Business Profile`}
                className="h-[520px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>
      </section>
    ),
  };

  return (
    <main
      lang={siteLanguage}
      className="w-full overflow-hidden bg-white text-slate-900"
      data-sitespresso-data-ms={dataFetchMs.toFixed(1)}
      data-sitespresso-render-ms={renderPrepMs.toFixed(1)}
    >
      <PageViewTracker slug={params.slug} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}

      <nav className="border-b border-slate-200 bg-white px-6 py-4 md:px-16">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-6 text-sm font-medium text-slate-600">
          {(['home', 'about', 'contact'] as const).map((target) => {
            const isActive = target === page;
            return (
              <a
                key={target}
                href={resolvePublishedNavPath(params.slug, target)}
                className="transition hover:text-slate-900"
                style={isActive ? { color: primary } : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                {target === 'home' ? 'Home' : target === 'about' ? 'About' : 'Contact'}
              </a>
            );
          })}
        </div>
      </nav>

      {sectionOrder.map((sectionKey) => (
        <div key={sectionKey}>{contentSections[sectionKey]}</div>
      ))}

      <footer
        className="px-6 py-6 text-center text-sm text-white/80"
        style={{ background: primary }}
      >
        © {new Date().getFullYear()} {site.business_name}. Powered by{' '}
        <span className="font-semibold text-white">SiteSpresso</span>
      </footer>
    </main>
  );
}
