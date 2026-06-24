import { BILLING_CURRENCY_CODE } from '@/lib/billing/plans';

export default function GlobalFooter(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-brand-muted md:flex-row md:items-center md:justify-between">
        <p>© {year} SiteSpresso. AI website builder for local businesses.</p>
        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.16em] text-brand-muted-strong">
          <span>Billing currency: {BILLING_CURRENCY_CODE}</span>
          <span>Powered by Stripe</span>
          <span>Hosted on Vercel</span>
        </div>
      </div>
    </footer>
  );
}
