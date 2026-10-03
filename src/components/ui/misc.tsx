import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'neutral' | 'brand' | 'danger' | 'warning' | 'success';
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'bg-surface-2 text-muted',
    brand: 'bg-brand-soft text-brand',
    danger: 'bg-danger-soft text-danger',
    warning: 'bg-warning-soft text-warning',
    success: 'bg-success-soft text-success',
  };
  return (
    <span className={cn('inline-flex h-5 items-center rounded-full px-1.5 text-[11.5px] font-medium tabular-nums', tones[tone], className)}>{children}</span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-surface-2 px-1 font-sans text-[11px] text-muted">{children}</kbd>;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="2" width="18" height="20" rx="3" fill="var(--brand)" />
        <rect x="6.5" y="6" width="7" height="2" rx="1" fill="var(--brand-fg)" />
        <rect x="6.5" y="10.5" width="11" height="1.6" rx=".8" fill="var(--brand-fg)" opacity=".75" />
        <rect x="6.5" y="14" width="11" height="1.6" rx=".8" fill="var(--brand-fg)" opacity=".75" />
        <rect x="6.5" y="17.5" width="7" height="1.6" rx=".8" fill="var(--brand-fg)" opacity=".75" />
      </svg>
      <span className="whitespace-nowrap">Resume Creator</span>
    </span>
  );
}
