'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

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
    <Button
      disabled={disabled || loading}
      onClick={openPortal}
      variant="secondary"
      size="md"
      title={disabled ? 'Complete checkout first to enable billing portal.' : 'Open Stripe Billing Portal'}
    >
      {loading ? 'Opening…' : 'Manage Billing'}
    </Button>
  );
}
