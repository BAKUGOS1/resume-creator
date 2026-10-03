import { type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface TabDef<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

/** Tab list (WAI-ARIA tabs pattern, automatic activation). Panels use `tabPanelProps`. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  idPrefix,
  className,
}: {
  tabs: TabDef<T>[];
  value: T;
  onChange: (v: T) => void;
  idPrefix: string;
  className?: string;
}) {
  const onKey = (e: KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === value);
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = tabs[(i + d + tabs.length) % tabs.length]!;
    onChange(next.id);
    document.getElementById(`${idPrefix}-tab-${next.id}`)?.focus();
  };
  return (
    <div role="tablist" onKeyDown={onKey} className={cn('flex gap-1', className)}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            id={`${idPrefix}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[13.5px] font-medium transition-colors',
              active ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2/60 hover:text-fg',
            )}
          >
            {t.icon}
            {t.label}
            {t.badge}
          </button>
        );
      })}
    </div>
  );
}

export const tabPanelProps = (idPrefix: string, id: string) => ({
  id: `${idPrefix}-panel-${id}`,
  role: 'tabpanel' as const,
  'aria-labelledby': `${idPrefix}-tab-${id}`,
  tabIndex: -1,
});
