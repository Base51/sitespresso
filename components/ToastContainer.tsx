'use client';

import { useContext } from 'react';
import { ToastContext } from '@/components/ToastContext';

function getIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '!';
    case 'info':
    default:
      return 'ℹ';
  }
}

function getColor(type: string): string {
  switch (type) {
    case 'success':
      return 'border-emerald-500 bg-emerald-950 text-emerald-50';
    case 'error':
      return 'border-rose-500 bg-rose-950 text-rose-50';
    case 'warning':
      return 'border-amber-500 bg-amber-950 text-amber-50';
    case 'info':
    default:
      return 'border-blue-500 bg-blue-950 text-blue-50';
  }
}

export default function ToastContainer(): JSX.Element {
  const context = useContext(ToastContext);
  if (!context) return <></>;

  const { toasts, dismiss } = context;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-panel ${getColor(t.type)}`}
          role="alert"
        >
          <span className="mt-0.5 text-lg font-bold">{getIcon(t.type)}</span>
          <div className="flex-1">
            <p className="font-medium">{t.title}</p>
            {t.description && <p className="mt-1 text-sm opacity-90">{t.description}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="mt-0.5 text-lg opacity-60 transition hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
