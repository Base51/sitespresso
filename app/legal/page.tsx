import Link from 'next/link';

const LEGAL_PAGES = [
  { href: '/legal/privacy', title: 'Privacy Policy' },
  { href: '/legal/terms', title: 'Terms of Service' },
  { href: '/legal/cookies', title: 'Cookie Policy' },
  { href: '/legal/refunds', title: 'Refund Policy' },
  { href: '/legal/dpa', title: 'Data Processing Addendum (DPA)' },
  { href: '/legal/contact', title: 'Contact and Imprint' },
];

export default function LegalIndexPage(): JSX.Element {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-brand-muted-strong">Legal</p>
      <h1 className="mt-2 font-display text-3xl text-white md:text-4xl">Legal Center</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-muted">
        This page collects SiteSpresso legal policies and trust information. These documents
        explain how we process data, bill subscriptions, and support our users.
      </p>

      <div className="mt-8 grid gap-3">
        {LEGAL_PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-brand-muted transition hover:border-white/20 hover:text-white"
          >
            {page.title}
          </Link>
        ))}
      </div>
    </main>
  );
}