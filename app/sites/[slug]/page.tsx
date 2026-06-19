import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Website } from '@/lib/schemas/website';

interface PageProps {
  params: { slug: string };
}

async function getSiteBySlug(slug: string): Promise<Website | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sites')
    .select('data, published')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !data) return null;
  return data.data as Website;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const site = await getSiteBySlug(params.slug);
  if (!site) return { title: 'Not Found' };

  const title = `${site.business_name} | Local Business`;
  const description = site.tagline;
  const url = `https://${params.slug}.sitespresso.com`;

  return {
    title,
    description,
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

  return (
    <main className="w-full overflow-hidden bg-white text-slate-900">
      {/* Hero */}
      <section
        className="flex min-h-[380px] flex-col items-center justify-center gap-4 px-6 py-16 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${primary}f0, ${secondary}cc)`,
        }}
      >
        <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl">
          {site.hero.title}
        </h1>
        <p className="max-w-xl text-lg opacity-90">{site.tagline}</p>
        <p className="max-w-2xl text-base opacity-80">{site.hero.content}</p>
        {site.hero.cta_text && (
          <a
            href={site.hero.cta_url || '#'}
            className="mt-2 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {site.hero.cta_text}
          </a>
        )}
      </section>

      {/* About */}
      <section className="bg-white px-6 py-14 text-slate-800 md:px-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold" style={{ color: primary }}>
            {site.about.title}
          </h2>
          <p className="leading-relaxed text-slate-600">{site.about.content}</p>
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

      {/* Services */}
      <section className="bg-slate-50 px-6 py-14 md:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-bold text-slate-800">
            {site.services.title}
          </h2>
          <p className="mb-8 text-center text-slate-500">{site.services.description}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {site.services.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                style={{ borderTop: `3px solid ${primary}` }}
              >
                <h3 className="mb-1 font-semibold text-slate-800">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white px-6 py-14 md:px-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold" style={{ color: primary }}>
            {site.contact.title}
          </h2>
          <div className="space-y-3 text-slate-600">
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
