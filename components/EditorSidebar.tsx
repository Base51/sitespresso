'use client';

import { useEffect, useState } from 'react';
import type { Website } from '@/lib/schemas/website';
import LogoUpload from './LogoUpload';
import FontSelector from './FontSelector';
import ColorPicker from './ColorPicker';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';

interface EditorSidebarProps {
  siteId: string;
  website: Website;
  onWebsiteChange: (website: Website) => void;
}

type Panel = 'logo' | 'layout' | 'hero' | 'fonts' | 'colors' | null;
type SectionKey = 'about' | 'services' | 'contact';
type SectionBackgrounds = Record<SectionKey, string>;

interface SavedStylePreset {
  id: string;
  name: string;
  section_backgrounds: SectionBackgrounds;
}

const DEFAULT_SECTION_ORDER: SectionKey[] = ['about', 'services', 'contact'];
const DEFAULT_SECTION_BACKGROUNDS: Record<SectionKey, string> = {
  about: '#ffffff',
  services: '#f8fafc',
  contact: '#ffffff',
};
const SAVED_STYLE_PRESETS_KEY = 'sitespresso-style-presets-v1';
const SECTION_STYLE_PRESETS = [
  {
    id: 'clean',
    label: 'Clean',
    colors: {
      about: '#ffffff',
      services: '#f8fafc',
      contact: '#ffffff',
    } as Record<SectionKey, string>,
  },
  {
    id: 'soft',
    label: 'Soft',
    colors: {
      about: '#fff7ed',
      services: '#f1f5f9',
      contact: '#fff1f2',
    } as Record<SectionKey, string>,
  },
  {
    id: 'bold',
    label: 'Bold',
    colors: {
      about: '#f8fafc',
      services: '#e0f2fe',
      contact: '#ecfccb',
    } as Record<SectionKey, string>,
  },
] as const;
const SECTION_LABELS: Record<SectionKey, string> = {
  about: 'About',
  services: 'Services',
  contact: 'Contact',
};

