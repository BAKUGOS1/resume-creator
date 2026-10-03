import { jsPDF } from 'jspdf';
import { beforeAll, describe, expect, it } from 'vitest';
import { createItem, createBullet } from '../../src/domain/defaults';
import { createSampleResume } from '../../src/domain/sample';
import type { Resume } from '../../src/domain/schema';
import { layoutResume, loadFontsFor, MIN_FIT_SCALE, TEMPLATE_LIST, type LayoutResult } from '../../src/engine';
import type { FontSet } from '../../src/engine/fonts/loader';
import { toBase64 } from '../../src/engine/fonts/loader';
import { breakLines, Measurer, parseInline } from '../../src/engine/layout/text';
import { pdfMeta, renderPdf } from '../../src/engine/pdf/buildPdf';
import { nodeFontLoader } from './fonts';

const texts = (l: LayoutResult, page = 0) =>
  l.pages[page]!.ops.filter((o) => o.type === 'text')
    .map((o) => (o.type === 'text' ? o.text : ''))
    .join(' ');

/** A résumé long enough to need several pages. */
function longResume(): Resume {
  const r = createSampleResume();
  const exp = r.sections.find((s) => s.kind === 'experience');
  if (exp?.kind !== 'experience') throw new Error('fixture');
  for (let i = 0; i < 12; i++) {
    const item = createItem('experience');
    Object.assign(item, { role: `Role ${i}`, organization: `Company ${i}`, start: '2010-01', end: '2011-01' });
    item.bullets = [1, 2, 3, 4].map((n) =>
      createBullet(`Delivered measurable outcome number ${n} for team ${i}, improving reliability and throughput across services.`),
    );
    exp.items.push(item);
  }
  return r;
}

let fonts: FontSet;
beforeAll(async () => {
  fonts = await loadFontsFor(createSampleResume(), nodeFontLoader);
});

describe('text engine', () => {
  it('parses **bold** spans and keeps unbalanced markers literal', () => {
    expect(parseInline('a **b** c')).toEqual([
      { text: 'a ', bold: false },
      { text: 'b', bold: true },
      { text: ' c', bold: false },
    ]);
    expect(parseInline('a ** b')).toEqual([{ text: 'a ** b', bold: false }]);
  });

  it('measures exactly like jsPDF', () => {
    const m = new Measurer(fonts);
    const doc = new jsPDF({ unit: 'pt' });
    const face = 'inter-400';
    doc.addFileToVFS(`${face}.ttf`, toBase64(fonts.get(face)!.bytes));
    doc.addFont(`${face}.ttf`, face, 'normal');
    doc.setFont(face, 'normal');
    for (const s of ['Hello World', 'Résumé — 2026 · €1,200', 'WAVE Tj AV']) {
      expect(m.faceWidth(s, face, 12)).toBeCloseTo(doc.getStringUnitWidth(s) * 12, 4);
    }
  });

  it('breaks lines within the width and hard-breaks very long words', () => {
    const m = new Measurer(fonts);
    const style = { face: 'inter-400' as const, size: 10, color: '#000' };
    const lines = breakLines([{ text: 'word '.repeat(60) + 'https://example.com/' + 'x'.repeat(200), style }], 200, m);
    expect(lines.length).toBeGreaterThan(3);
    for (const l of lines) expect(l.width).toBeLessThanOrEqual(200.01);
  });
});

