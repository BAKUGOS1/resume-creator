import { useEffect, useState, type ReactNode } from 'react';
import { IconButton } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  EyeOffIcon,
  LayoutGridIcon,
  PlusIcon,
  Trash2Icon,
} from '../../components/ui/icons';
import { Menu } from '../../components/ui/Menu';
import { Badge } from '../../components/ui/misc';
import { fieldId } from '../../domain/checks';
import { formatDateRange } from '../../domain/dates';
import { createItem, SECTION_META } from '../../domain/defaults';
import { LIMITS, type ListSection, type Section, type SectionItem } from '../../domain/schema';
import { createId } from '../../lib/id';
import { cn } from '../../lib/cn';
import { useStore } from '../../lib/store';
import { toast, uiStore } from '../../store/ui';
import { move, useActions, useEditorContext } from './context';
import { TextAreaField } from './fields';
import { CertificationFields, CustomFields, EducationFields, ExperienceFields, ProjectFields, SkillFields } from './ItemForms';

/** Moves focus after the focused control is removed (e.g. deleting from a menu). */
function focusLater(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus({ preventScroll: true }));
}

function itemSummary(section: ListSection, item: SectionItem): { title: string; subtitle: string } {
  const range = 'start' in item ? formatDateRange(item, 'short') : '';
  const join = (...p: string[]) => p.filter((x) => x.trim()).join(' · ');
  switch (section.kind) {
    case 'experience':
      return 'role' in item ? { title: item.role || 'Untitled position', subtitle: join(item.organization, range) } : { title: '', subtitle: '' };
    case 'education':
      return 'degree' in item
        ? { title: item.degree || item.institution || 'Untitled education', subtitle: join(item.degree ? item.institution : '', range) }
        : { title: '', subtitle: '' };
    case 'projects':
      return 'stack' in item ? { title: item.name || 'Untitled project', subtitle: join(item.subtitle, range) } : { title: '', subtitle: '' };
    case 'skills':
      return 'keywords' in item ? { title: item.label || 'Skill group', subtitle: item.keywords } : { title: '', subtitle: '' };
    case 'certifications':
      return 'issuer' in item ? { title: item.name || 'Untitled certification', subtitle: item.issuer } : { title: '', subtitle: '' };
    case 'custom':
      return 'description' in item ? { title: item.title || 'Untitled entry', subtitle: join(item.subtitle, range) } : { title: '', subtitle: '' };
  }
}

function ItemBody({ section, item }: { section: ListSection; item: SectionItem }) {
  switch (section.kind) {
    case 'experience':
      return <ExperienceFields sectionId={section.id} item={item as never} />;
    case 'education':
      return <EducationFields sectionId={section.id} item={item as never} />;
    case 'projects':
      return <ProjectFields sectionId={section.id} item={item as never} />;
    case 'skills':
      return <SkillFields sectionId={section.id} item={item as never} />;
    case 'certifications':
      return <CertificationFields sectionId={section.id} item={item as never} />;
    case 'custom':
      return <CustomFields sectionId={section.id} item={item as never} compact={section.layout === 'compact'} />;
  }
}

