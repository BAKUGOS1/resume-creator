/**
 * Static page templates for the public site (home, templates, guides, 404).
 * Output is plain HTML + one stylesheet; the only script is optional enhancement.
 */
import type { TemplateId } from '../src/domain/schema';
import { TEMPLATE_LIST } from '../src/engine/templates/specs';
import { abs, SITE } from './config';
import type { Post } from './content';
import { related } from './content';
import { escapeHtml as e } from './markdown';
import { TEMPLATE_PAGES, TICKER_ORDER } from './templates';

export interface Assets {
  css: string;
  js: string;
}

interface HeadOptions {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  imageAlt?: string;
  jsonLd?: unknown[];
  noindex?: boolean;
  extra?: string;
}

const OG_DEFAULT = '/og-image.png';
const ld = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

export const LOGO = `<svg class="logo" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="1.5" width="17" height="21" rx="2.5" fill="#2340b8"/><rect x="6.5" y="5.2" width="7.5" height="1.9" rx=".95" fill="#fff"/><rect x="5.6" y="9.3" width="12.8" height="3.4" rx="1" fill="#ffd84d"/><rect x="6.5" y="10.1" width="11" height="1.6" rx=".8" fill="#1a2a6b"/><rect x="6.5" y="14.6" width="11" height="1.6" rx=".8" fill="#fff" opacity=".8"/><rect x="6.5" y="18" width="7.5" height="1.6" rx=".8" fill="#fff" opacity=".8"/></svg>`;

function head(o: HeadOptions, a: Assets): string {
  const url = abs(o.path);
  const image = abs(o.image ?? OG_DEFAULT);
  return `<!doctype html>
<html lang="${SITE.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(o.title)}</title>
<meta name="description" content="${e(o.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${o.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
<meta name="theme-color" content="#eef1f5">
<meta name="color-scheme" content="light">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${SITE.name} guides" href="/blog/rss.xml">
<link rel="preload" href="/fonts/gsf-600.ttf" as="font" type="font/ttf" crossorigin>
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:type" content="${o.type ?? 'website'}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${e(o.title)}">
<meta property="og:description" content="${e(o.description)}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(o.imageAlt ?? o.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(o.title)}">
<meta name="twitter:description" content="${e(o.description)}">
<meta name="twitter:image" content="${image}">
${o.extra ?? ''}
${(o.jsonLd ?? []).map(ld).join('\n')}
<link rel="stylesheet" href="${a.css}">
<script type="module" src="${a.js}"></script>
</head>`;
}

const NAV = [
  { href: '/templates/', label: 'Templates' },
  { href: '/blog/', label: 'Guides' },
  { href: '/#faq', label: 'FAQ' },
];

function header(current: string): string {
  const links = NAV.map(
    (n) => `<li><a href="${n.href}"${current.startsWith(n.href) && n.href !== '/#faq' ? ' aria-current="page"' : ''}>${n.label}</a></li>`,
  ).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/">${LOGO}<span>${SITE.name}</span></a>
    <nav class="nav" aria-label="Primary"><ul>${links}</ul></nav>
    <a class="btn btn-primary btn-sm" href="/resumes" data-cta="nav">Open the builder</a>
    <details class="menu">
      <summary aria-label="Menu"><span aria-hidden="true"></span></summary>
      <nav aria-label="Mobile"><ul>${links}<li><a href="/resumes">Open the builder</a></li></ul></nav>
    </details>
  </div>
</header>`;
}

function footer(posts: Post[]): string {
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <a class="brand" href="/">${LOGO}<span>${SITE.name}</span></a>
      <p>A free résumé builder that keeps your data in your browser. No account, no tracking, no watermark.</p>
    </div>
    <nav aria-label="Product"><h2>Product</h2><ul>
      <li><a href="/resumes">Résumé builder</a></li>
      <li><a href="/templates/">Templates</a></li>
      <li><a href="/blog/">Guides</a></li>
    </ul></nav>
    <nav aria-label="Popular guides"><h2>Popular guides</h2><ul>
      ${posts
        .slice(0, 4)
        .map((p) => `<li><a href="/blog/${p.slug}/">${e(shortTitle(p.title))}</a></li>`)
        .join('')}
    </ul></nav>
    <nav aria-label="About"><h2>About</h2><ul>
      <li><a href="${SITE.author.url}" rel="author">Made by ${SITE.author.name}</a></li>
      <li><a href="${SITE.repo}">Source code</a></li>
      <li><a href="/blog/rss.xml">RSS feed</a></li>
    </ul></nav>
  </div>
  <p class="wrap legal">© <span data-year>2026</span> ${SITE.name}. Templates and guides are free to use.</p>
</footer>`;
}

