import { jsPDF } from 'jspdf';
import { beforeAll, describe, expect, it } from 'vitest';
import { detectLink, linkIcon, linkText } from '../../src/domain/links';
import { checkResume } from '../../src/domain/checks';
import { coerceResume } from '../../src/domain/migrate';
import { createSampleResume } from '../../src/domain/sample';
import { LINK_ICONS, ResumeSchema, type LinkStyle, type Resume } from '../../src/domain/schema';
import { layoutResume, loadFontsFor, TEMPLATE_LIST } from '../../src/engine';
import { buildDocxParts } from '../../src/engine/docx/buildDocx';
import type { FontSet } from '../../src/engine/fonts/loader';
import { buildResumeHtml } from '../../src/engine/html/buildHtml';
import { ICONS, parsePath } from '../../src/engine/icons';
import { pdfMeta, renderPdf } from '../../src/engine/pdf/buildPdf';
import { toPlainText as buildPlainText } from '../../src/engine/text/plainText';
import { nodeFontLoader } from './fonts';

let fonts: FontSet;
beforeAll(async () => {
  fonts = await loadFontsFor(createSampleResume(), nodeFontLoader);
});

const styled = (style: LinkStyle): Resume => {
  const r = createSampleResume();
  r.design.linkStyle = style;
  return r;
};
const ops = (r: Resume) => layoutResume(r, fonts).pages[0]!.ops;
const texts = (r: Resume) =>
  ops(r)
    .flatMap((o) => (o.type === 'text' ? [o.text] : []))
    .join(' ');
/** Text pieces of the contact line only (labels may follow a non-breaking space after an icon). */
const contactTexts = (r: Resume) => {
  const o = ops(r);
  const email = o.find((x) => x.type === 'text' && x.text.includes('jordan.ellis@example.com'));
  return o.flatMap((x) => (x.type === 'text' && email?.type === 'text' && Math.abs(x.y - email.y) < 1 ? [x.text.replace(/\u00A0/g, ' ').trim()] : []));
};

describe('link detection', () => {
  it('recognises common profiles, emails and unknown sites', () => {
    expect(detectLink('https://www.linkedin.com/in/me')).toEqual({ name: 'LinkedIn', icon: 'profile' });
    expect(detectLink('github.com/me')).toEqual({ name: 'GitHub', icon: 'repo' });
    expect(detectLink('me@example.com')).toEqual({ name: 'Email', icon: 'mail' });
    expect(detectLink('mailto:me@example.com').icon).toBe('mail');
    expect(detectLink('youtu.be/x').name).toBe('YouTube');
    expect(detectLink('scholar.google.co.in/citations?user=1').icon).toBe('book');
    expect(detectLink('notgithub.com/x').name).toBe('Website');
    expect(detectLink('me.dev', 'Portfolio').icon).toBe('briefcase');
    expect(detectLink('me.dev/blog').icon).toBe('pen');
  });

  it('uses the label, then the site name, then the domain', () => {
    const l = { id: 'l', label: '', url: 'https://github.com/me', icon: 'auto' as const };
    expect(linkText(l, 'url')).toBe('github.com/me');
    expect(linkText(l, 'text')).toBe('GitHub');
    expect(linkText({ ...l, label: 'Code' }, 'icon-text')).toBe('Code');
    expect(linkText({ ...l, url: 'https://www.jane.dev/' }, 'text')).toBe('jane.dev');
    expect(linkIcon({ ...l, icon: 'code' })).toBe('code');
    expect(linkIcon(l)).toBe('repo');
  });
});

describe('icons', () => {
  it('every icon parses and stays inside its 24×24 box', () => {
    for (const id of LINK_ICONS) {
      for (const s of ICONS[id].shapes) {
        const pts =
          'd' in s
            ? parsePath(s.d).flatMap((c) => c.c)
            : 'circle' in s
              ? [s.circle[0] - s.circle[2], s.circle[0] + s.circle[2]]
              : [s.rect[0], s.rect[0] + s.rect[2]];
        for (const v of pts) expect(v >= 0 && v <= 24, `${id}: ${v}`).toBe(true);
      }
    }
  });
});

