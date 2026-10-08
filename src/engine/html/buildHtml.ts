/**
 * Responsive web résumé: semantic HTML (h1/h2/h3, lists, <time>, <address>) that
 * reflows from phones to desktops, styled per template, with Person JSON-LD for
 * search engines. No scripts, so it is safe to host anywhere or open offline.
 */
import { formatDateRange, formatPartialDate, parsePartialDate, type DateFormat } from '../../domain/dates';
import { linkIcon, linkImage, linkText } from '../../domain/links';
import type { LinkIcon, Resume, Section } from '../../domain/schema';
import { displayUrl, safeHref } from '../../lib/url';
import { FACES, type FaceId } from '../fonts/registry';
import { toBase64, type FontSet } from '../fonts/loader';
import { FIELD_ICONS, iconSvg } from '../icons';
import { accentOf, templateOf } from '../index';
import { parseInline } from '../layout/text';
import { shade } from '../templates/specs';
import type { TemplateSpec } from '../templates/types';

export interface HtmlOptions {
  /** Embed the template fonts as data URIs (self-contained file). Falls back to system fonts otherwise. */
  fonts?: FontSet | null;
  /** Omit search metadata in sandboxed previews; exports retain it by default. */
  structuredData?: boolean;
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const rich = (t: string) =>
  parseInline(t.trim())
    .map((s) => (s.bold ? `<strong>${esc(s.text)}</strong>` : esc(s.text)))
    .join('');

/* ---------- colour helpers (accent used as text must stay WCAG AA on white) ---------- */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};
/** Darkens a colour until it reaches the target contrast against white. */
export function readable(hex: string, target = 4.5): string {
  let c = hex;
  for (let i = 0; i < 12 && contrast(c, '#ffffff') < target; i++) c = shade(c, 0.12);
  return c;
}

/* ---------- fonts ---------- */
const STACK: Record<string, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
};
const kindOf = (family: string) => (/serif/i.test(family) && !/sans/i.test(family) ? 'serif' : /mono/i.test(family) ? 'mono' : 'sans');
const familyCss = (face: FaceId) => {
  const fam = FACES[face].family;
  return `'RC ${fam}', '${fam}', ${STACK[kindOf(fam)]}`;
};
const b64 = new Map<FaceId, string>();

function fontFaces(spec: TemplateSpec, fonts?: FontSet | null): string {
  if (!fonts) return '';
  const used = new Set<FaceId>(Object.values(spec.faces));
  return [...used]
    .map((id) => {
      const f = fonts.get(id);
      if (!f) return '';
      let data = b64.get(id);
      if (!data) b64.set(id, (data = toBase64(f.bytes)));
      return `@font-face{font-family:'RC ${FACES[id].family}';src:url(data:font/ttf;base64,${data}) format('truetype');font-weight:${FACES[id].weight};font-display:swap}`;
    })
    .join('\n');
}

/* ---------- markup ---------- */
function time(value: string, fmt: DateFormat): string {
  const d = parsePartialDate(value);
  if (!d) return esc(value);
  const iso = d.month ? `${d.year}-${String(d.month).padStart(2, '0')}` : String(d.year);
  return `<time datetime="${iso}">${esc(formatPartialDate(value, fmt))}</time>`;
}
function when(r: { start: string; end: string; current: boolean }, fmt: DateFormat): string {
  const text = formatDateRange(r, fmt);
  if (!text) return '';
  const start = r.start ? time(r.start, fmt) : '';
  const end = r.current ? 'Present' : r.end ? time(r.end, fmt) : '';
  return start && end && text.includes('–') ? `${start} – ${end}` : start || end;
}
const link = (url: string, text = displayUrl(url)) => {
  const href = safeHref(url);
  return href ? `<a href="${esc(href)}" rel="noopener noreferrer">${esc(text)}</a>` : esc(text);
};
const bulletsHtml = (list: { text: string }[]) => {
  const items = list.filter((b) => b.text.trim());
  return items.length ? `<ul class="cv-bullets">${items.map((b) => `<li>${rich(b.text)}</li>`).join('')}</ul>` : '';
};
const metaHtml = (parts: string[]) => {
  const p = parts.filter(Boolean);
  return p.length ? `<p class="cv-meta">${p.join('<span class="cv-sep" aria-hidden="true"> · </span>')}</p>` : '';
};

function entry(title: string, org: string, date: string, meta: string, body: string, sep: string): string {
  const orgHtml = org ? `<span class="cv-org"><span class="cv-sep" aria-hidden="true">${esc(sep)}</span>${esc(org)}</span>` : '';
  return `<article class="cv-entry"><div class="cv-entry-head"><h3>${esc(title)}${orgHtml}</h3>${date ? `<p class="cv-date">${date}</p>` : ''}</div>${meta}${body}</article>`;
}

