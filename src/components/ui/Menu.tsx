import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { CheckIcon } from './icons';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  hint?: string;
  separatorBefore?: boolean;
  /** Makes the item a radio choice (menuitemradio) shown with a check mark. */
  checked?: boolean;
}

export interface MenuProps {
  /** Renders the trigger; spread the props onto a button. */
  trigger: (props: {
    ref: (el: HTMLButtonElement | null) => void;
    onClick: () => void;
    'aria-haspopup': 'menu';
    'aria-expanded': boolean;
    'aria-controls': string;
    onKeyDown: (e: KeyboardEvent) => void;
  }) => ReactNode;
  items: (MenuItem | false | null | undefined)[];
  align?: 'start' | 'end';
  label?: string;
}

/** Accessible dropdown menu (WAI-ARIA menu button pattern), rendered in a portal so it never gets clipped. */
export function Menu({ trigger, items, align = 'end', label }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const list = items.filter(Boolean) as MenuItem[];

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  /** Positions the menu under (or above) the trigger; returns false if the trigger is off-screen. */
  const place = useCallback(() => {
    if (!triggerRef.current) return false;
    const r = triggerRef.current.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return false;
    const height = listRef.current?.offsetHeight ?? 240;
    const width = listRef.current?.offsetWidth ?? 220;
    const up = r.bottom + height + 8 > window.innerHeight && r.top > height + 8;
    const left = Math.max(8, Math.min(window.innerWidth - width - 8, align === 'end' ? r.right - width : r.left));
    setPos({ top: up ? r.top - height - 6 : r.bottom + 6, left, up });
    return true;
  }, [align]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    // Start on the current choice in radio menus, otherwise on the first item.
    const first =
      listRef.current?.querySelector<HTMLElement>('[aria-checked="true"]') ?? listRef.current?.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled])');
    first?.focus();
    const onDown = (e: PointerEvent) => {
      if (!listRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) close(false);
    };
    // Follow the trigger while the page scrolls; close once it leaves the viewport.
    const onScroll = (e: Event) => {
      if (!listRef.current?.contains(e.target as Node) && !place()) close(false);
    };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, close, place]);

  const onListKey = (e: KeyboardEvent) => {
    const nodes = [...(listRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])') ?? [])];
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => nodes[(n + nodes.length) % nodes.length]?.focus();
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(nodes.length - 1);
    else if (e.key === 'Escape') close();
    else if (e.key === 'Tab') close(false);
    else return;
    e.preventDefault();
  };

  return (
    <>
      {trigger({
        ref: (el) => (triggerRef.current = el),
        onClick: () => setOpen((o) => !o),
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': id,
        onKeyDown: (e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        },
      })}
      {open &&
        createPortal(
          <div
            ref={listRef}
            id={id}
            role="menu"
            aria-label={label}
            onKeyDown={onListKey}
            style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
            className="z-50 max-h-[min(70vh,28rem)] min-w-[200px] overflow-y-auto rounded-xl border border-line bg-surface p-1 text-fg shadow-xl"
          >
            {list.map((item, i) => (
              <div key={i}>
                {item.separatorBefore && <div role="separator" className="my-1 h-px bg-line" />}
                <button
                  type="button"
                  role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
                  aria-checked={item.checked}
                  disabled={item.disabled}
                  onClick={() => {
                    close();
                    item.onSelect();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] outline-none hover:bg-surface-2 focus:bg-surface-2 disabled:opacity-40',
                    item.danger ? 'text-danger' : 'text-fg',
                  )}
                >
                  {item.icon && <span className={cn('shrink-0', !item.danger && 'text-muted')}>{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                  {item.hint && <kbd className="font-sans text-[11.5px] text-subtle">{item.hint}</kbd>}
                  {item.checked && <CheckIcon size={15} className="shrink-0 text-brand" />}
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
