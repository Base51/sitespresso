'use client';

import type { Website } from '@/lib/schemas/website';

interface FontSelectorProps {
  website: Website;
  onFontsChange: (fonts: { heading: string; body: string }) => void;
}

const HEADING_FONTS = ['Playfair Display', 'Lora', 'Georgia'];
const BODY_FONTS = ['Inter', 'Roboto', 'Poppins'];

const FONT_DISPLAY_NAMES: Record<string, string> = {
  'Playfair Display': 'Playfair Display (Elegant)',
  'Lora': 'Lora (Serif)',
  'Georgia': 'Georgia (Classic)',
  'Inter': 'Inter (Modern)',
  'Roboto': 'Roboto (Clean)',
  'Poppins': 'Poppins (Friendly)',
};

export default function FontSelector({ website, onFontsChange }: FontSelectorProps) {
  const { fonts } = website;
  const headingFont = fonts?.heading ?? 'Playfair Display';
  const bodyFont = fonts?.body ?? 'Inter';

  return (
    <div className="space-y-4">
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
              style={{ fontFamily: `"${font}", serif` }}
            >
              <div className="text-sm font-semibold">The Quick Brown Fox</div>
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
              style={{ fontFamily: `"${font}", sans-serif` }}
            >
              <div className="text-sm">The quick brown fox jumps over the lazy dog</div>
              <div className="text-xs text-slate-400">{FONT_DISPLAY_NAMES[font]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
