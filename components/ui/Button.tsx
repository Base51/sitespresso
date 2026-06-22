import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-slate-950 shadow-glow hover:bg-brand-primary-strong focus-visible:ring-brand-primary/40',
  secondary:
    'border border-brand-border bg-white/5 text-brand-text hover:border-brand-primary/50 hover:bg-white/10 focus-visible:ring-brand-primary/30',
  ghost:
    'text-brand-muted-strong hover:bg-white/6 hover:text-brand-text focus-visible:ring-brand-primary/30',
  danger:
    'bg-brand-danger text-white hover:bg-rose-500 focus-visible:ring-rose-500/30'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base'
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center rounded-xl font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-55',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}