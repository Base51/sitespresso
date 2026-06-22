import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export default function Card({ children, className, ...props }: CardProps): JSX.Element {
  return (
    <div
      className={cx(
        'surface-glass brand-outline rounded-xl2 border border-white/10 p-6 shadow-panel',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}