import { forwardRef, useLayoutEffect, useRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const controlClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3 text-[14px] text-fg placeholder:text-subtle transition-colors hover:border-subtle focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/20 disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20';

export interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  /** Shown at the end of the label row, e.g. a character counter. */
  aside?: ReactNode;
  className?: string;
  optional?: boolean;
  children: (a11y: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
}

/** Label + control + hint/error with correct aria wiring. */
export function Field({ id, label, hint, error, aside, optional, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
          {optional && <span className="ml-1 font-normal text-subtle">(optional)</span>}
        </label>
        {aside}
      </div>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={errorId} className="text-[12.5px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12.5px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(controlClass, 'h-9', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...rest }, ref) {
  return <select ref={ref} className={cn(controlClass, 'h-9 pr-8', className)} {...rest} />;
});

/** Textarea that grows with its content. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }>(function Textarea(
  { className, minRows = 2, value, ...rest },
  forwarded,
) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={(el) => {
        inner.current = el;
        if (typeof forwarded === 'function') forwarded(el);
        else if (forwarded) forwarded.current = el;
      }}
      rows={minRows}
      value={value}
      className={cn(controlClass, 'resize-none overflow-hidden py-2 leading-relaxed', className)}
      {...rest}
    />
  );
});

export function CharCount({ value, soft, max }: { value: string; soft: number; max: number }) {
  const n = value.length;
  if (n < soft * 0.8) return null;
  return (
    <span className={cn('text-[12px] tabular-nums', n > soft ? 'text-warning' : 'text-subtle', n >= max && 'text-danger')}>
      {n}/{soft}
    </span>
  );
}
