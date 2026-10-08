import { describe, expect, it } from 'vitest';
import { createSampleResume } from '../../src/domain/sample';
import { TEMPLATE_LIST } from '../../src/engine';
import { buildResumeHtml, contrast, readable } from '../../src/engine/html/buildHtml';

describe('responsive web résumé', () => {
  it('is semantic, responsive and lists every visible section', () => {
    const html = buildResumeHtml(createSampleResume());
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain('<html lang="en">');
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html.match(/<h2 id=/g)).toHaveLength(6);
    expect(html).toContain('<ul class="cv-bullets">');
    expect(html).toContain('<time datetime="2021-03">Mar 2021</time> – Present');
    expect(html).toContain('<strong>42%</strong>');
    expect(html).toMatch(/@media \(max-width:30rem\)/);
  });

  it('escapes user content and never emits executable script or unsafe links', () => {
    const r = createSampleResume();
    r.basics.name = '<img src=x onerror=alert(1)>';
    r.basics.links.push({ id: 'x', label: 'x', url: 'javascript:alert(1)', icon: 'auto' });
    r.basics.headline = '</script><script>alert(1)</script>';
    const html = buildResumeHtml(r);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('href="javascript:');
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain('<script type="application/ld+json">');
    const ld = html.slice(html.indexOf('ld+json">') + 9, html.indexOf('</script>'));
    expect(ld).not.toContain('</');
    expect(JSON.parse(ld)).toMatchObject({ '@type': 'Person', jobTitle: '</script><script>alert(1)</script>' });
  });

  it('omits hidden sections and renders all eight templates', () => {
    const r = createSampleResume();
    r.sections.find((s) => s.kind === 'projects')!.visible = false;
    for (const t of TEMPLATE_LIST) {
      const html = buildResumeHtml({ ...r, templateId: t.id });
      expect(html).toContain(`class="cv cv--${t.id}"`);
      expect(html).not.toContain('Ledgerline');
    }
  });

  it('keeps sandboxed previews script-free while exports include structured data', () => {
    const resume = createSampleResume();
    const preview = buildResumeHtml(resume, { structuredData: false });
    expect(preview).not.toContain('<script');
    expect(preview).toContain('<h1>Jordan Ellis</h1>');
    expect(buildResumeHtml(resume)).toContain('<script type="application/ld+json">');
  });

  it('keeps accent-coloured text at WCAG AA contrast even for light custom colours', () => {
    for (const c of ['#ffd400', '#7dd3fc', '#d9622b', '#5b4bdb']) expect(contrast(readable(c), '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
});
