/**
 * Computes the paginated layout for a résumé. Fonts load asynchronously; the
 * layout itself is synchronous and fast (a few ms), so it re-runs on every
 * change while keeping the previous result on screen until fonts are ready.
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { Resume } from '../../domain/schema';
import { layoutResume, loadFontsFor, type LayoutResult } from '../../engine';
import type { FontSet } from '../../engine/fonts/loader';
import { fontLoader, registerFaces } from './fonts';

export interface LayoutState {
  layout: LayoutResult | null;
  fonts: FontSet | null;
  error: string | null;
  loading: boolean;
}

/** Key that changes only when the set of required fonts may change. */
const fontKey = (r: Resume) => r.templateId;

export function useLayout(resume: Resume | undefined): LayoutState {
  const deferred = useDeferredValue(resume);
  const [fonts, setFonts] = useState<{ key: string; set: FontSet } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fallback fonts depend on the text, so re-check coverage when the text changes.
  const textProbe = deferred ? `${fontKey(deferred)}|${[...new Set(JSON.stringify([deferred.basics, deferred.sections]))].sort().join('')}` : '';

  useEffect(() => {
    if (!deferred) return;
    let cancelled = false;
    loadFontsFor(deferred, fontLoader)
      .then(async (set) => {
        await registerFaces(set);
        if (!cancelled) {
          setFonts({ key: textProbe, set });
          setError(null);
        }
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : 'Fonts failed to load.'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- textProbe captures every input that matters
  }, [textProbe]);

  // Only lay out once fonts match the current text; otherwise characters needing a
  // not-yet-loaded fallback would flash as "?" and exports could miss a font.
  const current = useMemo(() => {
    if (!deferred || !fonts || fonts.key !== textProbe) return null;
    try {
      return { layout: layoutResume(deferred, fonts.set), fonts: fonts.set };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [deferred, fonts, textProbe]);

  // Keep showing the last good layout (paired with its fonts) while new fonts load.
  const last = useRef<{ layout: LayoutResult; fonts: FontSet } | null>(null);
  if (current) last.current = current;
  const shown = current ?? last.current;

  return { layout: shown?.layout ?? null, fonts: shown?.fonts ?? null, error, loading: !current };
}
