'use client';

import { useState } from 'react';

type ManageBillingButtonProps = {
  disabled?: boolean;
};

export default function ManageBillingButton({ disabled = false }: ManageBillingButtonProps): JSX.Element {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();

      if (!res.ok || !json.portalUrl) {
        throw new Error(json.error ?? 'Unable to open billing portal.');
      }

      window.location.href = json.portalUrl as string;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to open billing portal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={openPortal}
      className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
      title={disabled ? 'Complete checkout first to enable billing portal.' : 'Open Stripe Billing Portal'}
    >
      {loading ? 'Opening…' : 'Manage Billing'}
    </button>
  );
}
