import { describe, expect, it } from 'vitest';
import { createBlankResume } from '../../src/domain/defaults';
import { importDocument, parseImportText, parseResume, toBackup, toExport } from '../../src/domain/migrate';
import { createSampleResume } from '../../src/domain/sample';
import { LIMITS, ResumeSchema } from '../../src/domain/schema';

const legacyDrawer = {
  name: 'Mohit Kumar',
  title: 'Full-Stack Product Engineer',
  contact: [
    [{ t: 'Ahmedabad, India' }, { t: '+91 91730 86652' }, { t: 'me@example.com', u: 'mailto:me@example.com' }],
    [{ t: 'github.com/BAKUGOS1', u: 'https://github.com/BAKUGOS1' }],
  ],
  summary: 'Builder.',
  experience: [{ role: 'Engineer', org: 'Zybra', date: 'Nov 2025 – Present', bullets: ['Shipped things.'] }],
  projects: [{ name: 'Phere', url: 'https://app.wrkly.in', desc: 'Wedding app', date: 'May 2026 – Present', stack: 'React', bullets: ['Built it.'] }],
  also: [{ name: 'BeforeCode', url: 'https://github.com/BAKUGOS1/beforecode', desc: 'npm CLI' }],
  skills: [['Languages', 'TypeScript, Go']],
  education: [{ deg: 'BCA', org: 'Monark University', date: '2022' }],
};

describe('import & migration', () => {
  it('accepts the sample and blank résumés', () => {
    expect(ResumeSchema.safeParse(createSampleResume()).success).toBe(true);
    expect(ResumeSchema.safeParse(createBlankResume()).success).toBe(true);
  });

  it('round-trips exports and backups', () => {
    const r = createSampleResume();
    const single = importDocument(JSON.parse(JSON.stringify(toExport(r))));
    expect(single.ok && single.resumes[0]).toEqual(r);
    const backup = importDocument(JSON.parse(JSON.stringify(toBackup([r, createBlankResume()]))));
    expect(backup.ok && backup.resumes.length).toBe(2);
  });

  it('converts the original app format', () => {
    const res = importDocument(legacyDrawer);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const r = res.resumes[0]!;
    expect(res.source).toBe('legacy');
    expect(r.basics).toMatchObject({
      name: 'Mohit Kumar',
      headline: 'Full-Stack Product Engineer',
      location: 'Ahmedabad, India',
      phone: '+91 91730 86652',
      email: 'me@example.com',
    });
    expect(r.basics.links[0]).toMatchObject({ label: 'GitHub', url: 'github.com/BAKUGOS1' });
    const exp = r.sections.find((s) => s.kind === 'experience');
    expect(exp?.kind === 'experience' && exp.items[0]).toMatchObject({ role: 'Engineer', organization: 'Zybra', start: '2025-11', current: true });
    const also = r.sections.find((s) => s.kind === 'custom');
    expect(also?.kind === 'custom' && also.layout).toBe('compact');
    const edu = r.sections.find((s) => s.kind === 'education');
    expect(edu?.kind === 'education' && edu.items[0]).toMatchObject({ degree: 'BCA', start: '', end: '2022' });
  });

  it('title-cases ALL-CAPS legacy names', () => {
    const res = importDocument({ ...legacyDrawer, name: 'MOHIT KUMAR' });
    expect(res.ok && res.resumes[0]!.basics.name).toBe('Mohit Kumar');
  });

  it('repairs partial v2 documents with defaults', () => {
    const res = parseResume({
      schemaVersion: 2,
      basics: { name: 'Ana' },
      sections: [{ kind: 'skills', items: [{ label: 'X', keywords: 'y' }] }, { kind: 'bogus' }],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.resume.basics.name).toBe('Ana');
    expect(res.resume.sections).toHaveLength(1);
    expect(res.resume.design.pageSize).toBe('a4');
  });

  it('rejects invalid, hostile and oversized input', () => {
    expect(parseImportText('not json').ok).toBe(false);
    expect(parseImportText('[]').ok).toBe(false);
    expect(parseImportText('{"hello":1}').ok).toBe(false);
    expect(parseImportText(JSON.stringify({ schemaVersion: 99 })).ok).toBe(false);
    expect(parseImportText('x'.repeat(LIMITS.importBytes + 1)).ok).toBe(false);
    const res = parseResume({ schemaVersion: 2, __proto__: { polluted: true }, basics: { name: 'A'.repeat(10_000) }, sections: [] });
    expect(res.ok && res.resume.basics.name.length).toBe(LIMITS.shortText);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('regenerates duplicate ids so edits target the right entry', () => {
    const res = parseResume({
      schemaVersion: 2,
      sections: [
        { id: 's', kind: 'skills', items: [{ id: 'x', label: 'A' }, { id: 'x', label: 'B' }] },
        { id: 's', kind: 'experience', items: [{ id: 'x', role: 'R', bullets: [{ id: 'x', text: 'a' }, { id: 'x', text: 'b' }] }] },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const ids: string[] = [];
    res.resume.sections.forEach((s) => {
      ids.push(s.id);
      if (s.kind !== 'summary') s.items.forEach((i) => (ids.push(i.id), 'bullets' in i && i.bullets.forEach((b) => ids.push(b.id))));
    });
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never throws on hostile structures', () => {
    for (const kind of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      const res = importDocument({ schemaVersion: 2, sections: [{ kind, items: [{}] }] });
      expect(res.ok && res.resumes[0]!.sections).toHaveLength(0);
    }
    expect(importDocument({ name: 'X', experience: [{ bullets: [null, 5, {}] }], contact: 'nope' }).ok).toBe(true);
  });

  it('drops invalid dates instead of trusting them', () => {
    const r = createSampleResume();
    const raw = JSON.parse(JSON.stringify(r));
    raw.sections[1].items[0].start = '13/2020';
    expect(parseResume(raw).ok).toBe(false);
  });
});
