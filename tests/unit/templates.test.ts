import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseImportText } from '../../src/domain/migrate';
import { createSampleResume } from '../../src/domain/sample';
import type { Resume } from '../../src/domain/schema';
import { layoutResume, loadFontsFor, TEMPLATE_LIST, TEMPLATES } from '../../src/engine';
import { buildDocxParts } from '../../src/engine/docx/buildDocx';
import { nodeFontLoader } from './fonts';

// Golden hashes were recorded with full-address links; pin that so they keep testing the templates alone.
const fix = (r: Resume): Resume => ({ ...r, id: 'r', createdAt: 'x', updatedAt: 'x', design: { ...r.design, linkStyle: 'url' } });
const golden: Record<string, string> = JSON.parse(readFileSync('tests/unit/template-golden.json', 'utf8'));
let mohit: Resume;

beforeAll(() => {
  const res = parseImportText(readFileSync('public/samples/mohit-kumar.json', 'utf8'));
  if (!res.ok) throw new Error(res.error);
  mohit = fix(res.resumes[0]!);
});

describe('template catalogue', () => {
  it('keeps the original four templates byte-identical (layout + Word)', async () => {
    for (const [label, base] of [
      ['sample', fix(createSampleResume())],
      ['mohit', mohit],
    ] as const) {
      for (const t of ['modern', 'classic', 'signature', 'compact'] as const) {
        const r = { ...base, templateId: t };
        const l = layoutResume(r, await loadFontsFor(r, nodeFontLoader));
        expect(createHash('sha1').update(JSON.stringify(l.pages)).digest('hex')).toBe(golden[`${label}-${t}`]);
        const docx = buildDocxParts(r)['word/document.xml']!.replace(/rIdL\d+/g, '');
        expect(createHash('sha1').update(docx).digest('hex')).toBe(golden[`${label}-${t}-docx`]);
      }
    }
  });

  it('offers eight templates with unique ids and readable body text (>= 9pt)', () => {
    expect(TEMPLATE_LIST).toHaveLength(8);
    expect(new Set(TEMPLATE_LIST.map((t) => t.id)).size).toBe(8);
    for (const id of ['timeline', 'editorial', 'rail', 'executive'] as const) expect(TEMPLATES[id].text.size).toBeGreaterThanOrEqual(9.6);
  });

  it('timeline puts each date in the gutter before its title (single reading order)', async () => {
    const r = { ...createSampleResume(), templateId: 'timeline' as const };
    const l = layoutResume(r, await loadFontsFor(r, nodeFontLoader));
    const ops = l.pages[0]!.ops;
    const i = ops.findIndex((o) => o.type === 'text' && o.text === 'Mar 2021 – Present');
    const title = ops.findIndex((o) => o.type === 'text' && o.text.startsWith('Senior Software Engineer') && o.x > 100);
    expect(i).toBeGreaterThan(-1);
    expect(title).toBeGreaterThan(i);
    const [d, t] = [ops[i]!, ops[title]!];
    if (d.type !== 'text' || t.type !== 'text') throw new Error('fixture');
    expect(d.y).toBeCloseTo(t.y, 3);
    expect(d.x).toBeLessThan(t.x);
    expect(ops.some((o) => o.type === 'circle')).toBe(true);
  });

  it('executive band and rail edge bleed from the page edge without covering text', async () => {
    for (const id of ['executive', 'rail'] as const) {
      const r = { ...createSampleResume(), templateId: id };
      const p = layoutResume(r, await loadFontsFor(r, nodeFontLoader)).pages[0]!;
      const first = p.ops[0]!;
      expect(first.type === 'rect' && first.x === 0 && first.y === 0).toBe(true);
      // Decorations are drawn before any text, so text always paints on top.
      const firstText = p.ops.findIndex((o) => o.type === 'text');
      expect(p.ops.slice(firstText).some((o) => o.type === 'rect' && o.x === 0)).toBe(false);
    }
  });
});
