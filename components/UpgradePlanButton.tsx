'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PLAN_LABELS, type BillingInterval, type PaidPlan } from '@/lib/billing/plans';
import type { ButtonVariant } from '@/components/ui/Button';

type UpgradePlanButtonProps = {
  plan: PaidPlan;
  billing?: BillingInterval;
  size?: 'sm' | 'md' | 'lg';
  variant?: ButtonVariant;
  label?: string;
  unavailable?: boolean;
  unavailableReason?: string;
};

export default function UpgradePlanButton({
  plan,
  billing = 'monthly',
  size = 'sm',
  variant = 'primary',
  label,
  unavailable = false,
  unavailableReason = 'This billing option is not configured yet.',
}: UpgradePlanButtonProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function startCheckout() {
    if (unavailable) {
      toast({
        type: 'warning',
        title: 'Plan unavailable',
        description: unavailableReason,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing }),
      });

      const json = await res.json();
      if (!res.ok || !json.checkoutUrl) {
        throw new Error(json.error ?? 'Unable to start upgrade flow.');
      }

      window.location.href = json.checkoutUrl as string;
    } catch (error) {
      toast({
        type: 'error',
        title: 'Upgrade failed',
        description: error instanceof Error ? error.message : 'Unable to start upgrade flow.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={startCheckout} disabled={loading || unavailable} variant={variant} size={size} title={unavailable ? unavailableReason : undefined}>
      {loading ? 'Redirecting…' : label ?? `Upgrade to ${PLAN_LABELS[plan]}`}
    </Button>
  );
}