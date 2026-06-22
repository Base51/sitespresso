'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon = '○',
  title,
  description,
  action,
}: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-brand-muted/10 bg-gradient-to-b from-brand-muted/5 to-transparent px-6 py-12 text-center">
      <div className="mb-4 text-4xl opacity-40">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-brand-muted">{title}</h3>
      {description && <p className="mb-4 text-sm text-brand-muted/60">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
