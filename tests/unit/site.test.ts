import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderSite } from '../../site/generate';
import { renderMarkdown } from '../../site/markdown';
import { SITE } from '../../site/config';

let files: Map<string, string>;
const ROOT = process.cwd();

beforeAll(() => {
  files = renderSite({ root: ROOT, assets: { css: '/assets/site.css', js: '/assets/site.js' }, lastmod: '2026-10-03' }).files;
});

const pages = () => [...files].filter(([f]) => f.endsWith('.html') && f !== '404.html');
const urlOf = (file: string) => `/${file.replace(/index\.html$/, '')}`;
const attr = (html: string, re: RegExp) => re.exec(html)?.[1];

describe('markdown renderer', () => {
  it('escapes HTML and drops unsafe links', () => {
    const { html } = renderMarkdown('Hi <script>x</script> [a](javascript:alert(1)) [b](/ok/) [c](https://x.com) `<i>`');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('<a href="/ok/">b</a>');
    expect(html).toContain('<a href="https://x.com" rel="noopener">c</a>');
    expect(html).toContain('<code>&lt;i&gt;</code>');
  });

  it('renders headings with unique ids, lists, tables, quotes and code', () => {
    const r = renderMarkdown('## Step one\n\n## Step one\n\n- **a**\n- *b*\n\n1. x\n2. y\n\n> quote\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n```\n<raw>\n```');
    expect(r.headings.map((h) => h.id)).toEqual(['step-one', 'step-one-2']);
    expect(r.html).toContain('<ul><li><strong>a</strong></li><li><em>b</em></li></ul>');
    expect(r.html).toContain('<ol><li>x</li><li>y</li></ol>');
    expect(r.html).toContain('<blockquote><p>quote</p></blockquote>');
    expect(r.html).toContain('<th scope="col">A</th>');
    expect(r.html).toContain('<pre><code>&lt;raw&gt;</code></pre>');
  });
});

describe('static site SEO', () => {
  it('generates home, templates, guides, 404, sitemap and RSS', () => {
    for (const f of [
      'index.html',
      'about/index.html',
      'templates/index.html',
      'templates/timeline/index.html',
      'blog/index.html',
      'blog/ats-friendly-resume-guide/index.html',
      '404.html',
      'sitemap.xml',
      'blog/rss.xml',
    ])
      expect(files.has(f), f).toBe(true);
  });

  it('gives every page one h1, a self canonical, a unique title and a useful description', () => {
    const titles = new Set<string>();
    for (const [file, html] of pages()) {
      expect(html.match(/<h1[\s>]/g), file).toHaveLength(1);
      expect(attr(html, /<link rel="canonical" href="([^"]+)">/), file).toBe(`${SITE.url}${urlOf(file)}`);
      const title = attr(html, /<title>([^<]+)<\/title>/)!;
      expect(title.length, `${file} title`).toBeLessThanOrEqual(80);
      expect(titles.has(title), `${file} duplicate title`).toBe(false);
      titles.add(title);
      const desc = attr(html, /<meta name="description" content="([^"]+)">/)!;
      expect(desc.length, `${file} description`).toBeGreaterThanOrEqual(70);
      expect(html, file).toContain('<meta property="og:image"');
      expect(html, file).toContain('<html lang="en">');
    }
    expect(files.get('404.html')).toContain('noindex');
  });

  it('emits valid JSON-LD everywhere, with BlogPosting and breadcrumbs on guides', () => {
    for (const [file, html] of pages()) {
      for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) expect(() => JSON.parse(m[1]!), file).not.toThrow();
    }
    const post = files.get('blog/ats-friendly-resume-guide/index.html')!;
    expect(post).toContain('"@type":"BlogPosting"');
    expect(post).toContain('"@type":"BreadcrumbList"');
    expect(post).toContain('"author":{"@type":"Person","name":"Mohit Kumar"');
  });

  it('has no broken internal links', () => {
    const known = new Set([...pages().map(([f]) => urlOf(f)), ...[...files.keys()].map((f) => `/${f}`)]);
    const appRoutes = /^\/(resumes(\?template=[a-z]+)?|resume\/[^/]+)$/;
    for (const [file, html] of pages()) {
      for (const m of html.matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) {
        const href = m[1]!;
        if (appRoutes.test(href) || known.has(href) || href.startsWith('/assets/')) continue;
        expect(existsSync(resolve(ROOT, 'public', `.${href}`)), `${file} → ${href}`).toBe(true);
      }
    }
  });

  it('lists every indexable page in the sitemap', () => {
    const sitemap = files.get('sitemap.xml')!;
    for (const [file] of pages()) expect(sitemap, file).toContain(`<loc>${SITE.url}${urlOf(file)}</loc>`);
    expect(files.get('blog/rss.xml')).toContain('<rss version="2.0"');
  });

  it('uses the same author and publisher identities on guides and the about page', () => {
    for (const [file, html] of pages()) {
      const nodes = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map((match) => JSON.parse(match[1]!))
        .flatMap((data) => data['@graph'] ?? [data]);
      expect(
        nodes.find((node) => node['@id'] === `${SITE.url}/#author`),
        file,
      ).toMatchObject({
        '@type': 'Person',
        name: SITE.author.name,
        url: SITE.author.url,
      });
      expect(
        nodes.find((node) => node['@id'] === `${SITE.url}/#publisher`),
        file,
      ).toMatchObject({ name: SITE.name, sameAs: [SITE.repo] });
      const article = nodes.find((node) => node['@type'] === 'BlogPosting');
      if (article) {
        expect(article.author['@id'], file).toBe(`${SITE.url}/#author`);
        expect(article.publisher['@id'], file).toBe(`${SITE.url}/#publisher`);
      }
    }
    expect(files.get('about/index.html')).toContain('not an employer’s ATS score');
  });

  it('puts a direct answer before the main guide content without guaranteeing outcomes', () => {
    for (const [file, html] of pages().filter(([file]) => /^blog\/.+\/index\.html$/.test(file))) {
      expect(html, file).toMatch(/<h2 id="quick-answer">Quick answer<\/h2>\s*<p>[^<]{80,}<\/p>/);
      expect(html.indexOf('id="quick-answer"'), file).toBeLessThan(html.indexOf('<h2', html.indexOf('id="quick-answer"') + 1));
    }
    expect(files.get('index.html')).not.toContain('ATS-tested');
    expect(files.get('templates/index.html')).toContain('not certified by any ATS vendor');
  });

  it('declares the actual portrait image dimensions on template pages', () => {
    for (const [file, html] of pages().filter(([file]) => /^templates\/.+\/index\.html$/.test(file))) {
      expect(attr(html, /property="og:image:width" content="([^"]+)"/), file).toBe('600');
      expect(attr(html, /property="og:image:height" content="([^"]+)"/), file).toBe('849');
    }
  });

  it('does not refresh sitemap modification dates just because the build date changes', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2030-01-01'));
      const first = renderSite({ root: ROOT, assets: { css: '/assets/site.css', js: '/assets/site.js' } }).files.get('sitemap.xml');
      vi.setSystemTime(new Date('2031-01-01'));
      const second = renderSite({ root: ROOT, assets: { css: '/assets/site.css', js: '/assets/site.js' } }).files.get('sitemap.xml');
      expect(first).toBe(second);
      expect(first).not.toContain('2030-01-01');
    } finally {
      vi.useRealTimers();
    }
  });
});