export default function EditorSidebar({
  siteId,
  website,
  onWebsiteChange,
}: EditorSidebarProps) {
  const { toast } = useToast();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [savedStylePresets, setSavedStylePresets] = useState<SavedStylePreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [presetsReady, setPresetsReady] = useState(false);

  function handleLogoUpload(url: string | null) {
    onWebsiteChange({
      ...website,
      logo: {
        position: website.logo?.position ?? 'left',
        width: website.logo?.width ?? 100,
        url: url || undefined,
      },
    });
  }

  function handleLogoPositionChange(position: 'left' | 'center' | 'right') {
    onWebsiteChange({
      ...website,
      logo: {
        position,
        width: website.logo?.width ?? 100,
        url: website.logo?.url,
      },
    });
  }

  function handleLogoWidthChange(width: number) {
    onWebsiteChange({
      ...website,
      logo: {
        position: website.logo?.position ?? 'left',
        width,
        url: website.logo?.url,
      },
    });
  }

  function getSectionOrder(): SectionKey[] {
    const customOrder = website.layout?.section_order;
    if (!customOrder || customOrder.length !== DEFAULT_SECTION_ORDER.length) {
      return DEFAULT_SECTION_ORDER;
    }
    const hasAllSections = DEFAULT_SECTION_ORDER.every((section) =>
      customOrder.includes(section)
    );
    return hasAllSections ? (customOrder as SectionKey[]) : DEFAULT_SECTION_ORDER;
  }

  function handleMoveSection(section: SectionKey, direction: 'up' | 'down') {
    const currentOrder = [...getSectionOrder()];
    const currentIndex = currentOrder.indexOf(section);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= currentOrder.length) {
      return;
    }

    [currentOrder[currentIndex], currentOrder[targetIndex]] = [
      currentOrder[targetIndex],
      currentOrder[currentIndex],
    ];

    onWebsiteChange({
      ...website,
      layout: {
        ...website.layout,
        section_order: currentOrder,
      },
    });
  }

  function getSectionBackgrounds(): Record<SectionKey, string> {
    return {
      about:
        website.layout?.section_backgrounds?.about ||
        DEFAULT_SECTION_BACKGROUNDS.about,
      services:
        website.layout?.section_backgrounds?.services ||
        DEFAULT_SECTION_BACKGROUNDS.services,
      contact:
        website.layout?.section_backgrounds?.contact ||
        DEFAULT_SECTION_BACKGROUNDS.contact,
    };
  }

  async function savePresetsToStorage(presets: SavedStylePreset[]): Promise<'profile' | 'local'> {
    localStorage.setItem(SAVED_STYLE_PRESETS_KEY, JSON.stringify(presets));

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return 'local';
      }

      const { error } = await supabase
        .from('profiles')
        .update({ style_presets: presets })
        .eq('id', user.id);

      if (error) {
        return 'local';
      }

      return 'profile';
    } catch {
      return 'local';
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadSavedPresets() {
      const localRaw = localStorage.getItem(SAVED_STYLE_PRESETS_KEY);
      if (localRaw) {
        try {
          const localPresets = JSON.parse(localRaw) as SavedStylePreset[];
          if (mounted) {
            setSavedStylePresets(Array.isArray(localPresets) ? localPresets : []);
          }
        } catch {
          if (mounted) {
            setSavedStylePresets([]);
          }
        }
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('style_presets')
          .eq('id', user.id)
          .single();

        const profilePresets = (data?.style_presets as SavedStylePreset[] | null) || [];
        if (mounted && Array.isArray(profilePresets)) {
          setSavedStylePresets(profilePresets);
          localStorage.setItem(SAVED_STYLE_PRESETS_KEY, JSON.stringify(profilePresets));
        }
      } catch {
        // Keep local fallback if profile column does not exist or request fails.
      } finally {
        if (mounted) {
          setPresetsReady(true);
        }
      }
    }

    void loadSavedPresets();

    return () => {
      mounted = false;
    };
  }, []);

  function handleSectionBackgroundChange(section: SectionKey, color: string) {
    onWebsiteChange({
      ...website,
      layout: {
        ...website.layout,
        section_backgrounds: {
          ...getSectionBackgrounds(),
          [section]: color,
        },
      },
    });
  }

  function applySectionStylePreset(colors: Record<SectionKey, string>) {
    onWebsiteChange({
      ...website,
      layout: {
        ...website.layout,
        section_backgrounds: colors,
      },
    });
  }

  function saveCurrentStylePreset() {
    const trimmedName = newPresetName.trim();
    if (!trimmedName) {
      return;
    }

    const currentBackgrounds = getSectionBackgrounds();
    const nextPreset: SavedStylePreset = {
      id: crypto.randomUUID(),
      name: trimmedName,
      section_backgrounds: currentBackgrounds,
    };

    const next = [nextPreset, ...savedStylePresets].slice(0, 8);
    setSavedStylePresets(next);
    setNewPresetName('');
    void savePresetsToStorage(next).then((mode) => {
      if (mode === 'profile') {
        toast({
          type: 'success',
          title: 'Preset saved',
          description: `"${nextPreset.name}" saved to your account.`,
        });
      } else {
        toast({
          type: 'warning',
          title: 'Saved locally',
          description: `"${nextPreset.name}" saved on this browser only until account sync is available.`,
        });
      }
    });
  }

  function deleteSavedPreset(id: string) {
    const removed = savedStylePresets.find((preset) => preset.id === id);
    const next = savedStylePresets.filter((preset) => preset.id !== id);
    setSavedStylePresets(next);
    void savePresetsToStorage(next).then((mode) => {
      if (!removed) {
        return;
      }

      if (mode === 'profile') {
        toast({
          type: 'info',
          title: 'Preset deleted',
          description: `"${removed.name}" removed from your account presets.`,
        });
      } else {
        toast({
          type: 'warning',
          title: 'Preset deleted locally',
          description: `"${removed.name}" removed from this browser.`,
        });
      }
    });
  }

  function isPresetActive(colors: Record<SectionKey, string>) {
    const current = getSectionBackgrounds();
    return (
      current.about.toLowerCase() === colors.about.toLowerCase() &&
      current.services.toLowerCase() === colors.services.toLowerCase() &&
      current.contact.toLowerCase() === colors.contact.toLowerCase()
    );
  }

  function handleFontsChange(fonts: { heading: string; body: string }) {
    onWebsiteChange({
      ...website,
      fonts,
    });
  }

  function handleColorsChange(colors: Record<string, string>) {
    onWebsiteChange({
      ...website,
      color_scheme: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent || colors.primary,
        neutral: colors.neutral || '#f8fafc',
      },
    });
  }

  const isHeroCtaEnabled = Boolean(website.hero?.cta_text?.trim());

  function updateHeroCta(ctaText: string | undefined, ctaUrl: string | undefined) {
    onWebsiteChange({
      ...website,
      hero: {
        ...website.hero,
        cta_text: ctaText,
        cta_url: ctaUrl,
      },
    });
  }

  function handleHeroCtaEnabledChange(enabled: boolean) {
    if (!enabled) {
      updateHeroCta(undefined, undefined);
      return;
    }

    updateHeroCta(website.hero.cta_text?.trim() || 'Get Started', website.hero.cta_url || '#');
  }

  function handleHeroCtaTextChange(value: string) {
    const nextText = value.trim().length ? value : undefined;
    updateHeroCta(nextText, website.hero.cta_url || '#');
  }

  function handleHeroCtaUrlChange(value: string) {
    const nextUrl = value.trim().length ? value.trim() : undefined;
    updateHeroCta(website.hero.cta_text || 'Get Started', nextUrl);
  }

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
      >
        {isOpen ? '✕ Close Customization' : '⚙️ Customize Site'}
      </button>

      {/* Panels */}
      {isOpen && (
        <div className="space-y-2 rounded-lg border border-slate-600 bg-slate-800/50 p-4">
          {/* Logo Panel */}
          <button
            onClick={() => setActivePanel(activePanel === 'logo' ? null : 'logo')}
            className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition ${
              activePanel === 'logo'
                ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
            }`}
          >
            {activePanel === 'logo' ? '▼' : '▶'} 📤 Logo
          </button>
          {activePanel === 'logo' && (
            <div className="space-y-3 rounded-lg bg-slate-900/50 p-3">
              <LogoUpload
                siteId={siteId}
                currentLogoUrl={website.logo?.url}
                onLogoDone={handleLogoUpload}
              />
              
              {website.logo?.url && (
                <div className="space-y-2 border-t border-slate-700 pt-3">
                  <label className="block text-sm font-medium text-slate-300">
                    Position
                  </label>
                  <div className="flex gap-2">
                    {(['left', 'center', 'right'] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => handleLogoPositionChange(pos)}
                        className={`flex-1 rounded py-2 px-3 text-xs font-medium transition ${
                          website.logo?.position === pos
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {pos === 'left' ? '⬅ Left' : pos === 'center' ? '⬇ Center' : '➡ Right'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-300">
                        Size
                      </label>
                      <span className="text-xs text-slate-400">
                        {website.logo?.width ?? 100}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={200}
                      step={5}
                      value={website.logo?.width ?? 100}
                      onChange={(e) => handleLogoWidthChange(Number(e.target.value))}
                      className="w-full accent-blue-500"
                      aria-label="Logo size"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>30px</span>
                      <span>200px</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Layout Panel */}
          <button
            onClick={() => setActivePanel(activePanel === 'layout' ? null : 'layout')}
            className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition ${
              activePanel === 'layout'
                ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
            }`}
          >
            {activePanel === 'layout' ? '▼' : '▶'} ↕️ Layout
          </button>
          {activePanel === 'layout' && (
            <div className="space-y-3 rounded-lg bg-slate-900/50 p-3">
              <p className="text-xs text-slate-400">Choose the order of page sections</p>
              <div className="space-y-2">
                {getSectionOrder().map((section, index) => (
                  <div
                    key={section}
                    className="flex items-center justify-between rounded border border-slate-700 bg-slate-800/70 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-slate-200">
                      {SECTION_LABELS[section]}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveSection(section, 'up')}
                        disabled={index === 0}
                        className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 transition enabled:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Move ${SECTION_LABELS[section]} up`}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveSection(section, 'down')}
                        disabled={index === getSectionOrder().length - 1}
                        className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 transition enabled:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Move ${SECTION_LABELS[section]} down`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hero CTA Panel */}
          <button
            onClick={() => setActivePanel(activePanel === 'hero' ? null : 'hero')}
            className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition ${
              activePanel === 'hero'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
            }`}
          >
            {activePanel === 'hero' ? '▼' : '▶'} 🚀 Hero CTA
          </button>
          {activePanel === 'hero' && (
            <div className="space-y-3 rounded-lg bg-slate-900/50 p-3">
              <label className="flex items-center justify-between rounded border border-slate-700 bg-slate-800/70 px-3 py-2">
                <span className="text-sm font-medium text-slate-200">Show CTA button</span>
                <input
                  type="checkbox"
                  checked={isHeroCtaEnabled}
                  onChange={(e) => handleHeroCtaEnabledChange(e.target.checked)}
                  className="h-4 w-4 accent-cyan-500"
                  aria-label="Show hero CTA"
                />
              </label>

              {isHeroCtaEnabled && (
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Button text</label>
                    <input
                      type="text"
                      value={website.hero.cta_text || ''}
                      onChange={(e) => handleHeroCtaTextChange(e.target.value)}
                      placeholder="Get Started"
                      className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Button URL</label>
                    <input
                      type="text"
                      value={website.hero.cta_url || ''}
                      onChange={(e) => handleHeroCtaUrlChange(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {!website.hero.cta_url?.trim() && (
                    <p className="text-[11px] text-amber-400">
                      URL is empty. The button will point to # until you provide a link.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fonts Panel */}
          <button
            onClick={() => setActivePanel(activePanel === 'fonts' ? null : 'fonts')}
            className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition ${
              activePanel === 'fonts'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
            }`}
          >
            {activePanel === 'fonts' ? '▼' : '▶'} 🔤 Fonts
          </button>
          {activePanel === 'fonts' && (
            <div className="space-y-3 rounded-lg bg-slate-900/50 p-3">
              <FontSelector website={website} onFontsChange={handleFontsChange} />
            </div>
          )}

          {/* Colors Panel */}
          <button
            onClick={() => setActivePanel(activePanel === 'colors' ? null : 'colors')}
            className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition ${
              activePanel === 'colors'
                ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
            }`}
          >
            {activePanel === 'colors' ? '▼' : '▶'} 🎨 Colors
          </button>
          {activePanel === 'colors' && (
            <div className="space-y-3 rounded-lg bg-slate-900/50 p-3">
              <ColorPicker website={website} onColorsChange={handleColorsChange} />

              <div className="space-y-2 border-t border-slate-700 pt-3">
                <p className="text-xs font-medium text-slate-400">Section style presets</p>
                <div className="grid grid-cols-3 gap-2">
                  {SECTION_STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applySectionStylePreset(preset.colors)}
                      className={`rounded border px-2 py-2 text-xs font-medium transition ${
                        isPresetActive(preset.colors)
                          ? 'border-purple-400 bg-purple-500/15 text-purple-200'
                          : 'border-slate-600 bg-slate-800/70 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-700 pt-3">
                <p className="text-xs font-medium text-slate-400">Saved custom presets</p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Preset name"
                    className="flex-1 rounded border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={saveCurrentStylePreset}
                    disabled={!newPresetName.trim()}
                    className="rounded border border-purple-500/60 bg-purple-500/20 px-3 py-2 text-xs font-medium text-purple-200 transition hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>

                {presetsReady && savedStylePresets.length === 0 && (
                  <p className="text-[11px] text-slate-500">No saved presets yet.</p>
                )}

                <div className="space-y-2">
                  {savedStylePresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between rounded border border-slate-700 bg-slate-800/70 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-200">{preset.name}</p>
                        <div className="mt-1 flex gap-1">
                          {(['about', 'services', 'contact'] as const).map((section) => (
                            <span
                              key={section}
                              className="h-3 w-3 rounded border border-slate-600"
                              style={{ backgroundColor: preset.section_backgrounds[section] }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => applySectionStylePreset(preset.section_backgrounds)}
                          className="rounded border border-slate-600 px-2 py-1 text-[11px] text-slate-200 transition hover:border-slate-500"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => deleteSavedPreset(preset.id)}
                          className="rounded border border-rose-500/60 px-2 py-1 text-[11px] text-rose-300 transition hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-700 pt-3">
                <p className="text-xs font-medium text-slate-400">Section backgrounds</p>
                {(['about', 'services', 'contact'] as const).map((section) => (
                  <label
                    key={section}
                    className="flex items-center justify-between rounded border border-slate-700 bg-slate-800/70 px-3 py-2"
                  >
                    <span className="text-sm text-slate-200">{SECTION_LABELS[section]}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={getSectionBackgrounds()[section]}
                        onChange={(e) => handleSectionBackgroundChange(section, e.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border border-slate-600 bg-transparent"
                        aria-label={`${SECTION_LABELS[section]} background color`}
                      />
                      <span className="w-16 text-right text-[11px] text-slate-400">
                        {getSectionBackgrounds()[section]}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 pt-2">
            💾 Changes save automatically as you edit
          </p>
        </div>
      )}
    </div>
  );
}
