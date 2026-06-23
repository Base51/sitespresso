import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Website } from '@/lib/schemas/website';

interface PageProps {
  params: { slug: string };
}

type SectionKey = 'about' | 'services' | 'contact';
const DEFAULT_SECTION_ORDER: SectionKey[] = ['about', 'services', 'contact'];
const DEFAULT_SECTION_BACKGROUNDS: Record<SectionKey, string> = {
  about: '#ffffff',
  services: '#f8fafc',
  contact: '#ffffff',
};

async function getSiteBySlug(slug: string): Promise<Website | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sites')
    .select('content, status')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;
  return data.content as Website;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const site = await getSiteBySlug(params.slug);
  if (!site) return { title: 'Not Found' };

  const title = `${site.business_name} | ${site.business_type}`;
  const description = site.tagline?.trim() || site.hero.content?.trim() || `Visit ${site.business_name}.`;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sitespresso.com').replace(/\/$/, '');
  const canonicalPath = `/sites/${params.slug}`;
  const url = `${baseUrl}${canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: site.business_name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PublishedSitePage({ params }: PageProps) {
  const site = await getSiteBySlug(params.slug);
  if (!site) notFound();

  const { color_scheme } = site;
  const primary = color_scheme.primary;
  const secondary = color_scheme.secondary;

  // Google Fonts for selected fonts
  const fontFamilyMap: Record<string, string> = {
    'Playfair Display': '"Playfair Display", serif',
    'Lora': '"Lora", serif',
    'Georgia': '"Georgia", serif',
    'Inter': '"Inter", sans-serif',
    'Roboto': '"Roboto", sans-serif',
    'Poppins': '"Poppins", sans-serif',
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

  const heroCtaHref = (() => {
    const raw = site.hero.cta_url?.trim();
    if (!raw) return '#';
    if (raw.startsWith('#') || raw.startsWith('/')) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^javascript:/i.test(raw)) return '#';
    return `https://${raw}`;
  })();

  const sectionOrder = (() => {
    const customOrder = site.layout?.section_order;
    if (!customOrder || customOrder.length !== DEFAULT_SECTION_ORDER.length) {
      return DEFAULT_SECTION_ORDER;
    }

    const validOrder = customOrder.filter((section): section is SectionKey =>
      DEFAULT_SECTION_ORDER.includes(section as SectionKey)
    );

    if (validOrder.length !== DEFAULT_SECTION_ORDER.length) {
      return DEFAULT_SECTION_ORDER;
    }

    const deduped = Array.from(new Set(validOrder));
    if (deduped.length !== DEFAULT_SECTION_ORDER.length) {
      return DEFAULT_SECTION_ORDER;
    }

    return deduped;
  })();

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
            {site.about.title}
          </h2>
          <p className="leading-relaxed text-slate-600" style={{ fontFamily: bodyCss }}>{site.about.content}</p>
          {site.about.cta_text && (
            <a
              href={site.about.cta_url || '#'}
              className="inline-block rounded-lg px-5 py-2 font-semibold text-white transition hover:opacity-90"
              style={{ background: primary }}
            >
              {site.about.cta_text}
            </a>
          )}
        </div>
      </section>
    ),
    services: (
      <section
        className="px-6 py-14 md:px-16"
        style={{
          backgroundColor:
            site.layout?.section_backgrounds?.services ||
            DEFAULT_SECTION_BACKGROUNDS.services,
        }}
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-bold text-slate-800" style={{ fontFamily: headingCss }}>
            {site.services.title}
          </h2>
          <p className="mb-8 text-center text-slate-500" style={{ fontFamily: bodyCss }}>{site.services.description}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {site.services.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                style={{ borderTop: `3px solid ${primary}` }}
              >
                <h3 className="mb-1 font-semibold text-slate-800" style={{ fontFamily: headingCss }}>{item.name}</h3>
                <p className="text-sm text-slate-500" style={{ fontFamily: bodyCss }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
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
            {site.contact.title}
          </h2>
          <div className="space-y-3 text-slate-600" style={{ fontFamily: bodyCss }}>
            {site.contact.phone && (
              <div className="flex gap-2">
                <span>📞</span>
                <span>{site.contact.phone}</span>
              </div>
            )}
            {site.contact.email && (
              <div className="flex gap-2">
                <span>✉️</span>
                <a href={`mailto:${site.contact.email}`} className="hover:underline">
                  {site.contact.email}
                </a>
              </div>
            )}
            {site.contact.address && (
              <div className="flex gap-2">
                <span>📍</span>
                <span>{site.contact.address}</span>
              </div>
            )}
            {site.contact.hours && (
              <div className="flex gap-2">
                <span>🕐</span>
                <span>{site.contact.hours}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <main className="w-full overflow-hidden bg-white text-slate-900">
      {/* Load Google Fonts */}
      {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}

      {/* Hero */}
      <section
        className="flex min-h-[380px] px-6 py-16 text-white"
        style={{
          background: `linear-gradient(135deg, ${primary}f0, ${secondary}cc)`,
        }}
      >
        {site.logo?.position === 'left' ? (
          // Logo on left
          <div className="flex w-full items-center justify-center gap-8">
            {site.logo?.url && (
              <img
                src={site.logo.url}
                alt={`${site.business_name} logo`}
                width={site.logo.width || 100}
                style={{ 
                  maxWidth: `${site.logo.width || 100}px`,
                  height: 'auto',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              />
            )}
            <div className="flex flex-col items-start justify-center gap-4">
              <h1 className="text-balance text-4xl font-bold leading-tight text-left md:text-5xl" style={{ fontFamily: headingCss }}>
                {site.hero.title}
              </h1>
              <p className="max-w-xl text-lg opacity-90 text-left" style={{ fontFamily: bodyCss }}>{site.tagline}</p>
              <p className="max-w-xl text-base opacity-80 text-left" style={{ fontFamily: bodyCss }}>{site.hero.content}</p>
              {site.hero.cta_text && (
                <a
                  href={heroCtaHref}
                  className="mt-2 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {site.hero.cta_text}
                </a>
              )}
            </div>
          </div>
        ) : site.logo?.position === 'right' ? (
          // Logo on right
          <div className="flex w-full items-center justify-center gap-8">
            <div className="flex flex-col items-end justify-center gap-4">
              <h1 className="text-balance text-4xl font-bold leading-tight text-right md:text-5xl" style={{ fontFamily: headingCss }}>
                {site.hero.title}
              </h1>
              <p className="max-w-xl text-lg opacity-90 text-right" style={{ fontFamily: bodyCss }}>{site.tagline}</p>
              <p className="max-w-xl text-base opacity-80 text-right" style={{ fontFamily: bodyCss }}>{site.hero.content}</p>
              {site.hero.cta_text && (
                <a
                  href={heroCtaHref}
                  className="mt-2 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {site.hero.cta_text}
                </a>
              )}
            </div>
            {site.logo?.url && (
              <img
                src={site.logo.url}
                alt={`${site.business_name} logo`}
                width={site.logo.width || 100}
                style={{ 
                  maxWidth: `${site.logo.width || 100}px`,
                  height: 'auto',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              />
            )}
          </div>
        ) : (
          // Logo center (default)
          <div className="flex flex-col items-center justify-center gap-4 w-full text-center">
            {site.logo?.url && (
              <img
                src={site.logo.url}
                alt={`${site.business_name} logo`}
                width={site.logo.width || 100}
                style={{ 
                  maxWidth: `${site.logo.width || 100}px`,
                  height: 'auto',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              />
            )}
            <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl" style={{ fontFamily: headingCss }}>
              {site.hero.title}
            </h1>
            <p className="max-w-xl text-lg opacity-90" style={{ fontFamily: bodyCss }}>{site.tagline}</p>
            <p className="max-w-2xl text-base opacity-80" style={{ fontFamily: bodyCss }}>{site.hero.content}</p>
            {site.hero.cta_text && (
              <a
                href={heroCtaHref}
                className="mt-2 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                {site.hero.cta_text}
              </a>
            )}
          </div>
        )}
      </section>

      {sectionOrder.map((sectionKey) => (
        <div key={sectionKey}>{contentSections[sectionKey]}</div>
      ))}

      {/* Footer */}
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
