/** Editor context: the open résumé id, typed update helpers and field-level issues. */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Issue } from '../../domain/checks';
import type { Resume, Section, SectionItem } from '../../domain/schema';
import { updateResume } from '../../store/resumes';

interface EditorContextValue {
  id: string;
  issues: Issue[];
}

const Ctx = createContext<EditorContextValue | null>(null);

export function EditorProvider({ id, issues, children }: EditorContextValue & { children: ReactNode }) {
  const value = useMemo(() => ({ id, issues }), [id, issues]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEditorContext(): EditorContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useEditorContext must be used inside <EditorProvider>');
  return v;
}

/** Inline (format) error for a field, if any. */
export function useFieldError(fieldId: string): string | null {
  const { issues } = useEditorContext();
  return issues.find((i) => i.inline && i.field === fieldId)?.message ?? null;
}

export function useActions() {
  const { id } = useEditorContext();
  return useMemo(() => {
    const update = (recipe: (d: Resume) => void, key?: string) => updateResume(id, recipe, { coalesceKey: key });
    const updateSection = (sectionId: string, fn: (s: Section, d: Resume) => void, key?: string) =>
      update((d) => {
        const s = d.sections.find((x) => x.id === sectionId);
        if (s) fn(s, d);
      }, key);
    const updateItem = (sectionId: string, itemId: string, fn: (item: SectionItem, s: Section) => void, key?: string) =>
      updateSection(
        sectionId,
        (s) => {
          if (s.kind === 'summary') return;
          const item = (s.items as SectionItem[]).find((i) => i.id === itemId);
          if (item) fn(item, s);
        },
        key,
      );
    return { update, updateSection, updateItem };
  }, [id]);
}

/** Returns a setter factory for one item: set('role')(value). */
export function useItemSetter<I extends SectionItem>(sectionId: string, item: I) {
  const { updateItem } = useActions();
  return <K extends keyof I & string>(key: K) =>
    (value: I[K]) =>
      updateItem(sectionId, item.id, (it) => void ((it as I)[key] = value), `${item.id}.${key}`);
}

/** Moves an element within an array (in place). */
export function move<T>(list: T[], from: number, to: number): void {
  if (to < 0 || to >= list.length || from === to) return;
  const [x] = list.splice(from, 1);
  list.splice(to, 0, x as T);
}
