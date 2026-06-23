'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  PLAN_FEATURES,
  PLAN_LABELS,
  PLAN_ORDER,
  PLAN_PRICING,
  type BillingInterval,
  type PaidPlan,
} from '@/lib/billing/plans';

type PaywallModalProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  selectedPlan: PaidPlan;
  selectedBilling: BillingInterval;
  onPlanChange: (plan: PaidPlan) => void;
  onBillingChange: (billing: BillingInterval) => void;
  onContinue: () => void;
};

export default function PaywallModal({
  open,
  loading = false,
  onClose,
  selectedPlan,
  selectedBilling,
  onPlanChange,
  onBillingChange,
  onContinue,
}: PaywallModalProps): JSX.Element | null {
  if (!open) return null;

  const selectedPrice = PLAN_PRICING[selectedPlan][selectedBilling];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <Card className="w-full max-w-3xl p-6">
        <div className="mb-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-primary">Choose A Publishing Plan</p>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
            Publish your site with {PLAN_LABELS[selectedPlan]} for ${selectedPrice}/{selectedBilling === 'monthly' ? 'month' : 'year'}
          </h3>
          <p className="text-sm leading-relaxed text-brand-muted">
            Free plan is for draft editing only. Choose the tier that matches how much you plan to publish and iterate, then continue to Stripe Checkout.
          </p>
        </div>

        <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => onBillingChange('monthly')}
            className={`rounded-full px-4 py-2 text-sm transition ${selectedBilling === 'monthly' ? 'bg-white text-slate-900' : 'text-brand-muted hover:text-white'}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => onBillingChange('annual')}
            className={`rounded-full px-4 py-2 text-sm transition ${selectedBilling === 'annual' ? 'bg-white text-slate-900' : 'text-brand-muted hover:text-white'}`}
          >
            Annual
          </button>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {PLAN_ORDER.map((plan) => {
            const active = plan === selectedPlan;
            const price = PLAN_PRICING[plan][selectedBilling];

            return (
              <button
                key={plan}
                type="button"
                onClick={() => onPlanChange(plan)}
                className={`rounded-2xl border p-4 text-left transition ${active ? 'border-brand-primary bg-brand-primary/10 shadow-[0_0_0_1px_rgba(96,165,250,0.35)]' : 'border-white/10 bg-white/3 hover:border-white/20'}`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{PLAN_LABELS[plan]}</p>
                    <p className="text-sm text-brand-muted">${price}/{selectedBilling === 'monthly' ? 'mo' : 'yr'}</p>
                  </div>
                  {active && <span className="rounded-full bg-brand-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">Selected</span>}
                </div>
                <ul className="space-y-2 text-sm text-brand-muted">
                  {PLAN_FEATURES[plan].map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            disabled={loading}
            variant="ghost"
            size="md"
            className="flex-1"
          >
            Not now
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            disabled={loading}
            variant="primary"
            size="md"
            className="flex-1"
          >
            {loading ? 'Redirecting...' : `Continue with ${PLAN_LABELS[selectedPlan]}`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
