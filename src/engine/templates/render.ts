/**
 * Shared single-column renderer. Templates differ only through their
 * TemplateSpec, which keeps every template ATS-safe (one reading order, real
 * text, standard headings) and makes new templates cheap to add.
 */
import { formatDateRange, formatPartialDate, type DateFormat } from '../../domain/dates';
import type { Resume, Section } from '../../domain/schema';
import { displayUrl, safeHref } from '../../lib/url';
import type { Composer } from '../layout/composer';
import type { Run, TextStyle } from '../layout/text';
import type { Palette, TemplateSpec } from './types';

export interface RenderOptions {
  /** Type scale (font sizes and line heights). */
  scale: number;
  /** Multiplier for vertical gaps between blocks. */
  spacing: number;
  dateFormat: DateFormat;
  accent: string;
}

export function renderResume(resume: Resume, spec: TemplateSpec, c: Composer, o: RenderOptions): void {
  const s = o.scale;
  const g = (pt: number) => pt * s * o.spacing;
  const pal: Palette = spec.palette(o.accent);
  const f = spec.faces;
  const st = (face: TextStyle['face'], size: number, color: string, extra: Partial<TextStyle> = {}): TextStyle => ({
    face,
    boldFace: f.bold,
    size: size * s,
    color,
    ...extra,
    cs: (extra.cs ?? 0) * s,
  });

  const T = spec.text;
  const E = spec.entry;
  const H = spec.header;
  const styles = {
    body: st(f.body, T.size, pal.body),
    bodyMuted: st(f.body, T.size, pal.muted),
    strong: st(f.bold, T.size, pal.ink),
    link: st(f.body, T.size, pal.link),
    sep: st(f.body, T.size, pal.faint),
    title: st(f.title, E.titleSize, pal.ink),
    titleSep: st(f.body, E.titleSize, pal.muted),
    org: st(f.body, E.titleSize, pal.ink),
    subtitle: st(f.body, E.titleSize * 0.93, pal.muted),
    date: st(f.date, E.dateSize, pal.muted, { cs: E.dateCs, upper: E.dateUpper }),
    meta: st(f.body, E.metaSize, pal.muted),
    metaLink: st(f.body, E.metaSize, pal.link),
    num: st(f.label, E.titleSize * 0.78, pal.accent, { cs: 0.3 }),
    projectName: st(f.projectName, E.titleSize * (E.projectNameUpper ? 1.04 : 1), pal.ink, { upper: E.projectNameUpper, cs: E.projectNameUpper ? -0.2 : 0 }),
    bullet: st(f.bold, T.size, T.bulletAccent ? pal.accent : pal.muted),
  };
  const LH = T.lineHeight * s;
  const metaLH = Math.max(E.metaSize * 1.42, LH * 0.94) * s;
  const titleLH = Math.max(E.titleSize * 1.34 * s, LH);

  /* ---------- header ---------- */
  const center = H.align === 'center';
  const name = resume.basics.name.trim() || 'Your Name';
  c.paragraph([{ text: name, style: st(f.name, H.nameSize, pal.ink, { cs: H.nameCs, upper: H.nameUpper }) }], {
    lineHeight: H.nameSize * s * 1.18,
    align: center ? 'center' : 'left',
  });

  const headline = resume.basics.headline.trim();
  const tagline = resume.basics.tagline.trim();
  if (headline || tagline) {
    const runs: Run[] = [];
    if (headline) runs.push({ text: headline, style: st(f.headline, H.headlineSize, pal[H.headlineColor]) });
    if (headline && tagline) runs.push({ text: '  ·  ', style: st(f.body, H.headlineSize, pal.faint) });
    if (tagline) runs.push({ text: tagline, style: st(H.taglineAccent ? f.headline : f.body, H.headlineSize, H.taglineAccent ? pal.accent : pal.muted) });
    c.space(g(2));
    c.paragraph(runs, { lineHeight: H.headlineSize * s * 1.35, align: center ? 'center' : 'left' });
  }

  /** Leading spaces become non-breaking so a separator never starts a wrapped line. */
  const glue = (sep: string) => sep.replace(/^ +/, (m) => '\u00A0'.repeat(m.length));
  const contact: Run[] = [];
  const cStyle = st(f.body, H.contactSize, pal.body);
  const cLink = st(f.body, H.contactSize, H.contactLinks === 'plain' ? pal.body : pal.link);
  const cSep = st(f.body, H.contactSize, pal.faint);
  const pushContact = (text: string, href: string | null) => {
    if (!text.trim()) return;
    if (contact.length) contact.push({ text: glue(H.separator), style: cSep });
    contact.push({ text: text.trim(), style: href ? cLink : cStyle, link: href });
  };
  pushContact(resume.basics.location, null);
  pushContact(resume.basics.phone, resume.basics.phone.trim() ? `tel:${resume.basics.phone.replace(/[^\d+]/g, '')}` : null);
  pushContact(resume.basics.email, safeHref(resume.basics.email));
  for (const l of resume.basics.links) pushContact(displayUrl(l.url), safeHref(l.url));
  if (contact.length) {
    c.space(g(4));
    c.paragraph(contact, { lineHeight: H.contactSize * s * 1.45, align: center ? 'center' : 'left' });
  }
  if (H.rule) {
    c.space(g(6));
    c.rule(pal.rule, 0.8 * s);
  }

  /* ---------- sections ---------- */
  const sectionHeading = (title: string) => {
    const S = spec.section;
    const label = st(f.label, S.labelSize, pal[S.color], {
      cs: S.labelCs,
      upper: S.upper,
    });
    const text = title.trim() || 'Untitled';
    const lh = S.labelSize * s * 1.6;
    const baseline = (lh + label.size * 0.72) / 2;
    const width = c.m.width(text, label);
    c.space(g(S.before));
    switch (S.variant) {
      case 'signature': {
        c.rule(pal.rule, 0.6, 0.6);
        c.space(g(9));
        const lineOps = c.paragraphOps(text, label, 11 * s, lh);
        c.add(lh, [{ type: 'rect', x: c.x, y: baseline - label.size * 0.35 - 0.8 * s, w: 7 * s, h: 1.6 * s, color: pal.accent }, ...lineOps]);
        break;
      }
      case 'underline': {
        c.add(lh, c.paragraphOps(text, label, 0, lh));
        c.add(2 * s, [{ type: 'line', x1: c.x, y1: 0.4 * s, x2: c.x + c.width, y2: 0.4 * s, color: pal.ink, width: 0.75 * s }]);
        break;
      }
      case 'accent': {
        c.add(lh, c.paragraphOps(text, label, 0, lh));
        c.add(3 * s, [{ type: 'line', x1: c.x, y1: 1 * s, x2: c.x + c.width, y2: 1 * s, color: pal.rule, width: 0.6 * s }]);
        break;
      }
      case 'inline-rule': {
        const y = baseline - label.size * 0.33;
        c.add(lh, [
          ...c.paragraphOps(text, label, 0, lh),
          { type: 'line', x1: c.x + width + 6 * s, y1: y, x2: c.x + c.width, y2: y, color: pal.rule, width: 0.7 * s },
        ]);
        break;
      }
    }
    c.keepWithNext();
    c.space(g(S.after));
  };

  const range = (r: { start: string; end: string; current: boolean }) => formatDateRange(r, o.dateFormat);
  const dateRuns = (text: string): Run[] | undefined => (text ? [{ text, style: styles.date }] : undefined);

  /** Title line (+ right-aligned date), optional meta line, glued to what follows. */
  const entryHeader = (title: Run[], date: string, meta: Run[]) => {
    c.paragraph(title, { lineHeight: titleLH, right: dateRuns(date), keep: 'block' });
    c.keepWithNext();
    if (meta.length) {
      c.paragraph(meta, { lineHeight: metaLH, keep: 'block' });
      c.keepWithNext();
    }
  };

  const metaRuns = (parts: { text: string; link?: string | null; prefix?: string }[]): Run[] => {
    const out: Run[] = [];
    for (const p of parts) {
      if (!p.text.trim()) continue;
      if (out.length) out.push({ text: glue('  ·  '), style: styles.meta });
      if (p.prefix) out.push({ text: p.prefix, style: styles.meta });
      out.push({ text: p.text.trim(), style: p.link ? styles.metaLink : styles.meta, link: p.link ?? null });
    }
    return out;
  };

  const bullets = (list: { text: string }[]) => {
    const items = list.filter((b) => b.text.trim());
    items.forEach((b, i) => {
      if (i) c.space(g(T.bulletGap));
      c.paragraph([{ text: b.text.trim(), style: styles.body, rich: true }], {
        lineHeight: LH,
        indent: T.bulletIndent * s,
        marker: { text: T.bullet, style: styles.bullet, offset: 1.2 * s },
        keep: 'block',
      });
    });
  };

  const prose = (text: string) => {
    text
      .split(/\n\s*\n|\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((p, i) => {
        if (i) c.space(g(4));
        c.paragraph([{ text: p, style: styles.body, rich: true }], { lineHeight: LH, keep: 'lines' });
      });
  };

  const joinTitle = (main: string, mainStyle: TextStyle, rest: string, restStyle: TextStyle = styles.org): Run[] => {
    const runs: Run[] = [{ text: main.trim(), style: mainStyle }];
    if (rest.trim()) runs.push({ text: E.separator, style: styles.titleSep }, { text: rest.trim(), style: restStyle });
    return runs.filter((r) => r.text);
  };

  const renderSection = (section: Section) => {
    if (section.kind === 'summary') {
      if (!section.content.trim()) return;
      sectionHeading(section.title);
      prose(section.content);
      return;
    }
    const items = section.items.filter((i) => i.visible);
    if (!items.length) return;
    sectionHeading(section.title);

    items.forEach((item, idx) => {
      const tight = section.kind === 'skills' || (section.kind === 'custom' && section.layout === 'compact');
      if (idx) c.space(g(tight ? T.bulletGap + 1.2 : E.gap));
      switch (section.kind) {
        case 'experience': {
          const it = item as Extract<Section, { kind: 'experience' }>['items'][number];
          const meta = metaRuns([{ text: it.location }, { text: it.url ? displayUrl(it.url) : '', link: safeHref(it.url) }]);
          entryHeader(joinTitle(it.role || 'Position', styles.title, it.organization), range(it), meta);
          bullets(it.bullets);
          break;
        }
        case 'education': {
          const it = item as Extract<Section, { kind: 'education' }>['items'][number];
          const meta = metaRuns([{ text: it.location }, { text: it.score }]);
          entryHeader(joinTitle(it.degree || it.institution, styles.title, it.degree ? it.institution : ''), range(it), meta);
          bullets(it.bullets);
          break;
        }
        case 'projects': {
          const it = item as Extract<Section, { kind: 'projects' }>['items'][number];
          const title: Run[] = [];
          if (E.numberProjects) title.push({ text: `${String(idx + 1).padStart(2, '0')} `, style: styles.num });
          title.push(...joinTitle(it.name || 'Project', styles.projectName, it.subtitle, styles.subtitle));
          const meta = metaRuns([
            { text: it.url ? displayUrl(it.url) : '', link: safeHref(it.url) },
            { text: it.stack, prefix: 'Stack: ' },
          ]);
          entryHeader(title, range(it), meta);
          bullets(it.bullets);
          break;
        }
        case 'skills': {
          const it = item as Extract<Section, { kind: 'skills' }>['items'][number];
          const runs: Run[] = [];
          if (it.label.trim()) runs.push({ text: `${it.label.trim()}: `, style: styles.strong });
          runs.push({ text: it.keywords.trim(), style: styles.body });
          c.paragraph(runs, { lineHeight: LH, keep: 'block' });
          break;
        }
        case 'certifications': {
          const it = item as Extract<Section, { kind: 'certifications' }>['items'][number];
          const meta = metaRuns([{ text: it.url ? displayUrl(it.url) : '', link: safeHref(it.url) }]);
          entryHeader(joinTitle(it.name || 'Certification', styles.title, it.issuer), it.date ? formatPartialDate(it.date, o.dateFormat) : '', meta);
          break;
        }
        case 'custom': {
          const it = item as Extract<Section, { kind: 'custom' }>['items'][number];
          if (section.layout === 'compact') {
            const runs: Run[] = [{ text: it.title.trim() || 'Entry', style: styles.strong }];
            if (it.subtitle.trim()) runs.push({ text: ` — ${it.subtitle.trim()}`, style: styles.body });
            if (it.description.trim()) runs.push({ text: ` — ${it.description.trim()}`, style: styles.body, rich: true });
            const href = safeHref(it.url);
            if (it.url.trim()) runs.push({ text: '  ', style: styles.body }, { text: displayUrl(it.url), style: href ? styles.link : styles.body, link: href });
            c.paragraph(runs, { lineHeight: LH, right: dateRuns(range(it)), keep: 'block' });
            break;
          }
          const meta = metaRuns([{ text: it.location }, { text: it.url ? displayUrl(it.url) : '', link: safeHref(it.url) }]);
          entryHeader(joinTitle(it.title || 'Entry', styles.title, it.subtitle), range(it), meta);
          if (it.description.trim()) prose(it.description);
          bullets(it.bullets);
          break;
        }
      }
      c.releaseKeep();
    });
  };

  resume.sections.filter((sec) => sec.visible).forEach(renderSection);
}