function ItemCard({
  section,
  item,
  index,
  count,
  expanded,
  onToggle,
  hasIssue,
}: {
  section: ListSection;
  item: SectionItem;
  index: number;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  hasIssue: boolean;
}) {
  const { updateSection } = useActions();
  const { title, subtitle } = itemSummary(section, item);
  const bodyId = `item-body-${item.id}`;
  const items = () => section.items as SectionItem[];
  const edit = (fn: (list: SectionItem[]) => void) => updateSection(section.id, (s) => s.kind !== 'summary' && fn(s.items as SectionItem[]));

  return (
    <li
      className={cn('rounded-xl border bg-surface transition-colors', expanded ? 'border-line-strong shadow-sm' : 'border-line', !item.visible && 'opacity-70')}
    >
      <div className="flex items-center gap-1 py-1 pr-1 pl-1">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface-2"
        >
          <ChevronDownIcon className={cn('shrink-0 text-subtle transition-transform', !expanded && '-rotate-90')} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[13.5px] font-medium">{title}</span>
              {hasIssue && <span className="size-1.5 shrink-0 rounded-full bg-danger" aria-label="Has issues" />}
              {!item.visible && <Badge>Hidden</Badge>}
            </span>
            {subtitle && <span className="block truncate text-[12.5px] text-muted">{subtitle}</span>}
          </span>
        </button>
        <IconButton size="sm" label="Move up" disabled={index === 0} onClick={() => edit((l) => move(l, index, index - 1))} className="max-sm:hidden">
          <ArrowUpIcon size={14} />
        </IconButton>
        <IconButton size="sm" label="Move down" disabled={index === count - 1} onClick={() => edit((l) => move(l, index, index + 1))} className="max-sm:hidden">
          <ArrowDownIcon size={14} />
        </IconButton>
        <Menu
          label={`${title} actions`}
          trigger={(p) => (
            <IconButton size="sm" label={`More actions for ${title}`} {...p}>
              <EllipsisVerticalIcon size={15} />
            </IconButton>
          )}
          items={[
            { label: 'Move up', icon: <ArrowUpIcon />, disabled: index === 0, onSelect: () => edit((l) => move(l, index, index - 1)) },
            { label: 'Move down', icon: <ArrowDownIcon />, disabled: index === count - 1, onSelect: () => edit((l) => move(l, index, index + 1)) },
            {
              label: 'Duplicate',
              icon: <CopyIcon />,
              disabled: items().length >= LIMITS.itemsPerSection,
              onSelect: () =>
                edit((l) => {
                  const copy = structuredClone(l[index]!);
                  copy.id = createId('i_');
                  if ('bullets' in copy) copy.bullets.forEach((b) => (b.id = createId('b_')));
                  l.splice(index + 1, 0, copy);
                }),
            },
            {
              label: item.visible ? 'Hide from résumé' : 'Show on résumé',
              icon: item.visible ? <EyeOffIcon /> : <EyeIcon />,
              onSelect: () => edit((l) => void (l[index]!.visible = !l[index]!.visible)),
            },
            {
              label: 'Delete',
              icon: <Trash2Icon />,
              danger: true,
              separatorBefore: true,
              onSelect: () => {
                const snapshot = structuredClone(item);
                edit((l) => l.splice(index, 1));
                focusLater(fieldId('section', section.id, 'title'));
                toast({
                  kind: 'info',
                  title: `Deleted “${title}”`,
                  // Restore exactly this item (not "whatever was last changed").
                  action: {
                    label: 'Undo',
                    onClick: () =>
                      edit((l) => {
                        if (!l.some((i) => i.id === snapshot.id)) l.splice(Math.min(index, l.length), 0, snapshot);
                      }),
                  },
                });
              },
            },
          ]}
        />
      </div>
      {expanded && (
        <div id={bodyId} className="border-t border-line px-3.5 pt-3.5 pb-4">
          <ItemBody section={section} item={item} />
        </div>
      )}
    </li>
  );
}

