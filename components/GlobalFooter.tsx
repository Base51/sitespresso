import Link from 'next/link';
import { BILLING_CURRENCY_CODE } from '@/lib/billing/plans';

const LEGAL_LINKS = [
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/legal/refunds', label: 'Refunds' },
  { href: '/legal/dpa', label: 'DPA' },
  { href: '/legal/contact', label: 'Contact' },
];

const SOCIAL_LINKS = [
  {
    href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL || 'https://instagram.com',
    label: 'Instagram',
    fallbackText: 'IG',
  },
  {
    href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL || 'https://facebook.com',
    label: 'Facebook',
    fallbackText: 'FB',
  },
  {
    href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL || 'https://linkedin.com',
    label: 'LinkedIn',
    fallbackText: 'IN',
  },
];

export default function GlobalFooter(): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 text-brand-muted">
        <div className="grid gap-6 md:grid-cols-[1.6fr_1fr_1.2fr]">
          <div className="space-y-2">
            <p className="text-sm">© {year} SiteSpresso. AI website builder for local businesses.</p>
            <p className="text-xs text-brand-muted-strong">
              By using SiteSpresso, you agree to our Terms and Privacy Policy.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-brand-muted-strong">Follow us</p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ href, label, fallbackText }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex rounded-md border border-white/10 bg-white/5 p-2 text-brand-muted transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <span className="inline-flex h-4 min-w-4 items-center justify-center text-[10px] font-semibold uppercase" aria-hidden="true">
                    {fallbackText}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-brand-muted-strong">Legal</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {LEGAL_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-brand-muted transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.16em] text-brand-muted-strong">
          <span>Billing currency: {BILLING_CURRENCY_CODE}</span>
          <span>Powered by Stripe</span>
          <span>Hosted on Vercel</span>
          <span>Support: legal@sitespresso.com</span>
        </div>
      </div>
    </footer>
  );
}
