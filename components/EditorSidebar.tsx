'use client';

import { useState } from 'react';
import type { Website } from '@/lib/schemas/website';
import LogoUpload from './LogoUpload';
import FontSelector from './FontSelector';
import ColorPicker from './ColorPicker';

interface EditorSidebarProps {
  siteId: string;
  website: Website;
  onWebsiteChange: (website: Website) => void;
}

type Panel = 'logo' | 'fonts' | 'colors' | null;

export default function EditorSidebar({
  siteId,
  website,
  onWebsiteChange,
}: EditorSidebarProps) {
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [isOpen, setIsOpen] = useState(false);

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
