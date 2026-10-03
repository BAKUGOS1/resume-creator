import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';
import { XIcon } from './icons';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/** Modal built on <dialog>: native focus trap, Esc to close, top-layer rendering. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      // showModal() focuses the first focusable element (Close); prefer an explicit target.
      el.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop click
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50',
        size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg',
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
            <div>
              <h2 id={titleId} className="text-[17px] font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-[13.5px] text-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Close" size="sm" onClick={onClose} className="-mt-1 -mr-1">
              <XIcon />
            </IconButton>
          </header>
          {children && <div className="overflow-y-auto px-5 pb-2">{children}</div>}
          {footer && <footer className="flex flex-wrap justify-end gap-2 px-5 pt-3 pb-5">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
