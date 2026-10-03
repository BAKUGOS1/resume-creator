import { useId, type KeyboardEvent } from 'react';
import { cn } from '../../lib/cn';

export interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Radio group styled as a segmented control (arrow keys move selection). */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  const id = useId();
  const onKey = (e: KeyboardEvent) => {
    const i = options.findIndex((o) => o.value === value);
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = options[(i + d + options.length) % options.length]!;
    onChange(next.value);
    (e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus();
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-[13px] font-medium">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={id} onKeyDown={onKey} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-surface-2 p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              data-value={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                'h-7 rounded-md px-2 text-[13px] transition-colors',
                active ? 'bg-surface font-medium text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
