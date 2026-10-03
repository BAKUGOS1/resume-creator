import { useEffect, useRef, type KeyboardEvent } from 'react';
import { IconButton } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Field';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from '../../components/ui/icons';
import { fieldId } from '../../domain/checks';
import { createBullet } from '../../domain/defaults';
import { LIMITS, type Bullet, type SectionItem } from '../../domain/schema';
import { cn } from '../../lib/cn';
import { move, useActions } from './context';

/**
 * Bullet list editor. Enter adds a bullet, Backspace on an empty bullet removes
 * it, Alt+↑/↓ reorders. Supports **bold** markup.
 */
export function BulletsEditor({ sectionId, itemId, bullets, label = 'Highlights' }: { sectionId: string; itemId: string; bullets: Bullet[]; label?: string }) {
  const { updateItem } = useActions();
  const focusNext = useRef<string | null>(null);

  useEffect(() => {
    if (!focusNext.current) return;
    const el = document.getElementById(fieldId('bullet', focusNext.current)) as HTMLTextAreaElement | null;
    focusNext.current = null;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  });

  const edit = (fn: (list: Bullet[]) => void, key?: string) =>
    updateItem(
      sectionId,
      itemId,
      (it: SectionItem) => {
        if ('bullets' in it) fn(it.bullets);
      },
      key,
    );

  const add = (at: number) => {
    if (bullets.length >= LIMITS.bulletsPerItem) return;
    const b = createBullet();
    focusNext.current = b.id;
    edit((list) => list.splice(at, 0, b));
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>, i: number, b: Bullet) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      add(i + 1);
    } else if (e.key === 'Backspace' && !b.text && bullets.length > 0) {
      e.preventDefault();
      focusNext.current = bullets[i - 1]?.id ?? bullets[i + 1]?.id ?? null;
      edit((list) => list.splice(i, 1));
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      focusNext.current = b.id;
      edit((list) => move(list, i, i + (e.key === 'ArrowUp' ? -1 : 1)));
    }
  };

  return (
    <fieldset className="flex flex-col gap-2" id={fieldId('item', itemId, 'bullets')} tabIndex={-1}>
      <legend className="mb-1.5 text-[13px] font-medium">
        {label} <span className="font-normal text-subtle">· Enter for a new line, **bold** for emphasis</span>
      </legend>
      {bullets.map((b, i) => (
        <div key={b.id} className="group flex items-start gap-1.5">
          <span aria-hidden="true" className="mt-2.5 text-subtle">
            •
          </span>
          <Textarea
            id={fieldId('bullet', b.id)}
            aria-label={`${label} ${i + 1} of ${bullets.length}`}
            minRows={1}
            value={b.text}
            maxLength={LIMITS.bullet}
            placeholder="Led a team of 5 to ship … resulting in 30% …"
            onKeyDown={(e) => onKey(e, i, b)}
            onChange={(e) => {
              const text = e.target.value.replace(/\n/g, ' ');
              edit((list) => void (list[i] = { ...list[i]!, text }), `${b.id}.text`);
            }}
            className={cn('min-h-9 py-1.5!', b.text.length > 260 && 'border-warning!')}
          />
          <div className="flex shrink-0 items-center opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <IconButton size="sm" label="Move up" disabled={i === 0} onClick={() => edit((list) => move(list, i, i - 1))}>
              <ArrowUpIcon size={14} />
            </IconButton>
            <IconButton size="sm" label="Move down" disabled={i === bullets.length - 1} onClick={() => edit((list) => move(list, i, i + 1))}>
              <ArrowDownIcon size={14} />
            </IconButton>
            <IconButton size="sm" label="Delete line" onClick={() => edit((list) => list.splice(i, 1))}>
              <Trash2Icon size={14} />
            </IconButton>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => add(bullets.length)}
        disabled={bullets.length >= LIMITS.bulletsPerItem}
        className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-brand hover:bg-brand-soft disabled:opacity-50"
      >
        <PlusIcon size={14} /> Add line
      </button>
    </fieldset>
  );
}
