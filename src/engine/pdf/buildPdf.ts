/** Vector PDF from layout ops: real text (Identity-H + ToUnicode), embedded subset fonts, link annotations. */
import type { jsPDF as JsPDF } from 'jspdf';
import type { Resume } from '../../domain/schema';
import type { FontSet } from '../fonts/loader';
import { ICON_STROKE, ICONS, parsePath, roundedRectPath, type PathCommand } from '../icons';
import { toBase64 } from '../fonts/loader';
import type { IconOp, LayoutResult } from '../types';

export interface PdfMeta {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

export function pdfMeta(resume: Resume): PdfMeta {
  const name = resume.basics.name.trim() || 'Résumé';
  const keywords = resume.sections
    .filter((s) => s.visible && s.kind === 'skills')
    .flatMap((s) => (s.kind === 'skills' ? s.items.filter((i) => i.visible).map((i) => i.keywords) : []))
    .join(', ')
    .slice(0, 500);
  return { title: `${name} – Résumé`, author: name, subject: resume.basics.headline.trim(), keywords };
}

/** Strokes an icon as vector paths, then restores the default line style used by rules. */
function drawIcon(doc: JsPDF, op: IconOp): void {
  if (op.src) {
    try {
      doc.addImage(op.src, 'PNG', op.x, op.y, op.size, op.size);
      return;
    } catch {
      /* unreadable image: fall back to the glyph */
    }
  }
  const k = op.size / 24;
  const at = (cmds: PathCommand[]) => cmds.map((c) => ({ op: c.op, c: c.c.map((v, i) => (i % 2 ? op.y : op.x) + v * k) }));
  doc.setDrawColor(op.color);
  doc.setLineWidth(ICON_STROKE * k);
  doc.setLineCap('round');
  doc.setLineJoin('round');
  for (const s of ICONS[op.icon].shapes) {
    if ('circle' in s) doc.circle(op.x + s.circle[0] * k, op.y + s.circle[1] * k, s.circle[2] * k, 'S');
    else {
      doc.path(at('d' in s ? parsePath(s.d) : roundedRectPath(...s.rect)));
      doc.stroke();
    }
  }
  doc.setLineCap('butt');
  doc.setLineJoin('miter');
}

export function renderPdf(JsPDFCtor: typeof JsPDF, layout: LayoutResult, fonts: FontSet, meta: PdfMeta): JsPDF {
  const first = layout.pages[0]!;
  const doc = new JsPDFCtor({ unit: 'pt', format: [first.width, first.height], compress: true, putOnlyUsedFonts: true });

  for (const face of layout.facesUsed) {
    const f = fonts.get(face);
    if (!f) throw new Error(`Font ${face} is not loaded`);
    doc.addFileToVFS(`${face}.ttf`, toBase64(f.bytes));
    doc.addFont(`${face}.ttf`, face, 'normal');
  }

  layout.pages.forEach((page, index) => {
    if (index) doc.addPage([page.width, page.height]);
    for (const op of page.ops) {
      if (op.type === 'text') {
        doc.setFont(op.face, 'normal');
        doc.setFontSize(op.size);
        doc.setTextColor(op.color);
        doc.text(op.text, op.x, op.y, { charSpace: op.cs || 0, baseline: 'alphabetic' });
      } else if (op.type === 'rect') {
        doc.setFillColor(op.color);
        doc.rect(op.x, op.y, op.w, op.h, 'F');
      } else if (op.type === 'line') {
        doc.setDrawColor(op.color);
        doc.setLineWidth(op.width);
        doc.line(op.x1, op.y1, op.x2, op.y2);
      } else if (op.type === 'circle') {
        doc.setFillColor(op.color);
        doc.circle(op.cx, op.cy, op.r, 'F');
      } else if (op.type === 'icon') {
        drawIcon(doc, op);
      } else {
        doc.link(op.x, op.y, op.w, op.h, { url: op.url });
      }
    }
  });

  doc.setProperties({ ...meta, creator: 'Resume Creator' });
  try {
    doc.setLanguage('en-US');
  } catch {
    /* older jsPDF builds */
  }
  return doc;
}

/** Browser entry point: loads jsPDF on demand so it stays out of the main bundle. */
export async function buildPdfBlob(resume: Resume, layout: LayoutResult, fonts: FontSet): Promise<Blob> {
  const mod: { jsPDF?: typeof JsPDF; default?: typeof JsPDF | { jsPDF?: typeof JsPDF } } = await import('jspdf');
  // ESM build exposes a named export; CJS/UMD interop may only provide `default`.
  const Ctor = mod.jsPDF ?? (typeof mod.default === 'function' ? mod.default : mod.default?.jsPDF);
  if (!Ctor) throw new Error('PDF library failed to load.');
  return renderPdf(Ctor, layout, fonts, pdfMeta(resume)).output('blob');
}