describe('layout', () => {
  for (const t of TEMPLATE_LIST) {
    it(`renders the sample on one page with the ${t.name} template`, async () => {
      const r = { ...createSampleResume(), templateId: t.id };
      const l = layoutResume(r, await loadFontsFor(r, nodeFontLoader));
      expect(l.pages).toHaveLength(1);
      expect(l.missingGlyphs).toHaveLength(0);
      expect(texts(l)).toContain('Senior Software Engineer');
      for (const op of l.pages[0]!.ops) if (op.type === 'text') expect(op.y).toBeLessThan(l.pages[0]!.height);
    });
  }

  it('paginates long content without orphaned headings and adds page footers', () => {
    const l = layoutResume(longResume(), fonts);
    expect(l.pages.length).toBeGreaterThan(1);
    l.pages.forEach((p, i) => {
      expect(texts(l, i)).toContain(`Page ${i + 1} of ${l.pages.length}`);
      // The last body text on a page must not be a section heading.
      const body = p.ops.filter((o) => o.type === 'text' && !o.text.startsWith('Page ') && !o.text.includes('Page '));
      const last = body[body.length - 1];
      expect(last && last.type === 'text' && ['EXPERIENCE', 'PROJECTS', 'SKILLS', 'EDUCATION'].includes(last.text)).toBe(false);
      for (const op of p.ops) if (op.type === 'text') expect(op.y).toBeLessThanOrEqual(p.height);
    });
  });

  it('does not chain bullet-less entries together (no half-empty pages)', () => {
    const r = createSampleResume();
    const certs = r.sections.find((s) => s.kind === 'certifications');
    if (certs?.kind !== 'certifications') throw new Error('fixture');
    for (let i = 0; i < 40; i++) certs.items.push({ ...createItem('certifications'), name: `Certificate ${i}`, issuer: 'Issuer', date: '2020-01' });
    const l = layoutResume(r, fonts);
    expect(l.pages.length).toBeGreaterThan(1);
    const page = l.pages[0]!;
    const lastBody = Math.max(...page.ops.flatMap((o) => (o.type === 'text' && !o.text.includes('Page ') ? [o.y] : [])));
    expect(lastBody).toBeGreaterThan(page.height * 0.85);
  });

  it('fits to one page by shrinking text, but never below the minimum', () => {
    const r = createSampleResume();
    const exp = r.sections.find((s) => s.kind === 'experience');
    if (exp?.kind !== 'experience') throw new Error('fixture');
    exp.items[0]!.bullets.push(
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) =>
        createBullet(`Additional accomplishment ${n} with enough words to wrap onto a second line in most templates.`),
      ),
    );
    expect(layoutResume(r, fonts).pages.length).toBe(2);
    r.design.fitToPage = true;
    const fitted = layoutResume(r, fonts);
    expect(fitted.pages).toHaveLength(1);
    expect(fitted.fitted).toBe(true);
    expect(fitted.scale).toBeLessThan(1);
    expect(fitted.scale).toBeGreaterThanOrEqual(MIN_FIT_SCALE);

    const huge = longResume();
    huge.design.fitToPage = true;
    const tooBig = layoutResume(huge, fonts);
    expect(tooBig.fitted).toBe(false);
    expect(tooBig.pages.length).toBeGreaterThan(1);
  });

  it('falls back to wider fonts for other scripts and reports unsupported characters', async () => {
    const r = { ...createSampleResume(), templateId: 'signature' as const };
    r.basics.name = 'Ελένη Иванова';
    r.basics.tagline = '中文';
    const f = await loadFontsFor(r, nodeFontLoader);
    const l = layoutResume(r, f);
    const faces = new Set(l.pages[0]!.ops.flatMap((o) => (o.type === 'text' && /[ΕИ]/i.test(o.text) ? [o.face] : [])));
    expect([...faces].some((x) => x.startsWith('jbmono') || x.startsWith('noto'))).toBe(true);
    expect(l.missingGlyphs).toContain('中');
  });

  it('honours page size, hidden sections and hidden items', () => {
    const r = createSampleResume();
    r.design.pageSize = 'letter';
    r.sections.find((s) => s.kind === 'projects')!.visible = false;
    const exp = r.sections.find((s) => s.kind === 'experience');
    if (exp?.kind === 'experience') exp.items[1]!.visible = false;
    const l = layoutResume(r, fonts);
    expect(l.pages[0]!.width).toBe(612);
    expect(texts(l)).not.toContain('Ledgerline');
    expect(texts(l)).not.toContain('Brightline');
  });

  it('only emits safe link targets', () => {
    const r = createSampleResume();
    r.basics.links.push({ id: 'x', label: 'Evil', url: 'javascript:alert(1)' });
    const links = layoutResume(r, fonts).pages[0]!.ops.flatMap((o) => (o.type === 'link' ? [o.url] : []));
    expect(links.length).toBeGreaterThan(3);
    for (const u of links) expect(u).toMatch(/^(https:|mailto:|tel:)/);
  });
});

describe('pdf', () => {
  it('produces a vector PDF with embedded fonts, links and metadata', () => {
    const r = createSampleResume();
    const l = layoutResume(r, fonts);
    const doc = renderPdf(jsPDF, l, fonts, pdfMeta(r));
    const bytes = Buffer.from(doc.output('arraybuffer'));
    const text = bytes.toString('latin1');
    expect(text.startsWith('%PDF-')).toBe(true);
    expect(doc.getNumberOfPages()).toBe(1);
    expect(text).toContain('/URI (https://github.com/jordan-ellis-example)');
    expect(text).toContain('/FontFile2');
    expect(text).toContain('/ToUnicode');
    expect(bytes.length).toBeLessThan(120_000);
  });

  it('matches the layout page count for multi-page résumés', () => {
    const r = longResume();
    const l = layoutResume(r, fonts);
    expect(renderPdf(jsPDF, l, fonts, pdfMeta(r)).getNumberOfPages()).toBe(l.pages.length);
  });
});