const shortTitle = (t: string) => t.replace(/\s*\(.*?\)\s*$/, '').replace(/:.*$/, '');
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function page(o: HeadOptions, a: Assets, posts: Post[], body: string): string {
  // Search results show ~60 characters; drop the brand suffix from long titles.
  const suffix = ` | ${SITE.name}`;
  if (o.title.length > 70 && o.title.endsWith(suffix)) o = { ...o, title: o.title.slice(0, -suffix.length) };
  return `${head(o, a)}
<body>
${header(o.path)}
<main id="main">
${body}
</main>
${footer(posts)}
</body>
</html>
`;
}

function breadcrumbs(items: { name: string; path: string }[]): { html: string; data: unknown } {
  return {
    html: `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items
      .map((it, i) => (i === items.length - 1 ? `<li><span aria-current="page">${e(it.name)}</span></li>` : `<li><a href="${it.path}">${e(it.name)}</a></li>`))
      .join('')}</ol></nav>`,
    data: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
    },
  };
}

export const ctaBlock = `<aside class="cta-box" aria-label="Try the builder">
  <p class="cta-title">Put it into practice</p>
  <p>Build your résumé with live preview, an ATS health check and PDF, Word and web export. Free, and nothing leaves your browser.</p>
  <a class="btn btn-primary" href="/resumes">Open the builder</a>
</aside>`;

const author = { '@type': 'Person', name: SITE.author.name, url: SITE.author.url, sameAs: [SITE.author.github] };

function templateCard(t: (typeof TEMPLATE_LIST)[number], headingLevel: 'h2' | 'h3' = 'h3'): string {
  return `<li class="tpl">
  <a href="/templates/${t.id}/">
    <span class="tpl-sheet"><img src="/templates/${t.id}.webp" width="600" height="849" loading="lazy" decoding="async" alt="${e(t.name)} résumé template preview"></span>
    <${headingLevel} class="tpl-name">${e(t.name)}</${headingLevel}>
    <span class="tpl-line">${e(TEMPLATE_PAGES[t.id].tagline)}</span>
  </a>
</li>`;
}

function tickerCard(id: TemplateId, i: number): string {
  const name = TEMPLATE_LIST.find((x) => x.id === id)!.name;
  return `<li>
  <a class="tcard" href="/resumes?template=${id}" aria-label="Use ${e(name)} résumé template">
    <span class="tcard-frame"><img src="/templates/${id}.webp" width="600" height="849" alt="${e(name)} résumé template preview" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" draggable="false"></span>
  </a>
</li>`;
}

function postList(posts: Post[], level: 'h2' | 'h3' = 'h3'): string {
  return `<ul class="post-list">${posts
    .map(
      (p) => `<li>
  <article>
    <${level}><a href="/blog/${p.slug}/">${e(p.title)}</a></${level}>
    <p>${e(p.description)}</p>
    <p class="meta"><time datetime="${p.updated}">${fmtDate(p.updated)}</time><span aria-hidden="true">, </span>${p.readMinutes} min read</p>
  </article>
</li>`,
    )
    .join('')}</ul>`;
}

/* ------------------------------------------------------------------ home */

export const FAQ = [
  ['Is Resume Creator really free?', 'Yes. Every template and export format is free, with no sign-up, watermark or paywall.'],
  [
    'Are the templates ATS-friendly?',
    'Yes. Every template uses a single reading order, real selectable text, standard section headings and no tables, text boxes or icons, the elements ATS parsers most often misread.',
  ],
  [
    'Where is my résumé data stored?',
    'Only in your own browser. Nothing is uploaded to a server. You can download a JSON backup at any time and restore it on another device.',
  ],
  [
    'Should I send a PDF or a Word file?',
    'Use the PDF when you email a recruiter or upload to modern portals. If an application form asks for .docx, download the Word version. Both are generated from the same content.',
  ],
  [
    'Can I view my résumé on a phone?',
    'Yes. Besides the PDF, you can export a responsive web page that reflows on any screen, and preview it at phone, tablet and desktop widths while you edit.',
  ],
  [
    'Can I edit my résumé later?',
    'Yes. Résumés save automatically in your browser, so you can come back on the same device any time, or download a backup to continue elsewhere.',
  ],
] as const;

