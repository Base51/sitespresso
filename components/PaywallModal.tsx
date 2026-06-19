'use client';

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
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-amber-300">Starter Plan Required</p>
        <h3 className="mb-3 text-2xl font-semibold text-white">Publish Your Site for $9/month</h3>
        <p className="mb-5 text-sm leading-relaxed text-slate-300">
          Free plan is for draft editing only. To publish your website on your live subdomain,
          continue to Stripe Checkout and activate the Starter subscription.
        </p>

        <ul className="mb-6 space-y-2 text-sm text-slate-300">
          <li>• Live publishing on <span className="font-medium text-white">yourname.sitespresso.com</span></li>
          <li>• Ongoing edits and updates</li>
          <li>• Stripe Billing Portal access</li>
        </ul>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Redirecting…' : 'Continue to Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