function sectionHtml(s: Section, fmt: DateFormat, sep: string): string {
  const id = `sec-${s.id.replace(/[^\w-]/g, '')}`;
  const head = `<h2 id="${id}">${esc(s.title.trim() || 'Untitled')}</h2>`;
  let body = '';
  if (s.kind === 'summary') {
    if (!s.content.trim()) return '';
    body = s.content
      .split(/\n+/)
      .filter((p) => p.trim())
      .map((p) => `<p class="cv-prose">${rich(p)}</p>`)
      .join('');
  } else {
    const items = s.items.filter((i) => i.visible);
    if (!items.length) return '';
    if (s.kind === 'skills') {
      body = `<dl class="cv-skills">${items
        .map((it) => ('keywords' in it ? `<div>${it.label.trim() ? `<dt>${esc(it.label)}</dt>` : ''}<dd>${esc(it.keywords)}</dd></div>` : ''))
        .join('')}</dl>`;
    } else if (s.kind === 'custom' && s.layout === 'compact') {
      body = `<ul class="cv-compact">${items
        .map((it) => {
          if (!('description' in it)) return '';
          const parts = [`<strong>${esc(it.title)}</strong>`];
          if (it.subtitle.trim()) parts.push(esc(it.subtitle));
          if (it.description.trim()) parts.push(rich(it.description));
          const date = when(it, fmt);
          return `<li><span>${parts.join(' — ')}${it.url.trim() ? ` ${link(it.url)}` : ''}</span>${date ? `<span class="cv-date">${date}</span>` : ''}</li>`;
        })
        .join('')}</ul>`;
    } else {
      body = items
        .map((it) => {
          switch (s.kind) {
            case 'experience':
              return 'role' in it
                ? entry(
                    it.role || 'Position',
                    it.organization,
                    when(it, fmt),
                    metaHtml([esc(it.location), it.url ? link(it.url) : '']),
                    bulletsHtml(it.bullets),
                    sep,
                  )
                : '';
            case 'education':
              return 'degree' in it
                ? entry(
                    it.degree || it.institution,
                    it.degree ? it.institution : '',
                    when(it, fmt),
                    metaHtml([esc(it.location), esc(it.score)]),
                    bulletsHtml(it.bullets),
                    sep,
                  )
                : '';
            case 'projects':
              return 'stack' in it
                ? entry(
                    it.name || 'Project',
                    it.subtitle,
                    when(it, fmt),
                    metaHtml([it.url ? link(it.url) : '', it.stack ? `Stack: ${esc(it.stack)}` : '']),
                    bulletsHtml(it.bullets),
                    sep,
                  )
                : '';
            case 'certifications':
              return 'issuer' in it
                ? entry(it.name || 'Certification', it.issuer, it.date ? time(it.date, fmt) : '', metaHtml([it.url ? link(it.url) : '']), '', sep)
                : '';
            case 'custom':
              return 'description' in it
                ? entry(
                    it.title || 'Entry',
                    it.subtitle,
                    when(it, fmt),
                    metaHtml([esc(it.location), it.url ? link(it.url) : '']),
                    (it.description.trim() ? `<p class="cv-prose">${rich(it.description)}</p>` : '') + bulletsHtml(it.bullets),
                    sep,
                  )
                : '';
            default:
              return '';
          }
        })
        .join('');
    }
  }
  return `<section class="cv-sec cv-sec--${s.kind}" aria-labelledby="${id}">${head}${body}</section>`;
}

