import Link from 'next/link';

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

type LegalPageTemplateProps = {
  title: string;
  summary: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export default function LegalPageTemplate({
  title,
  summary,
  lastUpdated,
  sections,
}: LegalPageTemplateProps): JSX.Element {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-brand-muted-strong">Legal</p>
        <h1 className="font-display text-3xl text-white md:text-4xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-7 text-brand-muted">{summary}</p>
        <p className="text-xs text-brand-muted-strong">Last updated: {lastUpdated}</p>
      </div>

      <nav className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-brand-muted-strong">On this page</p>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm text-brand-muted transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-20 space-y-3">
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-brand-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-muted">
        <p>
          Questions about these terms? Contact us at{' '}
          <a
            href="mailto:legal@sitespresso.com"
            className="text-white underline underline-offset-4"
          >
            legal@sitespresso.com
          </a>{' '}
          or visit our{' '}
          <Link href="/legal/contact" className="text-white underline underline-offset-4">
            Contact page
          </Link>
          .
        </p>
      </div>
    </main>
  );
}