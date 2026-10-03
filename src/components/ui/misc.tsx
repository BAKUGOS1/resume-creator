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
        <rect x="3.5" y="1.5" width="17" height="21" rx="2.5" fill="#2340b8" />
        <rect x="6.5" y="5.2" width="7.5" height="1.9" rx=".95" fill="#fff" />
        <rect x="5.6" y="9.3" width="12.8" height="3.4" rx="1" fill="#ffd84d" />
        <rect x="6.5" y="10.1" width="11" height="1.6" rx=".8" fill="#1a2a6b" />
        <rect x="6.5" y="14.6" width="11" height="1.6" rx=".8" fill="#fff" opacity=".8" />
        <rect x="6.5" y="18" width="7.5" height="1.6" rx=".8" fill="#fff" opacity=".8" />
      </svg>
      <span className="whitespace-nowrap">Resume Creator</span>
    </span>
  );
}