/** schema.org Person for search engines and rich results. */
function jsonLd(r: Resume): string {
  const b = r.basics;
  const sameAs = b.links.map((l) => safeHref(l.url)).filter((u): u is string => !!u && u.startsWith('http'));
  const exp = r.sections.find((s) => s.kind === 'experience' && s.visible);
  const current = exp?.kind === 'experience' ? exp.items.find((i) => i.visible && i.current) : undefined;
  const skills = r.sections
    .flatMap((s) => (s.kind === 'skills' && s.visible ? s.items.filter((i) => i.visible).flatMap((i) => i.keywords.split(',').map((k) => k.trim())) : []))
    .filter(Boolean);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: b.name.trim() || undefined,
    jobTitle: b.headline.trim() || undefined,
    email: b.email.trim() ? `mailto:${b.email.trim()}` : undefined,
    telephone: b.phone.trim() || undefined,
    address: b.location.trim() ? { '@type': 'PostalAddress', addressLocality: b.location.trim() } : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    worksFor: current?.organization ? { '@type': 'Organization', name: current.organization } : undefined,
    knowsAbout: skills.length ? skills.slice(0, 40) : undefined,
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function css(spec: TemplateSpec, accentRaw: string, fonts?: FontSet | null): string {
  const pal = spec.palette(accentRaw);
  const accent = readable(pal.accent);
  const link = readable(pal.link);
  const f = spec.faces;
  const H = spec.header;
  const S = spec.section;
  const variant = S.variant;
  const headingColor = S.color === 'accent' ? accent : S.color === 'body' ? pal.body : pal.ink;
  const band = spec.features?.headerBand;
  const timeline = !!spec.features?.timeline;
  const edge = spec.features?.pageEdge;
  const compact = spec.id === 'compact';
  return `${fontFaces(spec, fonts)}
:root{color-scheme:light;--ink:${pal.ink};--body:${pal.body};--muted:${pal.muted};--rule:${pal.rule};--accent:${accent};--link:${link};--accent-raw:${pal.accent};
--f-body:${familyCss(f.body)};--f-name:${familyCss(f.name)};--f-title:${familyCss(f.title)};--f-label:${familyCss(f.label)};--f-date:${familyCss(f.date)};
--w-bold:${FACES[f.bold].weight};--w-title:${FACES[f.title].weight};--w-name:${FACES[f.name].weight};--w-label:${FACES[f.label].weight};--w-date:${FACES[f.date].weight};
--gap:${compact ? 1 : 1.35}rem}
*,*::before,*::after{box-sizing:border-box}
html{font-size:clamp(15px,14px + .25vw,17px);-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;background:#eceae6;color:var(--body);font-family:var(--f-body);line-height:1.55;font-kerning:normal;text-rendering:optimizeLegibility}
.cv{position:relative;max-width:52rem;margin:0 auto;background:#fff;padding:clamp(1.25rem,4vw,3rem) clamp(1.1rem,5vw,3.25rem) clamp(1.5rem,4vw,3rem)}
@media (min-width:56rem){.cv{margin:2.5rem auto;border-radius:6px;box-shadow:0 1px 2px rgb(0 0 0/.06),0 18px 40px -18px rgb(0 0 0/.28)}}
${edge ? `.cv{border-left:${Math.max(4, edge.width)}px solid var(--accent-raw)}` : ''}
a{color:var(--link);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.18em;overflow-wrap:anywhere}
a:hover{text-decoration-thickness:2px}a:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:2px}
strong{font-weight:var(--w-bold);color:var(--ink)}
.cv-head{${H.align === 'center' ? 'text-align:center;' : ''}${band ? `margin:calc(-1*clamp(1.25rem,4vw,3rem)) calc(-1*clamp(1.1rem,5vw,3.25rem)) 0;padding:clamp(1.5rem,4vw,2.75rem) clamp(1.1rem,5vw,3.25rem) 1.4rem;background:${shade(pal.accent, -(1 - band.tint))};border-top:${band.topStrip}px solid var(--accent-raw);` : ''}${H.rule ? 'border-bottom:1px solid var(--rule);padding-bottom:1.1rem;' : ''}}
${band ? '@media (min-width:56rem){.cv-head{border-radius:6px 6px 0 0}}' : ''}
h1{margin:0;font-family:var(--f-name);font-weight:var(--w-name);color:var(--ink);font-size:clamp(1.85rem,1.3rem + 2.6vw,${(H.nameSize / 10).toFixed(2)}rem);line-height:1.1;letter-spacing:${H.nameUpper ? '.02em' : '-.015em'};${H.nameUpper ? 'text-transform:uppercase;' : ''}overflow-wrap:anywhere}
.cv-headline{margin:.35rem 0 0;font-size:clamp(1.02rem,.95rem + .35vw,1.15rem);font-family:var(--f-title);font-weight:var(--w-title);color:${H.headlineColor === 'accent' ? 'var(--accent)' : H.headlineColor === 'muted' ? 'var(--muted)' : 'var(--ink)'}}
.cv-tagline{font-family:var(--f-body);font-weight:400;color:${H.taglineAccent ? 'var(--accent)' : 'var(--muted)'}}
.cv-contact{display:flex;flex-wrap:wrap;${H.align === 'center' ? 'justify-content:center;' : ''}gap:.2rem 1.1rem;margin:.75rem 0 0;padding:0;list-style:none;font-size:.9rem;font-style:normal}
address{font-style:normal}
.cv-contact li{min-width:0}
.cv-contact li,.cv-contact a{display:inline-flex;align-items:center;gap:.35em}
.cv-icon{flex:none;width:1.05em;height:1.05em;color:var(--accent)}
.cv-icon-only{padding:.15rem}
.cv-icon-only .cv-icon{width:1.2em;height:1.2em}
.cv-sec{margin-top:var(--gap)}
.cv-sec h2{margin:0 0 .6rem;font-family:var(--f-label);font-weight:var(--w-label);color:${headingColor};font-size:${S.upper ? '.8rem' : '1.08rem'};${S.upper ? `text-transform:uppercase;letter-spacing:${Math.max(0.08, S.labelCs / 12).toFixed(2)}em;` : ''}line-height:1.3}
${
  variant === 'signature'
    ? '.cv-sec{border-top:1px solid var(--rule);padding-top:.9rem}.cv-sec h2{display:flex;align-items:center;gap:.6rem}.cv-sec h2::before{content:"";width:.55rem;height:2px;background:var(--accent-raw)}'
    : variant === 'underline'
      ? '.cv-sec h2{border-bottom:1.5px solid var(--ink);padding-bottom:.25rem}'
      : variant === 'accent'
        ? '.cv-sec h2{border-bottom:1px solid var(--rule);padding-bottom:.3rem}'
        : variant === 'inline-rule'
          ? '.cv-sec h2{display:flex;align-items:center;gap:.6rem}.cv-sec h2::after{content:"";flex:1;height:1px;background:var(--rule)}'
          : variant === 'rail'
            ? '.cv-sec h2{border-left:4px solid var(--accent-raw);padding-left:.6rem;line-height:1.15}'
            : variant === 'hairline'
              ? '.cv-sec{border-top:1px solid var(--ink);padding-top:.8rem}'
              : '.cv-sec h2::after{content:"";display:block;width:1.75rem;height:2.5px;margin-top:.35rem;background:var(--accent-raw)}'
}
${H.rule ? '.cv-head+.cv-sec{border-top:0;padding-top:0}' : ''}
.cv-prose{margin:0 0 .5rem;max-width:68ch}
.cv-entry{margin:0 0 ${compact ? '.75rem' : '1.05rem'}}
.cv-entry:last-child{margin-bottom:0}
.cv-entry-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.05rem 1rem}
.cv-entry h3{margin:0;font-family:var(--f-title);font-weight:var(--w-title);font-size:1.02rem;color:var(--ink);line-height:1.35;flex:1 1 18rem;min-width:0}
.cv-org{font-family:var(--f-body);font-weight:400}
.cv-sep{color:var(--muted)}
.cv-date{margin:0;font-family:var(--f-date);font-weight:var(--w-date);font-size:.86rem;color:var(--muted);white-space:nowrap;${spec.entry.dateUpper ? 'text-transform:uppercase;letter-spacing:.06em;' : ''}font-variant-numeric:tabular-nums}
.cv-meta{margin:.1rem 0 0;font-size:.88rem;color:var(--muted)}
.cv-bullets{margin:.4rem 0 0;padding-left:1.15rem}
.cv-bullets li{margin:.22rem 0;padding-left:.15rem;max-width:72ch}
.cv-bullets li::marker{color:${spec.text.bulletAccent ? 'var(--accent-raw)' : 'var(--muted)'}}
.cv-skills{margin:0;display:grid;gap:.35rem}
.cv-skills div{display:grid;grid-template-columns:minmax(0,1fr);gap:0}
.cv-skills dt{font-weight:var(--w-bold);color:var(--ink);font-family:var(--f-body)}
.cv-skills dd{margin:0}
@media (min-width:40rem){.cv-skills div{grid-template-columns:minmax(8rem,11rem) minmax(0,1fr);gap:1rem}}
.cv-compact{margin:0;padding:0;list-style:none;display:grid;gap:.35rem}
.cv-compact li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:0 1rem}
${
  timeline
    ? `@media (min-width:44rem){
.cv--timeline .cv-entry{display:grid;grid-template-columns:8.5rem minmax(0,1fr);column-gap:1.6rem;position:relative}
.cv--timeline .cv-entry::before{content:"";position:absolute;left:calc(8.5rem + .8rem);top:.55rem;bottom:-1.05rem;width:1px;background:var(--rule)}
.cv--timeline .cv-entry:last-child::before{bottom:0}
.cv--timeline .cv-entry-head{display:contents}
.cv--timeline .cv-entry-head h3{grid-column:2;grid-row:1;position:relative}
.cv--timeline .cv-entry-head h3::before{content:"";position:absolute;left:calc(-.8rem - 4px);top:.5rem;width:8px;height:8px;border-radius:50%;background:var(--accent-raw)}
.cv--timeline .cv-date{grid-column:1;grid-row:1;white-space:normal;padding-top:.08rem}
.cv--timeline .cv-meta,.cv--timeline .cv-bullets,.cv--timeline .cv-prose{grid-column:2}
.cv--timeline .cv-sec--summary .cv-prose,.cv--timeline .cv-skills,.cv--timeline .cv-compact{margin-left:calc(8.5rem + 1.6rem)}}`
    : ''
}
@media (max-width:30rem){.cv-contact{flex-direction:column;gap:.15rem}.cv-contact a{padding:.2rem 0}.cv-entry-head{flex-direction:column;align-items:flex-start}.cv-entry h3{flex:none}.cv-date{white-space:normal}.cv-compact li{flex-direction:column}}
@media print{body{background:#fff}.cv{margin:0;max-width:none;box-shadow:none;padding:0}a{color:inherit;text-decoration:none}.cv-entry{break-inside:avoid}.cv-sec h2{break-after:avoid}@page{margin:14mm}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}`;
}

export function buildResumeHtml(resume: Resume, opts: HtmlOptions = {}): string {
  const spec = templateOf(resume);
  const fmt = resume.design.dateFormat;
  const b = resume.basics;
  const name = b.name.trim() || 'Résumé';
  const summary = resume.sections.find((s) => s.kind === 'summary' && s.visible);
  const description = (summary?.kind === 'summary' ? summary.content : `${name}${b.headline ? ` – ${b.headline}` : ''}`)
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  const title = `${name}${b.headline.trim() ? ` – ${b.headline.trim()}` : ''} | Résumé`;

  const style = resume.design.linkStyle;
  const withIcons = style === 'icon-text' || style === 'icon';
  const ico = (icon: LinkIcon) => (withIcons ? iconSvg(icon) : '');
  const linkIcon2 = (l: (typeof b.links)[number]) => {
    const img = linkImage(l);
    return img ? `<img class="cv-icon" src="${esc(img)}" alt="" width="16" height="16">` : iconSvg(linkIcon(l));
  };
  const contact: string[] = [];
  if (b.location.trim()) contact.push(`<li>${ico(FIELD_ICONS.location)}<span>${esc(b.location)}</span></li>`);
  if (b.phone.trim()) contact.push(`<li><a href="tel:${esc(b.phone.replace(/[^\d+]/g, ''))}">${ico(FIELD_ICONS.phone)}<span>${esc(b.phone)}</span></a></li>`);
  if (b.email.trim()) {
    const href = safeHref(b.email);
    const inner = `${ico(FIELD_ICONS.email)}<span>${esc(b.email.trim())}</span>`;
    contact.push(`<li>${href ? `<a href="${esc(href)}" rel="noopener noreferrer">${inner}</a>` : inner}</li>`);
  }
  for (const l of b.links) {
    if (!l.url.trim()) continue;
    const href = safeHref(l.url);
    const text = linkText(l, style);
    if (!href) contact.push(`<li>${esc(text)}</li>`);
    else if (style === 'icon')
      contact.push(
        `<li><a class="cv-icon-only" href="${esc(href)}" rel="noopener noreferrer" aria-label="${esc(text)}" title="${esc(text)}">${linkIcon2(l)}</a></li>`,
      );
    else contact.push(`<li><a href="${esc(href)}" rel="noopener noreferrer">${withIcons ? linkIcon2(l) : ''}<span>${esc(text)}</span></a></li>`);
  }

  const headline = [
    b.headline.trim() ? esc(b.headline) : '',
    b.tagline.trim() ? `${b.headline.trim() ? '<span class="cv-sep" aria-hidden="true"> · </span>' : ''}<span class="cv-tagline">${esc(b.tagline)}</span>` : '',
  ].join('');

  const sections = resume.sections
    .filter((s) => s.visible)
    .map((s) => sectionHtml(s, fmt, spec.entry.separator))
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(name)}">
<meta name="generator" content="Resume Creator">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta name="twitter:card" content="summary">
${opts.structuredData === false ? '' : `<script type="application/ld+json">${jsonLd(resume)}</script>`}
<style>${css(spec, accentOf(resume), opts.fonts)}</style>
</head>
<body>
<main class="cv cv--${spec.id}">
<header class="cv-head">
<h1>${esc(name)}</h1>
${headline ? `<p class="cv-headline">${headline}</p>` : ''}
${contact.length ? `<address><ul class="cv-contact" aria-label="Contact details">${contact.join('')}</ul></address>` : ''}
</header>
${sections}
</main>
</body>
</html>
`;
}
