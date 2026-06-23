'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PLAN_LABELS, type BillingInterval, type PaidPlan } from '@/lib/billing/plans';

type UpgradePlanButtonProps = {
  plan: PaidPlan;
  billing?: BillingInterval;
  size?: 'sm' | 'md' | 'lg';
};

export default function UpgradePlanButton({
  plan,
  billing = 'monthly',
  size = 'sm',
}: UpgradePlanButtonProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function startCheckout() {
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
    <Button onClick={startCheckout} disabled={loading} variant="primary" size={size}>
      {loading ? 'Redirecting…' : `Upgrade to ${PLAN_LABELS[plan]}`}
    </Button>
  );
}