export function renderHome(a: Assets, posts: Post[]): string {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': abs('/#website'),
          url: abs('/'),
          name: SITE.name,
          alternateName: ['Resume Creator', 'ATS Resume Creator', 'Free Resume Maker', 'Free CV Maker'],
          inLanguage: 'en',
        },
        {
          '@type': 'WebApplication',
          '@id': abs('/#app'),
          name: SITE.name,
          url: abs('/'),
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any (web browser)',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'ATS-friendly single-column resume templates',
            'Live preview identical to the PDF',
            'Vector PDF with selectable text and clickable links',
            'Word (.docx), plain text and responsive web page export',
            'Resume health check with ATS tips',
            'Works in the browser, no account required',
          ],
          screenshot: abs(OG_DEFAULT),
          author,
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQ.map(([q, ans]) => ({
            '@type': 'Question',
            name: q.replace(/résumé/g, 'resume'),
            acceptedAnswer: { '@type': 'Answer', text: ans.replace(/résumé/g, 'resume') },
          })),
        },
      ],
    },
  ];

  const body = `
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <h1 id="hero-title">Free ATS Resume Creator & CV Maker</h1>
      <p class="lede">Write an ATS-friendly résumé that recruiters and applicant tracking systems both read. Free resume maker with eight tested templates, live PDF preview, and a real-time health check — 100% private with no sign-up.</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="/resumes" data-cta="hero">Build my résumé</a>
        <a class="btn btn-quiet btn-lg" href="/templates/">Browse templates</a>
      </div>
      <p class="hero-note">No account needed. Your résumé stays in this browser.</p>
    </div>
    <div class="scan" aria-label="Example résumé" role="group">
      <figure class="sheet">
        <img src="/templates/timeline.webp" width="600" height="849" alt="A résumé made with the Timeline template" fetchpriority="high" decoding="async">
        <span class="scanline" aria-hidden="true"></span>
      </figure>
    </div>
  </div>
</section>

<section class="section" id="templates" aria-labelledby="tpl-title">
  <div class="wrap">
    <div class="section-head center">
      <p class="kicker">8 ATS-tested layouts</p>
      <h2 id="tpl-title">Smart templates for every career stage</h2>
      <p>Classic or colourful, every design keeps a single reading order, real text and standard headings. Switch any time without retyping.</p>
    </div>
    <div class="ticker" data-ticker>
      <div class="ticker-viewport" role="region" aria-label="Résumé templates. Use the arrow keys to browse." tabindex="0">
        <div class="ticker-clip">
          <div class="ticker-track">
            <ul class="ticker-group">${TICKER_ORDER.map(tickerCard).join('')}</ul>
          </div>
        </div>
      </div>
    </div>
    <div class="tpl-actions">
      <a class="btn btn-primary" href="/resumes" data-cta="templates">Start with any template — it’s free</a>
      <a class="btn btn-quiet" href="/templates/">Compare all templates</a>
      <button class="btn btn-quiet ticker-toggle" type="button" hidden>Pause</button>
    </div>
  </div>
</section>

<section class="section section-desk" aria-labelledby="parse-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="parse-title">Why layout decides what a recruiter finds</h2>
      <p>Applicant tracking systems extract your text line by line and file it into fields recruiters search. Layouts that look fine to a person can come out scrambled.</p>
    </div>
    <div class="compare">
      <figure class="compare-card bad">
        <div class="mini mini-two" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <figcaption>
          <p class="compare-title">Two-column layout</p>
          <p class="readout">“Experience Skills Senior Engineer Python Northwind SQL Payments Docker…”</p>
          <p>The parser merges the sidebar into your job history, line by line.</p>
        </figcaption>
      </figure>
      <figure class="compare-card good">
        <div class="mini mini-one" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <figcaption>
          <p class="compare-title">Single column (every template here)</p>
          <p class="readout">“Experience · Senior Engineer · Northwind Payments · Mar 2021 – Present…”</p>
          <p>Titles, employers and dates arrive in order and land in the right fields.</p>
        </figcaption>
      </figure>
    </div>
    <p class="more"><a href="/blog/ats-friendly-resume-guide/">Read the full ATS guide</a></p>
  </div>
</section>

<section class="section" aria-labelledby="features-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="features-title">Built for the way résumés are actually read</h2>
    </div>
    <dl class="features">
      <div><dt>The preview is the PDF</dt><dd>One layout engine draws the preview, the PDF and print, so line and page breaks never surprise you.</dd></div>
      <div><dt>A health check that teaches</dt><dd>Flags missing contact details, inverted dates, broken links, weak verbs and bullets without numbers, and jumps you to the field.</dd></div>
      <div><dt>Four ways to send it</dt><dd>Vector PDF with clickable links, an editable Word file, plain text for application forms, and a web page that reflows on phones.</dd></div>
      <div><dt>Private by default</dt><dd>No account, no upload, no tracking. Résumés live in your browser, with one-click backup and restore.</dd></div>
      <div><dt>Fits the page for you</dt><dd>Smart page breaks keep headings with their entries; fit-to-one-page shrinks text without going below a readable size.</dd></div>
      <div><dt>Works on any screen</dt><dd>Edit on a phone, tablet or desktop. Undo, autosave and keyboard shortcuts included.</dd></div>
    </dl>
  </div>
</section>

<section class="section section-desk" aria-labelledby="steps-title">
  <div class="wrap">
    <div class="section-head"><h2 id="steps-title">From blank page to sent in three steps</h2></div>
    <ol class="steps">
      <li><h3>Write it</h3><p>Start blank, from an example, or import a backup. Use <strong>bold</strong> for emphasis in bullets.</p></li>
      <li><h3>Style it</h3><p>Pick a template, accent colour, text size, margins and A4 or US Letter. Everything reflows instantly.</p></li>
      <li><h3>Check and send it</h3><p>Fix what the health check flags, then download PDF, Word, text or a web page.</p></li>
    </ol>
    <p class="center"><a class="btn btn-primary btn-lg" href="/resumes" data-cta="steps">Build my résumé</a></p>
  </div>
</section>

<section class="section" aria-labelledby="guides-title">
  <div class="wrap">
    <div class="section-head split">
      <h2 id="guides-title">Résumé guides</h2>
      <a href="/blog/">All guides</a>
    </div>
    ${postList(posts.slice(0, 3))}
  </div>
</section>

<section class="section section-desk" id="faq" aria-labelledby="faq-title">
  <div class="wrap narrow">
    <h2 id="faq-title">Questions</h2>
    ${FAQ.map(([q, ans]) => `<details class="faq"><summary>${e(q)}</summary><p>${e(ans)}</p></details>`).join('\n')}
  </div>
</section>`;

  return page(
    {
      title: 'Free ATS Resume Creator & CV Maker – PDF & Word',
      description:
        'Free ATS resume creator and CV maker with 8 tested templates, live PDF preview, and health check. 100% free resume builder with no sign-up or watermark.',
      path: '/',
      imageAlt: 'Resume Creator: an ATS-friendly résumé shown in the live editor',
      jsonLd,
    },
    a,
    posts,
    body,
  );
}

