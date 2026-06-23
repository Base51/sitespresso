'use client';

import type { Website } from '@/lib/schemas/website';

interface LogoDisplayProps {
  website: Website;
  onPositionChange?: (position: 'left' | 'center' | 'top') => void;
  editable?: boolean;
}

export default function LogoDisplay({
  website,
  onPositionChange,
  editable = false,
}: LogoDisplayProps) {
  const { logo } = website;
  
  if (!logo?.url) {
    return null;
  }

  const position = logo.position ?? 'left';
  const width = logo.width ?? 100;

  const containerClasses = position === 'top' ? 'flex-col items-center' : 'flex-row items-center';

  return (
    <div
      className={`flex gap-4 ${containerClasses} ${editable ? 'group' : ''}`}
    >
      <img
        src={logo.url}
        alt="Logo"
        style={{ width: `${width}px`, height: 'auto' }}
        className="object-contain drop-shadow-md"
      />

      {editable && onPositionChange && (
        <div className="absolute right-2 top-2 flex gap-1 rounded-lg bg-slate-900/80 p-1 opacity-0 transition group-hover:opacity-100">
          {(['left', 'center', 'top'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => onPositionChange(pos)}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                position === pos
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {pos === 'left' ? '⬅' : pos === 'center' ? '⬇' : '⬆'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