export function SectionCard({ section, index, count, headerExtra }: { section: Section; index: number; count: number; headerExtra?: ReactNode }) {
  const { update, updateSection } = useActions();
  const { issues } = useEditorContext();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const focusRequest = useStore(uiStore, (s) => s.focusRequest);
  const meta = SECTION_META[section.kind];

  // Reveal the item/section that a check-panel issue points to.
  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.sectionId === section.id) setOpen(true);
    if (section.kind === 'summary') return;
    const hit = section.items.find((i) => focusRequest.field.includes(i.id) || ('bullets' in i && i.bullets.some((b) => focusRequest.field.includes(b.id))));
    if (hit) {
      setOpen(true);
      setExpanded((s) => new Set(s).add(hit.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to new requests only
  }, [focusRequest?.nonce]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addItem = () => {
    if (section.kind === 'summary') return;
    const item = createItem(section.kind);
    updateSection(section.id, (s) => s.kind !== 'summary' && (s.items as SectionItem[]).push(item));
    setExpanded((s) => new Set(s).add(item.id));
    setOpen(true);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`#item-body-${item.id} input, #item-body-${item.id} textarea`)?.focus());
  };

  const bodyId = `section-body-${section.id}`;
  const issueFields = new Set(issues.filter((i) => i.sectionId === section.id && i.severity !== 'tip').map((i) => i.field ?? ''));

  return (
    <section aria-labelledby={`section-title-${section.id}`} className={cn('rounded-2xl border border-line bg-surface-2/50', !section.visible && 'opacity-75')}>
      <header className="flex items-center gap-1 p-2">
        <IconButton
          size="sm"
          label={open ? `Collapse ${section.title}` : `Expand ${section.title}`}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
        >
          <ChevronDownIcon className={cn('transition-transform', !open && '-rotate-90')} />
        </IconButton>
        <h3 id={`section-title-${section.id}`} className="sr-only">
          {section.title || meta.label}
        </h3>
        <Input
          id={fieldId('section', section.id, 'title')}
          aria-label={`${meta.label} section heading`}
          value={section.title}
          maxLength={60}
          onChange={(e) => updateSection(section.id, (s) => void (s.title = e.target.value), `${section.id}.title`)}
          className="h-8! min-w-0 flex-1 border-transparent! bg-transparent! px-2! text-[14.5px] font-semibold hover:border-line-strong!"
        />
        {!section.visible && <Badge>Hidden</Badge>}
        {headerExtra}
        <IconButton
          size="sm"
          label={section.visible ? 'Hide section' : 'Show section'}
          onClick={() => updateSection(section.id, (s) => void (s.visible = !s.visible))}
        >
          {section.visible ? <EyeIcon size={15} /> : <EyeOffIcon size={15} />}
        </IconButton>
        <Menu
          label={`${section.title} section actions`}
          trigger={(p) => (
            <IconButton size="sm" label={`More actions for ${section.title} section`} {...p}>
              <EllipsisVerticalIcon size={15} />
            </IconButton>
          )}
          items={[
            { label: 'Move section up', icon: <ArrowUpIcon />, disabled: index === 0, onSelect: () => update((d) => move(d.sections, index, index - 1)) },
            {
              label: 'Move section down',
              icon: <ArrowDownIcon />,
              disabled: index === count - 1,
              onSelect: () => update((d) => move(d.sections, index, index + 1)),
            },
            section.kind === 'custom' && {
              label: section.layout === 'compact' ? 'Use detailed layout' : 'Use compact one-line layout',
              icon: <LayoutGridIcon />,
              onSelect: () => updateSection(section.id, (s) => s.kind === 'custom' && (s.layout = s.layout === 'compact' ? 'detailed' : 'compact')),
            },
            {
              label: 'Delete section',
              icon: <Trash2Icon />,
              danger: true,
              separatorBefore: true,
              onSelect: () => {
                const snapshot = structuredClone(section);
                update((d) => void d.sections.splice(index, 1));
                focusLater('editor-panel-content');
                toast({
                  kind: 'info',
                  title: `Deleted section “${section.title}”`,
                  action: {
                    label: 'Undo',
                    onClick: () =>
                      update((d) => {
                        if (!d.sections.some((s) => s.id === snapshot.id)) d.sections.splice(Math.min(index, d.sections.length), 0, snapshot);
                      }),
                  },
                });
              },
            },
          ]}
        />
      </header>
      {open && (
        <div id={bodyId} className="px-3 pb-3">
          {section.kind === 'summary' ? (
            <TextAreaField
              fid={fieldId('section', section.id, 'content')}
              label="Professional summary"
              value={section.content}
              onChange={(v) => updateSection(section.id, (s) => s.kind === 'summary' && (s.content = v), `${section.id}.content`)}
              placeholder="2–3 sentences: who you are, what you're great at and the impact you've had."
              minRows={4}
              soft={600}
            />
          ) : (
            <>
              {section.items.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {(section.items as SectionItem[]).map((item, i) => (
                    <ItemCard
                      key={item.id}
                      section={section}
                      item={item}
                      index={i}
                      count={section.items.length}
                      expanded={expanded.has(item.id)}
                      onToggle={() => toggle(item.id)}
                      hasIssue={[...issueFields].some((f) => f.includes(item.id))}
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-center text-[13px] text-muted">{meta.description}</p>
              )}
              <button
                type="button"
                onClick={addItem}
                disabled={section.items.length >= LIMITS.itemsPerSection}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-brand hover:bg-brand-soft disabled:opacity-50"
              >
                <PlusIcon size={15} /> Add {meta.itemNoun}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
