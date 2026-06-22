import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type SharedProps = {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
};

type InputProps = SharedProps &
  ({ as?: 'input' } & InputHTMLAttributes<HTMLInputElement> | { as: 'select' } & SelectHTMLAttributes<HTMLSelectElement> | { as: 'textarea' } & TextareaHTMLAttributes<HTMLTextAreaElement>);

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

const controlClass =
  'w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary/60 focus-visible:ring-2 focus-visible:ring-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-55';

export default function Input(props: InputProps): JSX.Element {
  const { label, error, hint, className } = props;
  const id = props.id;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-brand-muted-strong">
          {label}
        </label>
      ) : null}

      {props.as === 'select' ? (
        <select {...props} aria-describedby={describedBy} className={cx(controlClass, className)} />
      ) : props.as === 'textarea' ? (
        <textarea {...props} aria-describedby={describedBy} className={cx(controlClass, 'min-h-[120px]', className)} />
      ) : (
        <input {...props} aria-describedby={describedBy} className={cx(controlClass, className)} />
      )}

      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-brand-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}