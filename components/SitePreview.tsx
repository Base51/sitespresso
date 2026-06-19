'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Website } from '@/lib/schemas/website';
import EditableField from './EditableField';
import { createClient } from '@/lib/supabase/client';

interface SitePreviewProps {
  website: Website;
  initialDraftId?: string | null;
  onDraftSaved?: (id: string) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'unauthenticated' | 'error';

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
            .update({ data, updated_at: new Date().toISOString() })
            .eq('id', savedId);
        } else {
          const slug = data.business_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          const { data: row } = await supabase
            .from('sites')
            .insert({ user_id: user.id, slug, data, published: false })
            .select('id')
            .single();
          if (row?.id) {
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

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-700 shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-xs">
        <span className="text-slate-400">Preview · click any text to edit</span>
        <span className={saveLabelClass[saveStatus]}>{saveLabel[saveStatus]}</span>
      </div>

      {/* Hero */}
      <section
        className="flex min-h-[380px] flex-col items-center justify-center gap-4 px-6 py-16 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${primary}f0, ${secondary}cc)`,
        }}
      >
        <EditableField
          tag="h1"
          value={draft.hero.title}
          original={website.hero.title}
          onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, title: v } }))}
          className="text-4xl font-bold leading-tight md:text-5xl"
        />
        <EditableField
          tag="p"
          value={draft.tagline}
          original={website.tagline}
          onChange={(v) => update((d) => ({ ...d, tagline: v }))}
          className="max-w-xl text-lg opacity-90"
          multiline
        />
        <EditableField
          tag="p"
          value={draft.hero.content}
          original={website.hero.content}
          onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, content: v } }))}
          className="max-w-2xl text-base opacity-80"
          multiline
        />
        {draft.hero.cta_text && (
          <a
            href={draft.hero.cta_url || '#'}
            className="mt-2 inline-block rounded-full bg-white px-6 py-2.5 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {draft.hero.cta_text}
          </a>
        )}
      </section>

      {/* About */}
      <section className="bg-white px-6 py-14 text-slate-800 md:px-16">
        <div className="mx-auto max-w-3xl space-y-4">
          <EditableField
            tag="h2"
            value={draft.about.title}
            original={website.about.title}
            onChange={(v) => update((d) => ({ ...d, about: { ...d.about, title: v } }))}
            className="text-2xl font-bold"
            style={{ color: primary }}
          />
          <EditableField
            tag="p"
            value={draft.about.content}
            original={website.about.content}
            onChange={(v) => update((d) => ({ ...d, about: { ...d.about, content: v } }))}
            className="leading-relaxed text-slate-600"
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

      {/* Services */}
      <section className="bg-slate-50 px-6 py-14 md:px-16">
        <div className="mx-auto max-w-5xl">
          <EditableField
            tag="h2"
            value={draft.services.title}
            original={website.services.title}
            onChange={(v) => update((d) => ({ ...d, services: { ...d.services, title: v } }))}
            className="mb-3 block text-center text-2xl font-bold text-slate-800"
          />
          <EditableField
            tag="p"
            value={draft.services.description}
            original={website.services.description}
            onChange={(v) =>
              update((d) => ({ ...d, services: { ...d.services, description: v } }))
            }
            className="mb-8 block text-center text-slate-500"
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
                  multiline
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white px-6 py-14 md:px-16">
        <div className="mx-auto max-w-3xl">
          <EditableField
            tag="h2"
            value={draft.contact.title}
            original={website.contact.title}
            onChange={(v) => update((d) => ({ ...d, contact: { ...d.contact, title: v } }))}
            className="mb-6 block text-2xl font-bold"
            style={{ color: primary }}
          />
          <div className="space-y-3 text-slate-600">
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

      {/* Footer */}
      <footer
        className="px-6 py-6 text-center text-sm text-white/80"
        style={{ background: primary }}
      >
        © {new Date().getFullYear()} {draft.business_name}. Powered by{' '}
        <span className="font-semibold text-white">SiteSpresso</span>
      </footer>
    </div>
  );
}
