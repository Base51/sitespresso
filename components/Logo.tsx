import Link from 'next/link';

type LogoProps = {
  href?: string;
  compact?: boolean;
};

function Mark(): JSX.Element {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary via-orange-400 to-brand-accent text-sm font-black text-slate-950 shadow-glow">
      SS
    </span>
  );
}

export default function Logo({ href, compact = false }: LogoProps): JSX.Element {
  const content = (
    <span className="inline-flex items-center gap-3">
      <Mark />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-semibold tracking-tight text-brand-text">SiteSpresso</span>
          <span className="text-[11px] uppercase tracking-[0.24em] text-brand-muted">launch faster</span>
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}