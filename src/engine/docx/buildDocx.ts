/**
 * Word (.docx) export built from résumé data (not from layout ops) so Word can
 * reflow it: real Heading 1 styles, real bullet lists, hyperlinks and a right
 * tab stop for dates. Ported from the original hand-written OOXML builder.
 */
import type JSZipType from 'jszip';
import { formatDateRange, formatPartialDate } from '../../domain/dates';
import { linkText } from '../../domain/links';
import type { Resume, Section } from '../../domain/schema';
import { displayUrl, safeHref } from '../../lib/url';
import { accentOf, templateOf } from '../index';
import { cleanText, parseInline } from '../layout/text';
import { PAGE_SIZES } from '../types';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const MARGIN_PT = { narrow: 32, normal: 44, wide: 58 } as const;

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** XML 1.0 forbids most control characters; strip them before escaping. */
export function xmlEscape(t: string): string {
  return cleanText(t)
    .replace(/[\uD800-\uDFFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface RunOpts {
  b?: boolean;
  color?: string;
  sz?: number;
  style?: string;
  caps?: boolean;
}

export function buildDocxParts(resume: Resume): Record<string, string> {
  const spec = templateOf(resume);
  const theme = spec.docx;
  const accent = accentOf(resume).slice(1).toUpperCase();
  const fmt = resume.design.dateFormat;
  const page = PAGE_SIZES[resume.design.pageSize];
  const pgW = Math.round(page.width * 20);
  const pgH = Math.round(page.height * 20);
  const marginX = MARGIN_PT[resume.design.margins] * 20;
  const tabPos = pgW - 2 * marginX;
  const links: string[] = [];

  const run = (t: string, o: RunOpts = {}) => {
    if (!t) return '';
    const pr =
      (o.style ? `<w:rStyle w:val="${o.style}"/>` : '') +
      (o.b ? '<w:b/><w:bCs/>' : '') +
      (o.caps ? '<w:caps/>' : '') +
      (o.color ? `<w:color w:val="${o.color}"/>` : '') +
      (o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : '');
    return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ''}<w:t xml:space="preserve">${xmlEscape(t)}</w:t></w:r>`;
  };
  const rich = (t: string, o: RunOpts = {}) =>
    parseInline(t)
      .map((s) => run(s.text, { ...o, b: o.b || s.bold }))
      .join('');
  const tab = () => '<w:r><w:tab/></w:r>';
  const link = (url: string, text: string, o: RunOpts = {}) => {
    const href = safeHref(url);
    if (!href) return run(text, o);
    const id = `rIdL${links.length + 1}`;
    links.push(`<Relationship Id="${id}" Type="${R_NS}/hyperlink" Target="${xmlEscape(href)}" TargetMode="External"/>`);
    return `<w:hyperlink r:id="${id}" w:history="1">${run(text, { ...o, style: 'Hyperlink' })}</w:hyperlink>`;
  };
  const p = (
    inner: string,
    o: { style?: string; keepNext?: boolean; bullet?: boolean; tabs?: boolean; before?: number; after?: number; center?: boolean } = {},
  ) => {
    const pr =
      (o.style ? `<w:pStyle w:val="${o.style}"/>` : '') +
      (o.keepNext ? '<w:keepNext/>' : '') +
      (o.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '') +
      (o.tabs ? `<w:tabs><w:tab w:val="right" w:pos="${tabPos}"/></w:tabs>` : '') +
      (o.before || o.after ? `<w:spacing w:before="${o.before ?? 0}" w:after="${o.after ?? 0}"/>` : '') +
      (o.center ? '<w:jc w:val="center"/>' : '');
    return `<w:p>${pr ? `<w:pPr>${pr}</w:pPr>` : ''}${inner}</w:p>`;
  };
  const sep = (inner: string[]) => inner.filter(Boolean).join(run(' · ', { color: '8C8C8C' }));
  const muted = '595959';

  const body: string[] = [];
  const b = resume.basics;
  body.push(p(run(b.name.trim() || 'Your Name', { b: true, sz: theme.nameSize * 2 }), { after: 40, center: theme.center }));
  const headline = [b.headline, b.tagline]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ');
  if (headline)
    body.push(
      p(run(headline, { sz: Math.round(theme.bodySize * 2.2), color: theme.accentHeadings ? accent : undefined }), { after: 60, center: theme.center }),
    );
  const contact = [
    run(b.location.trim()),
    run(b.phone.trim()),
    b.email.trim() ? link(b.email.trim(), b.email.trim()) : '',
    // Word has no icon slots that ATS parsers handle well, so icon styles show the label (still a hyperlink).
    ...b.links.filter((l) => l.url.trim()).map((l) => link(l.url, linkText(l, resume.design.linkStyle === 'url' ? 'url' : 'text'))),
  ];
  if (contact.some(Boolean)) body.push(p(sep(contact), { center: theme.center }));

  const titleLine = (main: string, rest: string, date: string, first: boolean) =>
    p(run(main.trim(), { b: true }) + (rest.trim() ? run(`, ${rest.trim()}`) : '') + (date ? tab() + run(date, { color: muted }) : ''), {
      tabs: true,
      keepNext: true,
      before: first ? 0 : 120,
    });
  const metaLine = (parts: string[]) => (parts.some(Boolean) ? p(sep(parts), { keepNext: true }) : '');
  const bullets = (list: { text: string }[]) => list.filter((x) => x.text.trim()).forEach((x) => body.push(p(rich(x.text.trim()), { bullet: true })));
  const metaRun = (t: string) => (t.trim() ? run(t.trim(), { color: muted }) : '');
  const metaLink = (url: string) => (url.trim() ? link(url, displayUrl(url), { color: muted }) : '');

  const renderSection = (s: Section) => {
    if (s.kind === 'summary') {
      if (!s.content.trim()) return;
      body.push(p(run(s.title.trim()), { style: 'Heading1' }));
      s.content
        .split(/\n+/)
        .filter((t) => t.trim())
        .forEach((t) => body.push(p(rich(t.trim()))));
      return;
    }
    const items = s.items.filter((i) => i.visible);
    if (!items.length) return;
    body.push(p(run(s.title.trim()), { style: 'Heading1' }));
    items.forEach((it, i) => {
      const first = i === 0;
      switch (s.kind) {
        case 'experience':
          if ('role' in it) {
            body.push(titleLine(it.role, it.organization, formatDateRange(it, fmt), first), metaLine([metaRun(it.location), metaLink(it.url)]));
            bullets(it.bullets);
          }
          break;
        case 'education':
          if ('degree' in it) {
            body.push(
              titleLine(it.degree || it.institution, it.degree ? it.institution : '', formatDateRange(it, fmt), first),
              metaLine([metaRun(it.location), metaRun(it.score)]),
            );
            bullets(it.bullets);
          }
          break;
        case 'projects':
          if ('stack' in it) {
            body.push(
              titleLine(it.name, it.subtitle, formatDateRange(it, fmt), first),
              metaLine([metaLink(it.url), it.stack.trim() ? metaRun(`Stack: ${it.stack}`) : '']),
            );
            bullets(it.bullets);
          }
          break;
        case 'skills':
          if ('keywords' in it) body.push(p((it.label.trim() ? run(`${it.label.trim()}: `, { b: true }) : '') + run(it.keywords.trim())));
          break;
        case 'certifications':
          if ('issuer' in it) body.push(titleLine(it.name, it.issuer, it.date ? formatPartialDate(it.date, fmt) : '', first), metaLine([metaLink(it.url)]));
          break;
        case 'custom':
          if ('description' in it) {
            if (s.kind === 'custom' && s.layout === 'compact') {
              const date = formatDateRange(it, fmt);
              body.push(
                p(
                  run(it.title.trim(), { b: true }) +
                    (it.subtitle.trim() ? run(` — ${it.subtitle.trim()}`) : '') +
                    (it.description.trim() ? run(' — ') + rich(it.description.trim()) : '') +
                    (it.url.trim() ? run('  ') + link(it.url, displayUrl(it.url)) : '') +
                    (date ? tab() + run(date, { color: muted }) : ''),
                  { tabs: true },
                ),
              );
            } else {
              body.push(titleLine(it.title, it.subtitle, formatDateRange(it, fmt), first), metaLine([metaRun(it.location), metaLink(it.url)]));
              if (it.description.trim()) body.push(p(rich(it.description.trim())));
              bullets(it.bullets);
            }
          }
          break;
      }
    });
  };
  resume.sections.filter((s) => s.visible).forEach(renderSection);

  const font = xmlEscape(theme.font);
  const headingFont = xmlEscape(theme.headingFont);
  const bodySz = Math.round(theme.bodySize * 2);
  const headingColor = theme.accentHeadings ? accent : '000000';
  const mPt = MARGIN_PT[resume.design.margins];

  const documentXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<w:document xmlns:w="${W_NS}" xmlns:r="${R_NS}"><w:body>${body.filter(Boolean).join('')}` +
    `<w:sectPr><w:pgSz w:w="${pgW}" w:h="${pgH}"/><w:pgMar w:top="${Math.round(mPt * 16)}" w:right="${marginX}" w:bottom="${Math.round(mPt * 16)}" w:left="${marginX}" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>` +
    '</w:body></w:document>';

  const stylesXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<w:styles xmlns:w="${W_NS}">` +
    `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="${font}" w:cs="${font}"/><w:sz w:val="${bodySz}"/><w:szCs w:val="${bodySz}"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault>` +
    '<w:pPrDefault><w:pPr><w:spacing w:after="20" w:line="252" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>' +
    `<w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="${headingColor}"/></w:pBdr><w:spacing w:before="220" w:after="80"/><w:outlineLvl w:val="0"/></w:pPr>` +
    `<w:rPr><w:rFonts w:ascii="${headingFont}" w:hAnsi="${headingFont}"/><w:b/><w:bCs/><w:caps/><w:color w:val="${headingColor}"/><w:sz w:val="${Math.round(theme.headingSize * 2)}"/><w:szCs w:val="${Math.round(theme.headingSize * 2)}"/></w:rPr></w:style>` +
    `<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="${theme.accentHeadings ? accent : '1F4E79'}"/><w:u w:val="single"/></w:rPr></w:style>` +
    '</w:styles>';

  const numberingXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<w:numbering xmlns:w="${W_NS}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>` +
    '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/>' +
    `<w:pPr><w:ind w:left="300" w:hanging="220"/></w:pPr><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/></w:rPr></w:lvl></w:abstractNum>` +
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';

  const docRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    `<Relationship Id="rIdS" Type="${R_NS}/styles" Target="styles.xml"/>` +
    `<Relationship Id="rIdN" Type="${R_NS}/numbering" Target="numbering.xml"/>` +
    `${links.join('')}</Relationships>`;

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
    '</Types>';

  const rootRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    `<Relationship Id="rId1" Type="${R_NS}/officeDocument" Target="word/document.xml"/>` +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    `<Relationship Id="rId3" Type="${R_NS}/extended-properties" Target="docProps/app.xml"/>` +
    '</Relationships>';

  const name = b.name.trim() || 'Résumé';
  const core =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    `<dc:title>${xmlEscape(`${name} – Résumé`)}</dc:title><dc:creator>${xmlEscape(name)}</dc:creator><dc:subject>${xmlEscape(b.headline)}</dc:subject>` +
    '</cp:coreProperties>';
  const app =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Resume Creator</Application></Properties>';

  return {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rootRels,
    'docProps/core.xml': core,
    'docProps/app.xml': app,
    'word/document.xml': documentXml,
    'word/styles.xml': stylesXml,
    'word/numbering.xml': numberingXml,
    'word/_rels/document.xml.rels': docRels,
  };
}

export async function zipDocx(JSZip: typeof JSZipType, parts: Record<string, string>, type: 'blob' | 'uint8array' = 'blob') {
  const zip = new JSZip();
  for (const [path, xml] of Object.entries(parts)) zip.file(path, xml);
  return zip.generateAsync({ type, compression: 'DEFLATE', mimeType: DOCX_MIME });
}

export async function buildDocxBlob(resume: Resume): Promise<Blob> {
  const mod: { default?: typeof JSZipType } & Partial<typeof JSZipType> = await import('jszip');
  const JSZip = (mod.default ?? mod) as typeof JSZipType;
  return (await zipDocx(JSZip, buildDocxParts(resume), 'blob')) as Blob;
}