/* ------------------------------------------------------------- templates */

export function renderTemplatesIndex(a: Assets, posts: Post[]): string {
  const crumbs = breadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Templates', path: '/templates/' },
  ]);
  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: TEMPLATE_LIST.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(`/templates/${t.id}/`),
      name: `${t.name} résumé template`,
    })),
  };
  const body = `<div class="wrap page-head">
  ${crumbs.html}
  <h1>Free ATS-friendly résumé templates</h1>
  <p class="lede">Eight designs from conservative to colourful. Each one is single-column with real, selectable text and standard headings, so it reads correctly in Workday, Greenhouse, Lever, iCIMS and Taleo.</p>
</div>
<section class="section section-tight" aria-label="All templates">
  <div class="wrap"><ul class="tpl-grid tpl-grid-lg">${TEMPLATE_LIST.map((t) => templateCard(t, 'h2')).join('')}</ul></div>
</section>
<section class="section section-desk" aria-labelledby="choose-title">
  <div class="wrap narrow prose">
    <h2 id="choose-title">How to choose</h2>
    <ul>
      <li><strong>Strict portals, finance, law, government:</strong> <a href="/templates/classic/">Classic</a>.</li>
      <li><strong>Tech, product and data:</strong> <a href="/templates/modern/">Modern</a> or <a href="/templates/timeline/">Timeline</a>.</li>
      <li><strong>Long careers:</strong> <a href="/templates/compact/">Compact</a>.</li>
      <li><strong>Senior and client-facing roles:</strong> <a href="/templates/executive/">Executive Banner</a> or <a href="/templates/editorial/">Editorial</a>.</li>
      <li><strong>Personality without risk:</strong> <a href="/templates/rail/">Accent Rail</a> or <a href="/templates/signature/">Signature</a>.</li>
    </ul>
    <p>Not sure? Start with any template. Your content stays the same when you switch, so you can compare them on your own résumé.</p>
  </div>
</section>`;
  return page(
    {
      title: 'Free ATS-Friendly Resume Templates (8 Designs) | Resume Creator',
      description:
        'Eight free, ATS-friendly resume templates — classic, modern, timeline, executive and more. Single-column, real text, standard headings. Download as PDF or Word.',
      path: '/templates/',
      jsonLd: [crumbs.data, list],
    },
    a,
    posts,
    body,
  );
}

