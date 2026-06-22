'use client';

import type { Website } from '@/lib/schemas/website';

interface ColorPickerProps {
  website: Website;
  onColorsChange: (colors: Record<string, string>) => void;
}

// Color presets grouped by style
const COLOR_PRESETS = {
  'Tech/Modern': ['#3B82F6', '#06B6D4', '#8B5CF6', '#E2E8F0'],
  'Warm/Creative': ['#F97316', '#EC4899', '#FBBF24', '#FEE2E2'],
  'Professional': ['#1E293B', '#374151', '#CBD5E1', '#F1F5F9'],
  'Nature': ['#10B981', '#0EA5E9', '#F59E0B', '#FECACA'],
  'Luxury': ['#7C3AED', '#DB2777', '#FBBF24', '#F3E8FF'],
};

export default function ColorPicker({ website, onColorsChange }: ColorPickerProps) {
  const { color_scheme } = website;

  const colors = {
    primary: color_scheme.primary,
    secondary: color_scheme.secondary,
    accent: color_scheme.accent || color_scheme.primary,
    neutral: color_scheme.neutral || '#f8fafc',
  };

  function handleColorChange(key: string, value: string) {
    onColorsChange({
      ...colors,
      [key]: value,
    });
  }

  function applyPreset(preset: string[]) {
    onColorsChange({
      primary: preset[0],
      secondary: preset[1],
      accent: preset[2],
      neutral: preset[3],
    });
  }

  const colorKeys = [
    { key: 'primary', label: 'Primary', icon: '🎨' },
    { key: 'secondary', label: 'Secondary', icon: '✨' },
    { key: 'accent', label: 'Accent', icon: '⭐' },
    { key: 'neutral', label: 'Neutral', icon: '⚪' },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-3 block text-sm font-medium text-slate-300">
          Color Palette
        </label>
        <div className="grid grid-cols-2 gap-3">
          {colorKeys.map(({ key, label, icon }) => (
            <div key={key} className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">
                {icon} {label}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-slate-600 bg-slate-800"
                />
                <input
                  type="text"
                  value={colors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  placeholder="#000000"
                  className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-300 font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Presets
        </label>
        <div className="space-y-2">
          {Object.entries(COLOR_PRESETS).map(([name, colors]) => (
            <button
              key={name}
              onClick={() => applyPreset(Array.isArray(colors) ? colors : [colors, colors, colors, colors])}
              className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-left transition hover:border-slate-500"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{name}</span>
                <div className="flex gap-1">
                  {(Array.isArray(colors) ? colors : [colors, colors, colors, colors]).map((color, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-3">
        <p className="text-xs text-slate-400">
          💡 Choose colors that match your brand personality. The preview will update in real-time.
        </p>
      </div>
    </div>
  );
}
