'use client';

import type { Website } from '@/lib/schemas/website';

interface FontSelectorProps {
  website: Website;
  onFontsChange: (fonts: { heading: string; body: string }) => void;
}

const HEADING_FONTS = ['Playfair Display', 'Lora', 'Georgia'];
const BODY_FONTS = ['Inter', 'Roboto', 'Poppins'];

const FONT_PRESETS = [
  {
    id: 'elegant',
    label: 'Elegant',
    heading: 'Playfair Display',
    body: 'Inter',
    hint: 'Refined serif with clean body text',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    heading: 'Lora',
    body: 'Roboto',
    hint: 'Classic reading rhythm for service pages',
  },
  {
    id: 'modern',
    label: 'Modern',
    heading: 'Poppins',
    body: 'Inter',
    hint: 'Contemporary geometric look',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    heading: 'Georgia',
    body: 'Poppins',
    hint: 'Approachable, warm, and easy to scan',
  },
] as const;

const FONT_DISPLAY_NAMES: Record<string, string> = {
  'Playfair Display': 'Playfair Display (Elegant)',
  'Lora': 'Lora (Serif)',
  'Georgia': 'Georgia (Classic)',
  'Inter': 'Inter (Modern)',
  'Roboto': 'Roboto (Clean)',
  'Poppins': 'Poppins (Friendly)',
};

const FONT_STACKS: Record<string, string> = {
  'Playfair Display': '"Playfair Display", serif',
  'Lora': '"Lora", serif',
  'Georgia': 'Georgia, serif',
  'Inter': '"Inter", sans-serif',
  'Roboto': '"Roboto", sans-serif',
  'Poppins': '"Poppins", sans-serif',
};

export default function FontSelector({ website, onFontsChange }: FontSelectorProps) {
  const { fonts } = website;
  const headingFont = fonts?.heading ?? 'Playfair Display';
  const bodyFont = fonts?.body ?? 'Inter';

  function handleApplyPreset(heading: string, body: string) {
    onFontsChange({ heading, body });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">
          Typography presets
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FONT_PRESETS.map((preset) => {
            const isActive = headingFont === preset.heading && bodyFont === preset.body;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.heading, preset.body)}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  isActive
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 bg-slate-800/70 hover:border-slate-500'
                }`}
              >
                <div className="text-sm font-semibold text-slate-200">{preset.label}</div>
                <div className="text-[11px] text-slate-400">{preset.hint}</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {preset.heading} + {preset.body}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">
          Live pair preview
        </p>
        <h4
          className="text-lg font-bold text-slate-100"
          style={{ fontFamily: FONT_STACKS[headingFont] }}
        >
          Crafting a local brand customers trust
        </h4>
        <p
          className="mt-1 text-sm text-slate-300"
          style={{ fontFamily: FONT_STACKS[bodyFont] }}
        >
          Friendly service, clear information, and a polished first impression.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Heading Font
        </label>
        <div className="grid grid-cols-1 gap-2">
          {HEADING_FONTS.map((font) => (
            <button
              key={font}
              onClick={() =>
                onFontsChange({
                  heading: font,
                  body: bodyFont,
                })
              }
              className={`rounded-lg border-2 px-4 py-3 text-left transition ${
                headingFont === font
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
              }`}
              style={{ fontFamily: FONT_STACKS[font] }}
            >
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Aa Bb Cc</div>
              <div className="text-base font-semibold leading-tight">Brand Story Starts Here</div>
              <div className="text-xs text-slate-400">{FONT_DISPLAY_NAMES[font]}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Body Font
        </label>
        <div className="grid grid-cols-1 gap-2">
          {BODY_FONTS.map((font) => (
            <button
              key={font}
              onClick={() =>
                onFontsChange({
                  heading: headingFont,
                  body: font,
                })
              }
              className={`rounded-lg border-2 px-4 py-3 text-left transition ${
                bodyFont === font
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
              }`}
              style={{ fontFamily: FONT_STACKS[font] }}
            >
              <div className="text-sm leading-relaxed">
                Clean, readable text helps visitors scan services and contact details quickly.
              </div>
              <div className="text-xs text-slate-400">{FONT_DISPLAY_NAMES[font]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