export function renderTemplatePage(id: TemplateId, a: Assets, posts: Post[]): string {
  const t = TEMPLATE_LIST.find((x) => x.id === id)!;
  const c = TEMPLATE_PAGES[id];
  const crumbs = breadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Templates', path: '/templates/' },
    { name: t.name, path: `/templates/${id}/` },
  ]);
  const others = TEMPLATE_LIST.filter((x) => x.id !== id).slice(0, 4);
  const body = `<div class="wrap page-head">${crumbs.html}</div>
<section class="section section-tight" aria-labelledby="t-title">
  <div class="wrap tpl-detail">
    <figure class="tpl-hero-sheet"><img src="/templates/${id}.webp" width="600" height="849" alt="${e(t.name)} résumé template with example content" fetchpriority="high"></figure>
    <div class="tpl-copy">
      <h1 id="t-title">${e(t.name)} résumé template</h1>
      <p class="lede">${e(t.description)}</p>
      <a class="btn btn-primary btn-lg" href="/resumes?template=${id}" data-cta="template">Use this template</a>
      <p class="hero-note">Free. Opens with example content you can replace.</p>
      <h2>Best for</h2>
      <ul class="ticks">${c.bestFor.map((b) => `<li>${e(b)}</li>`).join('')}</ul>
      <h2>What makes it work</h2>
      <ul class="ticks">${c.details.map((b) => `<li>${e(b)}</li>`).join('')}</ul>
      <h2>Exports</h2>
      <p>Vector PDF with selectable text and clickable links, Word (.docx), plain text, and a responsive web page. A4 or US Letter, any accent colour.</p>
    </div>
  </div>
</section>
<section class="section section-desk" aria-labelledby="others-title">
  <div class="wrap">
    <div class="section-head split"><h2 id="others-title">Other templates</h2><a href="/templates/">All templates</a></div>
    <ul class="tpl-grid">${others.map((x) => templateCard(x)).join('')}</ul>
  </div>
</section>`;
  return page(
    {
      title: `${c.title} | ${SITE.name}`,
      description: `${t.description} Free to use, single-column and ATS-friendly. Download as PDF or Word.`.slice(0, 200),
      path: `/templates/${id}/`,
      image: `/templates/${id}.webp`,
      imageAlt: `${t.name} résumé template`,
      jsonLd: [crumbs.data],
      extra: `<meta property="og:image:type" content="image/webp">`,
    },
    a,
    posts,
    body,
  );
}

/* ------------------------------------------------------------------ blog */

export function renderBlogIndex(a: Assets, posts: Post[]): string {
  const crumbs = breadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/blog/' },
  ]);
  const blog = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE.name} guides`,
    url: abs('/blog/'),
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: abs(`/blog/${p.slug}/`),
      datePublished: p.date,
      dateModified: p.updated,
      author,
    })),
  };
  const body = `<div class="wrap page-head">
  ${crumbs.html}
  <h1>Résumé guides</h1>
  <p class="lede">Practical, sourced advice on writing a résumé that gets past applicant tracking systems and holds a recruiter’s attention.</p>
</div>
<section class="section section-tight" aria-label="All guides"><div class="wrap narrow">${postList(posts, 'h2')}</div></section>`;
  return page(
    {
      title: `Resume Writing Guides: ATS, Format, Examples | ${SITE.name}`,
      description:
        'Free resume guides: how to beat applicant tracking systems, resume format and length, action verbs, summary examples and a complete fresher resume example.',
      path: '/blog/',
      jsonLd: [crumbs.data, blog],
    },
    a,
    posts,
    body,
  );
}

export function renderPost(p: Post, a: Assets, posts: Post[], hasOgImage: boolean): string {
  const path = `/blog/${p.slug}/`;
  const crumbs = breadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/blog/' },
    { name: shortTitle(p.title), path },
  ]);
  const image = hasOgImage ? `/og/${p.slug}.png` : OG_DEFAULT;
  const article = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    mainEntityOfPage: abs(path),
    url: abs(path),
    image: [abs(image)],
    datePublished: `${p.date}T09:00:00+05:30`,
    dateModified: `${p.updated}T09:00:00+05:30`,
    author,
    publisher: { '@type': 'Organization', name: SITE.name, url: abs('/'), logo: { '@type': 'ImageObject', url: abs('/icon-512.png') } },
    wordCount: p.words,
    keywords: p.tags.join(', '),
    inLanguage: 'en',
  };
  const toc = p.headings.filter((h) => h.level === 2);
  const more = related(p, posts);
  const body = `<div class="wrap page-head">${crumbs.html}</div>
