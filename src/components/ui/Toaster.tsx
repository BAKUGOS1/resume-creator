import { useEffect } from 'react';
import { cn } from '../../lib/cn';
import { useStore } from '../../lib/store';
import { dismissToast, uiStore, type Toast } from '../../store/ui';
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, XIcon } from './icons';

const icons = { success: CircleCheckIcon, error: CircleAlertIcon, warning: TriangleAlertIcon, info: InfoIcon };
const tones = { success: 'text-success', error: 'text-danger', warning: 'text-warning', info: 'text-info' };

function ToastView({ t }: { t: Toast }) {
  useEffect(() => {
    const ms = t.duration ?? (t.kind === 'error' ? 9000 : t.action ? 7000 : 4500);
    const timer = setTimeout(() => dismissToast(t.id), ms);
    return () => clearTimeout(timer);
  }, [t]);
  const Icon = icons[t.kind];
  return (
    <div
      role={t.kind === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-fg shadow-xl"
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', tones[t.kind])} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-medium">{t.title}</p>
        {t.message && <p className="mt-0.5 text-[13px] text-muted">{t.message}</p>}
      </div>
      {t.action && (
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 text-[13px] font-medium text-brand hover:bg-brand-soft"
          onClick={() => {
            t.action?.onClick();
            dismissToast(t.id);
          }}
        >
          {t.action.label}
        </button>
      )}
      <button type="button" aria-label="Dismiss notification" className="shrink-0 rounded p-0.5 text-subtle hover:text-fg" onClick={() => dismissToast(t.id)}>
        <XIcon size={14} />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useStore(uiStore, (s) => s.toasts);
  return (
    <div data-toaster aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((t) => (
        <ToastView key={t.id} t={t} />
      ))}
    </div>
  );
}