describe('link styles in the layout', () => {
  it('"url" shows addresses and draws no icons', () => {
    const r = styled('url');
    expect(texts(r)).toContain('github.com/jordan-ellis-example');
    expect(ops(r).some((o) => o.type === 'icon')).toBe(false);
  });

  it('"text" shows labels and keeps the real address as the link target', () => {
    const r = styled('text');
    for (const label of ['LinkedIn', 'GitHub', 'Portfolio']) expect(contactTexts(r)).toContain(label);
    expect(contactTexts(r).join(' ')).not.toContain('github.com');
    expect(ops(r).some((o) => o.type === 'link' && o.url === 'https://github.com/jordan-ellis-example')).toBe(true);
    expect(ops(r).some((o) => o.type === 'icon')).toBe(false);
  });

  it('"icon-text" adds an icon per contact item, each clickable for links', () => {
    for (const t of TEMPLATE_LIST) {
      const r = styled('icon-text');
      r.templateId = t.id;
      const o = ops(r);
      const icons = o.filter((x) => x.type === 'icon');
      // location, phone, email + 3 links
      expect(icons.map((x) => (x.type === 'icon' ? x.icon : ''))).toEqual(['pin', 'phone', 'mail', 'profile', 'repo', 'briefcase']);
      const gh = icons[4]!;
      if (gh.type !== 'icon') throw new Error();
      const hit = o.find((x) => x.type === 'link' && x.url.includes('github') && x.x <= gh.x + 0.01 && x.x + x.w >= gh.x + gh.size - 0.01);
      expect(hit, `${t.id}: GitHub icon is clickable`).toBeTruthy();
    }
  });

  it('"icon" hides link labels but never the email or phone', () => {
    const r = styled('icon');
    const t = contactTexts(r).join(' ');
    expect(t).not.toMatch(/LinkedIn|GitHub|Portfolio/);
    expect(t).toContain('jordan.ellis@example.com');
    expect(t).toContain('+1 (555) 014-2290');
    expect(ops(r).filter((o) => o.type === 'link' && o.url.includes('linkedin'))).toHaveLength(1);
  });

  it('an icon never wraps away from its label', () => {
    const r = styled('icon-text');
    r.basics.links = Array.from({ length: 10 }, (_, i) => ({ id: `l${i}`, label: `Profile number ${i}`, url: `site${i}.example.com`, icon: 'auto' as const }));
    const o = ops(r);
    for (const icon of o.filter((x) => x.type === 'icon')) {
      if (icon.type !== 'icon') continue;
      const next = o.find((x) => x.type === 'text' && Math.abs(x.y - (icon.y + icon.size / 2 + 9.5 * 0.355)) < 2 && x.x > icon.x && x.x - icon.x < 15);
      expect(next, `label next to icon at ${icon.x},${icon.y}`).toBeTruthy();
    }
  });
});

describe('link styles in exports', () => {
  it('PDF strokes icons as vectors and keeps every link annotation', () => {
    const r = styled('icon-text');
    const pdf = Buffer.from(renderPdf(jsPDF, layoutResume(r, fonts), fonts, pdfMeta(r)).output('arraybuffer')).toString('latin1');
    for (const u of ['https://linkedin.com/in/jordan-ellis-example', 'https://github.com/jordan-ellis-example', 'https://jordanellis.example.com/'])
      expect(pdf).toContain(`/URI (${u})`);
    expect(pdf).toContain('/URI (mailto:jordan.ellis@example.com)');
  });

  it('Word shows labels as hyperlinks; plain text keeps the full address', () => {
    const r = styled('icon');
    const doc = buildDocxParts(r)['word/document.xml']!;
    expect(doc).toMatch(/<w:hyperlink[^>]*>.*?GitHub/);
    expect(buildDocxParts(r)['word/_rels/document.xml.rels']).toContain('Target="https://github.com/jordan-ellis-example"');
    expect(buildPlainText(r)).toContain('GitHub: github.com/jordan-ellis-example');
    expect(buildPlainText(styled('url'))).not.toContain('GitHub:');
  });

  it('web résumé uses decorative icons and names icon-only links', () => {
    const html = buildResumeHtml(styled('icon'));
    expect(html).toContain('aria-label="GitHub" title="GitHub"');
    expect(html).toMatch(/<svg class="cv-icon"[^>]*aria-hidden="true"/);
    expect(buildResumeHtml(styled('url'))).not.toContain('<svg class="cv-icon"');
  });
});

describe('data model', () => {
  it('older documents keep full addresses; bad icons fall back to auto', () => {
    const r = createSampleResume() as unknown as { design: Record<string, unknown>; basics: { links: Record<string, unknown>[] } };
    delete r.design.linkStyle;
    r.basics.links[0]!.icon = 'rocket';
    delete r.basics.links[1]!.icon;
    const out = ResumeSchema.parse(coerceResume(r));
    expect(out.design.linkStyle).toBe('url');
    expect(out.basics.links.map((l) => l.icon)).toEqual(['auto', 'auto', 'auto']);
    expect(createSampleResume().design.linkStyle).toBe('icon-text');
  });

  it('health check explains what hidden addresses mean for ATS', () => {
    const ids = (s: LinkStyle) => checkResume(styled(s)).map((i) => i.id);
    expect(ids('url')).not.toContain('links-hidden');
    expect(ids('text')).toContain('links-hidden');
    expect(checkResume(styled('icon')).find((i) => i.id === 'links-hidden')?.severity).toBe('warning');
  });
});