<div class="wrap article-layout">
  <article class="article" aria-labelledby="post-title">
    <header class="article-head">
      <p class="tags">${p.tags.map((t) => `<span>${e(t)}</span>`).join('')}</p>
      <h1 id="post-title">${e(p.title)}</h1>
      <p class="lede">${e(p.description)}</p>
      <p class="byline">By <a href="${SITE.author.url}" rel="author">${SITE.author.name}</a>. Updated <time datetime="${p.updated}">${fmtDate(p.updated)}</time>. ${p.readMinutes} min read.</p>
    </header>
    <div class="prose">${p.html}</div>
  </article>
  <aside class="toc" aria-labelledby="toc-title">
    <p id="toc-title" class="toc-title">On this page</p>
    <ol>${toc.map((h) => `<li><a href="#${h.id}">${e(h.text)}</a></li>`).join('')}</ol>
    <a class="btn btn-primary btn-block" href="/resumes" data-cta="toc">Open the builder</a>
  </aside>
</div>
<section class="section section-desk" aria-labelledby="related-title">
  <div class="wrap narrow">
    <h2 id="related-title">Keep reading</h2>
    ${postList(more)}
  </div>
</section>`;
  return page(
    {
      title: `${p.title} | ${SITE.name}`,
      description: p.description,
      path,
      type: 'article',
      image,
      jsonLd: [article, crumbs.data],
      extra: `<meta property="article:published_time" content="${p.date}T09:00:00+05:30">\n<meta property="article:modified_time" content="${p.updated}T09:00:00+05:30">\n<meta property="article:author" content="${SITE.author.url}">\n${p.tags.map((t) => `<meta property="article:tag" content="${e(t)}">`).join('\n')}`,
    },
    a,
    posts,
    body,
  );
}

/* ------------------------------------------------------------------- 404 */

export function render404(a: Assets, posts: Post[]): string {
  return page(
    { title: `Page not found | ${SITE.name}`, description: 'This page does not exist.', path: '/404', noindex: true },
    a,
    posts,
    `<div class="wrap narrow page-head notfound">
  <h1>We couldn’t find that page</h1>
  <p class="lede">The link may be old or mistyped. These might help:</p>
  <ul class="ticks"><li><a href="/resumes">Open the résumé builder</a></li><li><a href="/templates/">Browse templates</a></li><li><a href="/blog/">Read the guides</a></li></ul>
</div>`,
  );
}

/* ------------------------------------------------------ sitemap and feed */

export function renderSitemap(posts: Post[], lastmod: string): string {
  const latest = posts.reduce((m, p) => (p.updated > m ? p.updated : m), lastmod);
  const urls: { loc: string; lastmod: string; priority: string }[] = [
    { loc: '/', lastmod: latest, priority: '1.0' },
    { loc: '/templates/', lastmod, priority: '0.9' },
    ...TEMPLATE_LIST.map((t) => ({ loc: `/templates/${t.id}/`, lastmod, priority: '0.8' })),
    { loc: '/blog/', lastmod: latest, priority: '0.8' },
    ...posts.map((p) => ({ loc: `/blog/${p.slug}/`, lastmod: p.updated, priority: '0.7' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${abs(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
}

export function renderRss(posts: Post[]): string {
  const item = (p: Post) => `    <item>
      <title>${e(p.title)}</title>
      <link>${abs(`/blog/${p.slug}/`)}</link>
      <guid isPermaLink="true">${abs(`/blog/${p.slug}/`)}</guid>
      <pubDate>${new Date(`${p.date}T03:30:00Z`).toUTCString()}</pubDate>
      <description>${e(p.description)}</description>
    </item>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE.name} guides</title>
    <link>${abs('/blog/')}</link>
    <description>Practical advice on ATS-friendly résumés.</description>
    <language>en</language>
    <atom:link href="${abs('/blog/rss.xml')}" rel="self" type="application/rss+xml"/>
${posts.map(item).join('\n')}
  </channel>
</rss>
`;
}
