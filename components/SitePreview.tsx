'use client';

import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react';
import type { Website } from '@/lib/schemas/website';
import EditableField from './EditableField';
import EditorSidebar from './EditorSidebar';
import LogoDisplay from './LogoDisplay';
import { createClient } from '@/lib/supabase/client';

interface SitePreviewProps {
  website: Website;
  initialDraftId?: string | null;
  onDraftSaved?: (id: string) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'unauthenticated' | 'error';
type SectionKey = 'about' | 'services' | 'contact';

const DEFAULT_SECTION_ORDER: SectionKey[] = ['about', 'services', 'contact'];

// Map font names to Google Fonts family names for CSS
const fontMap: Record<string, string> = {
  'Playfair Display': '"Playfair Display", serif',
  'Lora': '"Lora", serif',
  'Georgia': '"Georgia", serif',
  'Inter': '"Inter", sans-serif',
  'Roboto': '"Roboto", sans-serif',
  'Poppins': '"Poppins", sans-serif',
};

export default function SitePreview({
  website,
  initialDraftId,
  onDraftSaved,
}: SitePreviewProps) {
  const [draft, setDraft] = useState<Website>(website);
  const [savedId, setSavedId] = useState<string | null>(initialDraftId ?? null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => () => { isMounted.current = false; }, []);

  const save = useCallback(
    async (data: Website) => {
      if (!isMounted.current) return;
      const startTime = performance.now();
      setSaveStatus('saving');
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted.current) setSaveStatus('unauthenticated');
          return;
        }
        if (savedId) {
          await supabase
            .from('sites')
            .update({ content: data, updated_at: new Date().toISOString() })
            .eq('id', savedId);
        } else {
          const baseSlug = data.business_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          const draftSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
          console.log(`📝 Inserting new draft with slug: ${draftSlug}`);
          const { data: row, error: insertError } = await supabase
            .from('sites')
            .insert({
              user_id: user.id,
              slug: draftSlug,
              business_name: data.business_name,
              business_type: data.business_type,
              city: data.city,
              content: data,
              status: 'draft',
            })
            .select('id')
            .single();
          if (insertError) {
            console.error(`❌ Insert error:`, insertError);
            throw new Error(`Failed to create draft: ${insertError.message}`);
          }
          if (row?.id) {
            console.log(`✅ Draft created with ID: ${row.id}`);
            setSavedId(row.id);
            onDraftSaved?.(row.id);
          }
        }
        const elapsed = performance.now() - startTime;
        setLastSaveTime(Math.round(elapsed));
        console.log(`✅ Draft auto-saved in ${Math.round(elapsed)}ms`);
        if (isMounted.current) setSaveStatus('saved');
      } catch (err) {
        console.error(`❌ Auto-save failed:`, err);
        if (isMounted.current) setSaveStatus('error');
      }
    },
    [savedId, onDraftSaved],
  );

  const scheduleSave = useCallback(
    (updated: Website) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(updated), 1000);
    },
    [save],
  );

  function update(updater: (prev: Website) => Website) {
    setDraft((prev) => {
      const next = updater(prev);
      scheduleSave(next);
      return next;
    });
  }

  const { color_scheme } = draft;
  const primary = color_scheme.primary;
  const secondary = color_scheme.secondary;

  // Build Google Fonts URL for selected fonts
  const googleFontsUrl = useMemo(() => {
    const headingFont = draft.fonts?.heading || 'Playfair Display';
    const bodyFont = draft.fonts?.body || 'Inter';
    const googleFonts = ['Playfair Display', 'Lora', 'Inter', 'Roboto', 'Poppins'];
    const families: string[] = [];
    if (googleFonts.includes(headingFont)) families.push(headingFont.replace(' ', '+') + ':ital,wght@0,400;0,700;1,400');
    if (googleFonts.includes(bodyFont) && bodyFont !== headingFont) families.push(bodyFont.replace(' ', '+') + ':wght@400;500;600');
    if (!families.length) return null;
    return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`;
  }, [draft.fonts?.heading, draft.fonts?.body]);

  const saveLabel: Record<SaveStatus, string> = {
    idle: '',
    saving: 'Saving…',
    saved: lastSaveTime ? `✓ Saved (${lastSaveTime}ms)` : '✓ Draft saved',
    unauthenticated: '⚠ Sign in to save your draft',
    error: '✕ Save failed — try again',
  };

  const saveLabelClass: Record<SaveStatus, string> = {
    idle: 'text-slate-500',
    saving: 'text-yellow-400',
    saved: 'text-green-400',
    unauthenticated: 'text-amber-400',
    error: 'text-red-400',
  };

  const sectionOrder = useMemo(() => {
    const customOrder = draft.layout?.section_order;
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
  }, [draft.layout?.section_order]);

  const heroCtaHref = useMemo(() => {
    const raw = draft.hero.cta_url?.trim();
    if (!raw) return '#';
    if (raw.startsWith('#') || raw.startsWith('/')) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^javascript:/i.test(raw)) return '#';
    return `https://${raw}`;
  }, [draft.hero.cta_url]);

  const contentSections: Record<SectionKey, ReactNode> = {
    about: (
      <section className="bg-white px-6 py-14 text-slate-800 md:px-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <EditableField
            tag="h2"
            value={draft.about.title}
            original={website.about.title}
            onChange={(v) => update((d) => ({ ...d, about: { ...d.about, title: v } }))}
            className="text-2xl font-bold"
            style={{
              color: primary,
              fontFamily: fontMap[draft.fonts?.heading || 'Playfair Display']
            }}
          />
          <EditableField
            tag="p"
            value={draft.about.content}
            original={website.about.content}
            onChange={(v) => update((d) => ({ ...d, about: { ...d.about, content: v } }))}
            className="leading-relaxed text-slate-600"
            style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}
            multiline
          />
          {draft.about.cta_text && (
            <a
              href={draft.about.cta_url || '#'}
              className="inline-block rounded-lg px-5 py-2 font-semibold text-white transition hover:opacity-90"
              style={{ background: primary }}
            >
              {draft.about.cta_text}
            </a>
          )}
        </div>
      </section>
    ),
    services: (
      <section className="bg-slate-50 px-6 py-14 md:px-16">
        <div className="mx-auto max-w-5xl">
          <EditableField
            tag="h2"
            value={draft.services.title}
            original={website.services.title}
            onChange={(v) => update((d) => ({ ...d, services: { ...d.services, title: v } }))}
            className="mb-3 block text-center text-2xl font-bold text-slate-800"
            style={{ fontFamily: fontMap[draft.fonts?.heading || 'Playfair Display'] }}
          />
          <EditableField
            tag="p"
            value={draft.services.description}
            original={website.services.description}
            onChange={(v) =>
              update((d) => ({ ...d, services: { ...d.services, description: v } }))
            }
            className="mb-8 block text-center text-slate-500"
            style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}
            multiline
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {draft.services.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                style={{ borderTop: `3px solid ${primary}` }}
              >
                <EditableField
                  tag="h3"
                  value={item.name}
                  original={website.services.items[idx]?.name ?? item.name}
                  onChange={(v) =>
                    update((d) => ({
                      ...d,
                      services: {
                        ...d.services,
                        items: d.services.items.map((s, i) =>
                          i === idx ? { ...s, name: v } : s,
                        ),
                      },
                    }))
                  }
                  className="mb-1 block font-semibold text-slate-800"
                  style={{ fontFamily: fontMap[draft.fonts?.heading || 'Playfair Display'] }}
                />
                <EditableField
                  tag="p"
                  value={item.description}
                  original={website.services.items[idx]?.description ?? item.description}
                  onChange={(v) =>
                    update((d) => ({
                      ...d,
                      services: {
                        ...d.services,
                        items: d.services.items.map((s, i) =>
                          i === idx ? { ...s, description: v } : s,
                        ),
                      },
                    }))
                  }
                  className="text-sm text-slate-500"
                  style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}
                  multiline
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
    contact: (
      <section className="bg-white px-6 py-14 md:px-16">
        <div className="mx-auto max-w-3xl">
          <EditableField
            tag="h2"
            value={draft.contact.title}
            original={website.contact.title}
            onChange={(v) => update((d) => ({ ...d, contact: { ...d.contact, title: v } }))}
            className="mb-6 block text-2xl font-bold"
            style={{
              color: primary,
              fontFamily: fontMap[draft.fonts?.heading || 'Playfair Display']
            }}
          />
          <div className="space-y-3 text-slate-600" style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}>
            {draft.contact.phone && (
              <div className="flex gap-2">
                <span>📞</span>
                <EditableField
                  tag="span"
                  value={draft.contact.phone}
                  original={website.contact.phone ?? ''}
                  onChange={(v) =>
                    update((d) => ({ ...d, contact: { ...d.contact, phone: v } }))
                  }
                />
              </div>
            )}
            {draft.contact.email && (
              <div className="flex gap-2">
                <span>✉️</span>
                <EditableField
                  tag="span"
                  value={draft.contact.email}
                  original={website.contact.email ?? ''}
                  onChange={(v) =>
                    update((d) => ({ ...d, contact: { ...d.contact, email: v } }))
                  }
                />
              </div>
            )}
            {draft.contact.address && (
              <div className="flex gap-2">
                <span>📍</span>
                <EditableField
                  tag="span"
                  value={draft.contact.address}
                  original={website.contact.address ?? ''}
                  onChange={(v) =>
                    update((d) => ({ ...d, contact: { ...d.contact, address: v } }))
                  }
                />
              </div>
            )}
            {draft.contact.hours && (
              <div className="flex gap-2">
                <span>🕐</span>
                <EditableField
                  tag="span"
                  value={draft.contact.hours}
                  original={website.contact.hours ?? ''}
                  onChange={(v) =>
                    update((d) => ({ ...d, contact: { ...d.contact, hours: v } }))
                  }
                />
              </div>
            )}
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="w-full space-y-4">
      {/* Customization Sidebar */}
      {savedId && (
        <EditorSidebar
          siteId={savedId}
          website={draft}
          onWebsiteChange={(updatedWebsite) => update(() => updatedWebsite)}
        />
      )}

      {/* Preview */}
      <div className="w-full overflow-hidden rounded-xl border border-slate-700 shadow-2xl">
        {/* Load Google Fonts dynamically */}
        {googleFontsUrl && (
          // eslint-disable-next-line @next/next/no-page-custom-font
          <link rel="stylesheet" href={googleFontsUrl} />
        )}
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-xs">
          <span className="text-slate-400">Preview · click any text to edit</span>
          <span className={saveLabelClass[saveStatus]}>{saveLabel[saveStatus]}</span>
        </div>

      {/* Hero */}
      <section
        className="flex min-h-[380px] px-6 py-16 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${primary}f0, ${secondary}cc)`,
        }}
      >
        {draft.logo?.position === 'left' ? (
          // Logo on left
          <div className="flex w-full items-center justify-center gap-8">
            {draft.logo?.url && (
              <LogoDisplay website={draft} />
            )}
            <div className="flex flex-col items-start justify-center gap-4">
              <EditableField
                tag="h1"
                value={draft.hero.title}
                original={website.hero.title}
                onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, title: v } }))}
                className="text-4xl font-bold leading-tight text-left md:text-5xl"
                style={{ fontFamily: fontMap[draft.fonts?.heading || 'Playfair Display'] }}
              />
              <EditableField
                tag="p"
                value={draft.tagline}
                original={website.tagline}
                onChange={(v) => update((d) => ({ ...d, tagline: v }))}
                className="max-w-xl text-lg opacity-90 text-left"
                style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}
                multiline
              />
              <EditableField
                tag="p"
                value={draft.hero.content}
                original={website.hero.content}
                onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, content: v } }))}
                className="max-w-xl text-base opacity-80 text-left"
                style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}
                multiline
              />
              {draft.hero.cta_text && (
                <a
                  href={heroCtaHref}
                  className="mt-2 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {draft.hero.cta_text}
                </a>
              )}
            </div>
          </div>
        ) : draft.logo?.position === 'right' ? (
          // Logo on right
          <div className="flex w-full items-center justify-center gap-8">
            <div className="flex flex-col items-end justify-center gap-4">
              <EditableField
                tag="h1"
                value={draft.hero.title}
                original={website.hero.title}
                onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, title: v } }))}
                className="text-4xl font-bold leading-tight text-right md:text-5xl"
                style={{ fontFamily: fontMap[draft.fonts?.heading || 'Playfair Display'] }}
              />
              <EditableField
                tag="p"
                value={draft.tagline}
                original={website.tagline}
                onChange={(v) => update((d) => ({ ...d, tagline: v }))}
                className="max-w-xl text-lg opacity-90 text-right"
                style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}
                multiline
              />
              <EditableField
                tag="p"
                value={draft.hero.content}
                original={website.hero.content}
                onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, content: v } }))}
                className="max-w-xl text-base opacity-80 text-right"
                style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}
                multiline
              />
              {draft.hero.cta_text && (
                <a
                  href={heroCtaHref}
                  className="mt-2 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {draft.hero.cta_text}
                </a>
              )}
            </div>
            {draft.logo?.url && (
              <LogoDisplay website={draft} />
            )}
          </div>
        ) : (
          // Logo center (default)
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            {draft.logo?.url && (
              <LogoDisplay website={draft} />
            )}
            <EditableField
              tag="h1"
              value={draft.hero.title}
              original={website.hero.title}
              onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, title: v } }))}
              className="text-4xl font-bold leading-tight md:text-5xl"
              style={{ fontFamily: fontMap[draft.fonts?.heading || 'Playfair Display'] }}
            />
            <EditableField
              tag="p"
              value={draft.tagline}
              original={website.tagline}
              onChange={(v) => update((d) => ({ ...d, tagline: v }))}
              className="max-w-xl text-lg opacity-90"
              style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}
              multiline
            />
            <EditableField
              tag="p"
              value={draft.hero.content}
              original={website.hero.content}
              onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, content: v } }))}
              className="max-w-2xl text-base opacity-80"
              style={{ fontFamily: fontMap[draft.fonts?.body || 'Inter'] }}
              multiline
            />
            {draft.hero.cta_text && (
              <a
                href={heroCtaHref}
                className="mt-2 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                {draft.hero.cta_text}
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
        © {new Date().getFullYear()} {draft.business_name}. Powered by{' '}
        <span className="font-semibold text-white">SiteSpresso</span>
      </footer>
      </div>
    </div>
  );
}
