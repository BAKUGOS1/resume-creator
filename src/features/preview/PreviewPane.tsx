import { useEffect, useRef, useState } from 'react';
import { IconButton } from '../../components/ui/Button';
import { CircleAlertIcon, LoaderCircleIcon, ZoomInIcon, ZoomOutIcon } from '../../components/ui/icons';
import type { LayoutResult } from '../../engine';
import { PageSvg } from './PageSvg';

const ZOOMS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
const PT_TO_PX = 96 / 72;

export function PreviewPane({ layout, loading, error, name }: { layout: LayoutResult | null; loading: boolean; error: string | null; name: string }) {
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [available, setAvailable] = useState(800);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setAvailable(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const page = layout?.pages[0];
  const natural = (page?.width ?? 595) * PT_TO_PX;
  const fitScale = Math.min(1.25, Math.max(0.3, (available - 48) / natural));
  const scale = zoom === 'fit' ? fitScale : zoom;
  const step = (dir: 1 | -1) => {
    const cur = scale;
    const next = dir > 0 ? ZOOMS.find((z) => z > cur + 0.01) : [...ZOOMS].reverse().find((z) => z < cur - 0.01);
    if (next) setZoom(next);
  };
  const pages = layout?.pages.length ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3">
        <div className="flex items-center gap-2 text-[12.5px] text-muted" aria-live="polite">
          {error ? (
            <span className="inline-flex items-center gap-1.5 text-danger">
              <CircleAlertIcon size={14} /> {error}
            </span>
          ) : !layout ? (
            <span className="inline-flex items-center gap-1.5">
              <LoaderCircleIcon size={14} className="animate-spin" /> Preparing preview…
            </span>
          ) : (
            <>
              <span className="font-medium text-fg">
                {pages} page{pages === 1 ? '' : 's'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{layout.pages[0]!.width < 600 ? 'A4' : 'US Letter'}</span>
              {loading && <LoaderCircleIcon size={13} className="animate-spin" aria-label="Updating" />}
            </>
          )}
        </div>
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
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto bg-canvas" tabIndex={0} aria-label="Résumé preview">
        <div className="flex min-w-fit flex-col items-center gap-6 px-6 py-6">
          {layout?.pages.map((p, i) => (
            <div key={i} className="relative shrink-0 rounded-[2px] shadow-paper" style={{ width: p.width * PT_TO_PX * scale }}>
              <PageSvg page={p} label={`${name || 'Résumé'} — page ${i + 1} of ${pages}`} />
              {pages > 1 && <span className="absolute top-full right-0 mt-1 text-[11.5px] text-subtle">Page {i + 1}</span>}
            </div>
          ))}
          {!layout && <div className="aspect-[595/842] w-full max-w-[640px] animate-pulse rounded-[2px] bg-surface/60" />}
        </div>
      </div>
    </div>
  );
}
