import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton } from '../../components/ui/Button';
import {
  CircleAlertIcon,
  FileTextIcon,
  GlobeIcon,
  LoaderCircleIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '../../components/ui/icons';
import type { Resume } from '../../domain/schema';
import type { LayoutResult } from '../../engine';
import type { FontSet } from '../../engine/fonts/loader';
import { buildResumeHtml } from '../../engine/html/buildHtml';
import { cn } from '../../lib/cn';
import { PageSvg } from './PageSvg';

const ZOOMS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
const PT_TO_PX = 96 / 72;

type Mode = 'page' | 'web';
type Device = 'phone' | 'tablet' | 'desktop';
const DEVICES: { id: Device; label: string; width: number | null; icon: typeof SmartphoneIcon }[] = [
  { id: 'phone', label: 'Phone (390 px)', width: 390, icon: SmartphoneIcon },
  { id: 'tablet', label: 'Tablet (768 px)', width: 768, icon: TabletIcon },
  { id: 'desktop', label: 'Desktop (full width)', width: null, icon: MonitorIcon },
];

const isNarrow = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;

function Toggle<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon: typeof GlobeIcon; text?: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-lg bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          aria-label={o.label}
          title={o.label}
          onClick={() => onChange(o.id)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px]',
            value === o.id ? 'bg-surface font-medium text-fg shadow-sm' : 'text-muted hover:text-fg',
          )}
        >
          <o.icon size={14} />
          {o.text}
        </button>
      ))}
    </div>
  );
}

export interface PreviewPaneProps {
  resume: Resume;
  layout: LayoutResult | null;
  fonts: FontSet | null;
  loading: boolean;
  error: string | null;
}

export function PreviewPane({ resume, layout, fonts, loading, error }: PreviewPaneProps) {
  const [mode, setMode] = useState<Mode>(() => (isNarrow() ? 'web' : 'page'));
  const [device, setDevice] = useState<Device>(() => (isNarrow() ? 'desktop' : 'phone'));
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [available, setAvailable] = useState(800);
  const scroller = useRef<HTMLDivElement>(null);
  const deferred = useDeferredValue(resume);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setAvailable(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const html = useMemo(() => (mode === 'web' ? buildResumeHtml(deferred, { fonts }) : ''), [mode, deferred, fonts]);

  const page = layout?.pages[0];
  const natural = (page?.width ?? 595) * PT_TO_PX;
  const fitScale = Math.min(1.25, Math.max(0.3, (available - 48) / natural));
  const scale = zoom === 'fit' ? fitScale : zoom;
  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? ZOOMS.find((z) => z > scale + 0.01) : [...ZOOMS].reverse().find((z) => z < scale - 0.01);
    if (next) setZoom(next);
  };
  const pages = layout?.pages.length ?? 0;
  const deviceWidth = DEVICES.find((d) => d.id === device)?.width ?? null;
  const name = resume.basics.name;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Toggle
            label="Preview mode"
            value={mode}
            onChange={setMode}
            options={[
              { id: 'page', label: 'Page view (PDF layout)', icon: FileTextIcon, text: 'Page' },
              { id: 'web', label: 'Web view (responsive)', icon: GlobeIcon, text: 'Web' },
            ]}
          />
          <div className="hidden min-w-0 items-center gap-2 text-[12.5px] text-muted sm:flex" aria-live="polite">
            {error ? (
              <span className="inline-flex items-center gap-1.5 truncate text-danger">
                <CircleAlertIcon size={14} /> {error}
              </span>
            ) : !layout ? (
              <span className="inline-flex items-center gap-1.5">
                <LoaderCircleIcon size={14} className="animate-spin" /> Preparing…
              </span>
            ) : mode === 'page' ? (
              <>
                <span className="font-medium text-fg">
                  {pages} page{pages === 1 ? '' : 's'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{layout.pages[0]!.width < 600 ? 'A4' : 'US Letter'}</span>
                {loading && <LoaderCircleIcon size={13} className="animate-spin" aria-label="Updating" />}
              </>
            ) : (
              <span className="truncate">Reflows on any screen</span>
            )}
          </div>
        </div>
        {mode === 'page' ? (
          <div className="flex items-center gap-0.5">
            <IconButton size="sm" label="Zoom out" onClick={() => step(-1)} disabled={scale <= ZOOMS[0]! + 0.01}>
              <ZoomOutIcon size={15} />
            </IconButton>
            <button
              type="button"
              onClick={() => setZoom('fit')}
              title="Fit to width"
              className="h-7 min-w-14 rounded-md px-1.5 text-[12.5px] text-muted tabular-nums hover:bg-surface-2 hover:text-fg"
            >
              {zoom === 'fit' ? 'Fit' : `${Math.round(scale * 100)}%`}
            </button>
            <IconButton size="sm" label="Zoom in" onClick={() => step(1)} disabled={scale >= ZOOMS[ZOOMS.length - 1]! - 0.01}>
              <ZoomInIcon size={15} />
            </IconButton>
          </div>
        ) : (
          <div className="max-sm:hidden">
            <Toggle label="Device width" value={device} onChange={setDevice} options={DEVICES.map((d) => ({ id: d.id, label: d.label, icon: d.icon }))} />
          </div>
        )}
      </div>

      {mode === 'page' ? (
        <div ref={scroller} className="min-h-0 flex-1 overflow-auto bg-canvas" tabIndex={0} aria-label="Résumé preview">
          <div className="flex min-w-fit flex-col items-center gap-6 px-6 py-6 max-lg:pb-24">
            {layout?.pages.map((p, i) => (
              <div key={i} className="relative shrink-0 rounded-[2px] shadow-paper" style={{ width: p.width * PT_TO_PX * scale }}>
                <PageSvg page={p} label={`${name || 'Résumé'} — page ${i + 1} of ${pages}`} />
                {pages > 1 && <span className="absolute top-full right-0 mt-1 text-[11.5px] text-subtle">Page {i + 1}</span>}
              </div>
            ))}
            {!layout && <div className="aspect-[595/842] w-full max-w-[640px] animate-pulse rounded-[2px] bg-surface/60" />}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-canvas max-lg:pb-[72px] sm:p-4">
          <iframe
            title="Web résumé preview"
            srcDoc={html}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className={cn('h-full min-h-[60vh] w-full bg-white', deviceWidth !== null && 'sm:rounded-[18px] sm:border-[6px] sm:border-fg/85 sm:shadow-paper')}
            style={{ maxWidth: deviceWidth ? deviceWidth + 12 : undefined }}
          />
        </div>
      )}
    </div>
  );
}
