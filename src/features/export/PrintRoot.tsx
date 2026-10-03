import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { LayoutResult } from '../../engine';
import { PageSvg } from '../preview/PageSvg';

/**
 * Renders pages at exact paper size into #print-root and opens the print
 * dialog. The app UI is hidden by the print stylesheet.
 */
export function PrintRoot({ layout, title, onDone }: { layout: LayoutResult; title: string; onDone: () => void }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const done = () => {
      document.title = previousTitle;
      onDone();
    };
    window.addEventListener('afterprint', done, { once: true });
    // Let the portal paint (and fonts settle) before printing.
    const t = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener('afterprint', done);
      document.title = previousTitle;
    };
  }, [title, onDone]);

  const first = layout.pages[0];
  if (!first) return null;
  return createPortal(
    <div id="print-root">
      <style>{`@page { size: ${first.width}pt ${first.height}pt; margin: 0; }`}</style>
      {layout.pages.map((p, i) => (
        <PageSvg key={i} page={p} width={`${p.width}pt`} label={`Page ${i + 1}`} interactiveLinks />
      ))}
    </div>,
    document.body,
  );
}
