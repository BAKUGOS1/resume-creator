/**
 * Public engine API: résumé + fonts → paginated draw ops. The same ops drive
 * the SVG preview, the vector PDF and print, so all three always match.
 */
import type { Resume } from '../domain/schema';
import type { FontLoader, FontSet } from './fonts/loader';
import { withFallbacks, type FaceId } from './fonts/registry';
import { Composer } from './layout/composer';
import { paginate, type PageFrame } from './layout/paginate';
import { cleanText, Measurer } from './layout/text';
import { renderResume } from './templates/render';
import { TEMPLATES } from './templates/specs';
import type { TemplateSpec } from './templates/types';
import { PAGE_SIZES, type DrawOp, type LayoutResult, type TextOp } from './types';

export { TEMPLATES, TEMPLATE_LIST } from './templates/specs';
export type { TemplateSpec } from './templates/types';
export * from './types';

const MARGINS = {
  narrow: { x: 32, top: 30, bottom: 32 },
  normal: { x: 44, top: 38, bottom: 38 },
  wide: { x: 58, top: 50, bottom: 48 },
} as const;
const SPACING = { compact: 0.8, normal: 1, relaxed: 1.22 } as const;
/** Smallest type scale fit-to-page may use (keeps body text ≥ ~7.5pt). */
export const MIN_FIT_SCALE = 0.8;

export function templateOf(resume: Resume): TemplateSpec {
  return TEMPLATES[resume.templateId] ?? TEMPLATES.modern;
}

export function accentOf(resume: Resume): string {
  return resume.design.accent ?? templateOf(resume).defaultAccent;
}

export function primaryFaces(spec: TemplateSpec): FaceId[] {
  return [...new Set(Object.values(spec.faces))];
}

/** All user-visible text, used to decide which fallback fonts are needed. */
export function resumeText(resume: Resume): string {
  const parts: string[] = [];
  const collect = (value: unknown, key = ''): void => {
    if (typeof value === 'string') {
      if (key !== 'id' && key !== 'kind') parts.push(value);
    } else if (Array.isArray(value)) value.forEach((v) => collect(v));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => collect(v, k));
  };
  collect(resume.basics);
  collect(resume.sections);
  return parts.join(' ');
}

/** Loads the template's faces, plus fallback faces only when the text needs them. */
export async function loadFontsFor(resume: Resume, loader: FontLoader): Promise<FontSet> {
  const spec = templateOf(resume);
  const primary = primaryFaces(spec);
  const fonts = await loader.loadAll(primary);
  const text = cleanText(resumeText(resume)).toUpperCase() + cleanText(resumeText(resume));
  const needsFallback = [...new Set(text)].some((ch) => {
    const cp = ch.codePointAt(0)!;
    return cp > 0x20 && primary.some((f) => !fonts.get(f)!.metrics.has(cp));
  });
  if (!needsFallback) return fonts;
  return loader.loadAll(withFallbacks(primary));
}

function layoutAt(resume: Resume, fonts: FontSet, scale: number) {
  const spec = templateOf(resume);
  const size = PAGE_SIZES[resume.design.pageSize];
  const margin = MARGINS[resume.design.margins];
  const m = new Measurer(fonts);
  const c = new Composer(m, margin.x, size.width - margin.x * 2);
  renderResume(resume, spec, c, {
    scale,
    spacing: SPACING[resume.design.spacing],
    dateFormat: resume.design.dateFormat,
    accent: accentOf(resume),
  });
  const frame: PageFrame = { ...size, top: margin.top, bottom: margin.bottom };
  return { pages: paginate(c.blocks, frame), measurer: m, spec, margin };
}

export function layoutResume(resume: Resume, fonts: FontSet): LayoutResult {
  const base = resume.design.fontScale;
  let result = layoutAt(resume, fonts, base);
  let scale = base;
  let fitted = true;

  if (resume.design.fitToPage && result.pages.length > 1) {
    const min = Math.min(MIN_FIT_SCALE, base);
    const smallest = layoutAt(resume, fonts, min);
    if (smallest.pages.length > 1) {
      fitted = false;
    } else {
      let lo = min;
      let hi = base;
      let best = smallest;
      for (let i = 0; i < 9; i++) {
        const mid = (lo + hi) / 2;
        const r = layoutAt(resume, fonts, mid);
        if (r.pages.length === 1) {
          lo = mid;
          best = r;
        } else hi = mid;
      }
      result = best;
      scale = Math.floor(lo * 1000) / 1000;
    }
  }

  const { pages, measurer, spec, margin } = result;
  if (pages.length > 1) addFooters(pages, resume, spec, margin.bottom, measurer);

  const facesUsed = new Set<FaceId>();
  pages.forEach((p) => p.ops.forEach((op) => op.type === 'text' && facesUsed.add(op.face)));
  return { pages, scale, fitted, missingGlyphs: [...measurer.missing], facesUsed: [...facesUsed] };
}

function addFooters(pages: { width: number; height: number; ops: DrawOp[] }[], resume: Resume, spec: TemplateSpec, bottom: number, m: Measurer) {
  const name = resume.basics.name.trim();
  const style = { face: spec.faces.body, size: 7, color: spec.palette(accentOf(resume)).faint, cs: 0 };
  pages.forEach((page, i) => {
    const text = `${name ? `${name}  ·  ` : ''}Page ${i + 1} of ${pages.length}`;
    const segments = m.segments(text, style.face);
    let x = (page.width - segments.reduce((w, s) => w + m.faceWidth(s.text, s.face, style.size), 0)) / 2;
    const y = page.height - Math.max(12, bottom / 2 - 2);
    for (const seg of segments) {
      const op: TextOp = { type: 'text', text: seg.text, x, y, face: seg.face, size: style.size, color: style.color, cs: 0 };
      page.ops.push(op);
      x += m.faceWidth(seg.text, seg.face, style.size);
    }
  });
}
