'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type PaywallModalProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onContinue: () => void;
};

export default function PaywallModal({
  open,
  loading = false,
  onClose,
  onContinue,
}: PaywallModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-primary">Starter Plan Required</p>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white">Publish Your Site for $9/month</h3>
          <p className="text-sm leading-relaxed text-brand-muted">
            Free plan is for draft editing only. To publish your website on your live subdomain,
            continue to Stripe Checkout and activate the Starter subscription.
          </p>
        </div>

        <ul className="mb-6 space-y-2 text-sm text-brand-muted">
          <li>• Live publishing on <span className="font-medium text-white">yourname.sitespresso.com</span></li>
          <li>• Ongoing edits and updates</li>
          <li>• Stripe Billing Portal access</li>
        </ul>

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
            {loading ? 'Redirecting...' : 'Continue to Checkout'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
