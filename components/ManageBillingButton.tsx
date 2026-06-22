'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

type ManageBillingButtonProps = {
  disabled?: boolean;
};

export default function ManageBillingButton({ disabled = false }: ManageBillingButtonProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      toast({
        type: 'error',
        title: 'Billing portal error',
        description: error instanceof Error ? error.message : 'Could not open billing portal. Please try again.',
      });
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
