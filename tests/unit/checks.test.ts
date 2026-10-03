import { describe, expect, it } from 'vitest';
import { checkResume, fieldId, scoreIssues } from '../../src/domain/checks';
import { createBlankResume } from '../../src/domain/defaults';
import { createSampleResume } from '../../src/domain/sample';

describe('résumé checks', () => {
  it('finds nothing blocking in the sample', () => {
    const issues = checkResume(createSampleResume(), { pageCount: 1, missingGlyphs: [] });
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    expect(scoreIssues(issues)).toBeGreaterThan(85);
  });

  it('flags missing essentials on a blank résumé', () => {
    const ids = checkResume(createBlankResume()).map((i) => i.id);
    expect(ids).toContain('name');
    expect(ids).toContain('email');
    expect(ids).toContain('experience');
  });

  it('reports format errors inline with a focusable field id', () => {
    const r = createSampleResume();
    r.basics.email = 'nope';
    const issue = checkResume(r).find((i) => i.id === 'email-invalid');
    expect(issue).toMatchObject({ severity: 'error', inline: true, field: fieldId('basics', 'email') });
  });

  it('flags inverted dates, bad links and unrenderable characters', () => {
    const r = createSampleResume();
    const exp = r.sections.find((s) => s.kind === 'experience');
    if (exp?.kind !== 'experience') throw new Error('fixture');
    Object.assign(exp.items[1]!, { start: '2021-01', end: '2019-01' });
    r.basics.links[0]!.url = 'javascript:alert(1)';
    const issues = checkResume(r, { pageCount: 3, missingGlyphs: ['中'] });
    const ids = issues.map((i) => i.id);
    expect(ids).toContain(`dates-${exp.items[1]!.id}`);
    expect(ids).toContain(`link-${r.basics.links[0]!.id}`);
    expect(ids).toContain('glyphs');
    expect(ids).toContain('pages');
    expect(issues[0]!.severity).toBe('error');
  });

  it('ignores hidden sections and items', () => {
    const r = createSampleResume();
    r.sections.forEach((s) => (s.visible = false));
    expect(checkResume(r).map((i) => i.id)).toContain('experience');
  });
});
