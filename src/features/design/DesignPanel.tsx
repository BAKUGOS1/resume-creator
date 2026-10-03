import { Field, Select } from '../../components/ui/Field';
import { CheckIcon, RotateCcwIcon } from '../../components/ui/icons';
import { Segmented } from '../../components/ui/Segmented';
import { Switch } from '../../components/ui/Switch';
import type { Design, Resume, TemplateId } from '../../domain/schema';
import { accentOf, MIN_FIT_SCALE, TEMPLATE_LIST, templateOf, type LayoutResult } from '../../engine';
import { cn } from '../../lib/cn';
import { useActions } from '../editor/context';
import { PageSvg } from '../preview/PageSvg';
import { useLayout } from '../preview/useLayout';

function TemplateThumb({ resume, templateId, name }: { resume: Resume; templateId: TemplateId; name: string }) {
  const { layout } = useLayout({ ...resume, templateId, design: { ...resume.design, accent: null, fitToPage: false } });
  const page = layout?.pages[0];
  return (
    <div className="aspect-[595/842] w-full overflow-hidden rounded-md border border-line bg-white">
      {page ? <PageSvg page={page} label={`${name} template preview`} interactiveLinks={false} /> : <div className="size-full animate-pulse bg-surface-2" />}
    </div>
  );
}

export function DesignPanel({ resume, layout }: { resume: Resume; layout: LayoutResult | null }) {
  const { update } = useActions();
  const spec = templateOf(resume);
  const accent = accentOf(resume);
  const setDesign = <K extends keyof Design>(key: K, value: Design[K], coalesce?: string) => update((d) => void (d.design[key] = value), coalesce);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="tpl-heading" className="flex flex-col gap-3">
        <div>
          <h3 id="tpl-heading" className="text-[14.5px] font-semibold">
            Template
          </h3>
          <p className="text-[13px] text-muted">All templates are single-column with real text, so ATS parsers read them the same way.</p>
        </div>
        <div role="radiogroup" aria-labelledby="tpl-heading" className="grid grid-cols-2 gap-3">
          {TEMPLATE_LIST.map((t) => {
            const active = t.id === resume.templateId;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-describedby={`tpl-desc-${t.id}`}
                onClick={() => update((d) => void ((d.templateId = t.id), (d.design.accent = null)))}
                className={cn(
                  'group flex flex-col gap-2 rounded-xl border p-2 text-left transition-colors',
                  active ? 'border-brand ring-2 ring-brand/25' : 'border-line hover:border-line-strong',
                )}
              >
                <TemplateThumb resume={resume} templateId={t.id} name={t.name} />
                <span className="flex items-center justify-between px-0.5">
                  <span className="text-[13.5px] font-medium">{t.name}</span>
                  {active && <CheckIcon className="text-brand" />}
                </span>
                <span id={`tpl-desc-${t.id}`} className="px-0.5 text-[12px] leading-snug text-muted">
                  {t.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="color-heading" className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 id="color-heading" className="text-[14.5px] font-semibold">
            Accent colour
          </h3>
          {resume.design.accent && (
            <button type="button" onClick={() => setDesign('accent', null)} className="inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-fg">
              <RotateCcwIcon size={13} /> Template default
            </button>
          )}
        </div>
        <div role="radiogroup" aria-labelledby="color-heading" className="flex flex-wrap items-center gap-2">
          {spec.accents.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={accent.toLowerCase() === c.toLowerCase()}
              aria-label={`Accent ${c}`}
              onClick={() => setDesign('accent', c === spec.defaultAccent ? null : c)}
              className={cn(
                'grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-surface transition',
                accent.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-fg' : 'hover:scale-110',
              )}
              style={{ background: c }}
            >
              {accent.toLowerCase() === c.toLowerCase() && <CheckIcon size={14} className="text-white" />}
            </button>
          ))}
          <label
            className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-line-strong text-[11px] text-muted"
            title="Custom colour"
          >
            <span aria-hidden="true">+</span>
            <input
              type="color"
              aria-label="Custom accent colour"
              value={accent}
              onChange={(e) => setDesign('accent', e.target.value, 'design.accent')}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </section>

      <section aria-labelledby="layout-heading" className="flex flex-col gap-4">
        <h3 id="layout-heading" className="text-[14.5px] font-semibold">
          Layout
        </h3>
        <Field
          id="font-scale"
          label="Text size"
          aside={<span className="text-[12.5px] text-muted tabular-nums">{Math.round(resume.design.fontScale * 100)}%</span>}
        >
          {(a11y) => (
            <input
              {...a11y}
              type="range"
              min={85}
              max={120}
              step={5}
              value={Math.round(resume.design.fontScale * 100)}
              onChange={(e) => setDesign('fontScale', Number(e.target.value) / 100, 'design.fontScale')}
              className="w-full accent-[var(--brand)]"
            />
          )}
        </Field>
        <Segmented
          label="Margins"
          value={resume.design.margins}
          onChange={(v) => setDesign('margins', v)}
          options={[
            { value: 'narrow', label: 'Narrow' },
            { value: 'normal', label: 'Normal' },
            { value: 'wide', label: 'Wide' },
          ]}
        />
        <Segmented
          label="Spacing"
          value={resume.design.spacing}
          onChange={(v) => setDesign('spacing', v)}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'normal', label: 'Normal' },
            { value: 'relaxed', label: 'Relaxed' },
          ]}
        />
        <Segmented
          label="Paper size"
          value={resume.design.pageSize}
          onChange={(v) => setDesign('pageSize', v)}
          options={[
            { value: 'a4', label: 'A4' },
            { value: 'letter', label: 'US Letter' },
          ]}
        />
        <Field id="date-format" label="Date format">
          {(a11y) => (
            <Select {...a11y} value={resume.design.dateFormat} onChange={(e) => setDesign('dateFormat', e.target.value as Design['dateFormat'])}>
              <option value="short">Nov 2025</option>
              <option value="long">November 2025</option>
              <option value="numeric">11/2025</option>
              <option value="year">2025</option>
            </Select>
          )}
        </Field>
        <div className="rounded-xl border border-line p-3">
          <Switch
            checked={resume.design.fitToPage}
            onChange={(v) => setDesign('fitToPage', v)}
            label="Fit to one page"
            description={`Shrinks text (down to ${Math.round(MIN_FIT_SCALE * 100)}%) to keep everything on a single page.`}
          />
          {resume.design.fitToPage && layout && !layout.fitted && (
            <p role="status" className="mt-2 rounded-lg bg-warning-soft px-2.5 py-2 text-[12.5px] text-warning">
              Too much content for one page even at the smallest readable size. Trim content or turn this off.
            </p>
          )}
          {resume.design.fitToPage && layout?.fitted && layout.scale < resume.design.fontScale && (
            <p className="mt-2 text-[12.5px] text-muted">Text scaled to {Math.round(layout.scale * 100)}% to fit.</p>
          )}
        </div>
      </section>
    </div>
  );
}
