import type { TemplateId } from '../../domain/schema';
import type { Palette, TemplateSpec } from './types';

/** Mixes a hex colour with black (amount > 0) or white (amount < 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 0 : 255;
  const a = Math.abs(amount);
  const ch = (v: number) =>
    Math.round(v + (target - v) * a)
      .toString(16)
      .padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

const neutral = (accent: string, over: Partial<Palette> = {}): Palette => ({
  ink: '#111418',
  body: '#2b2f36',
  muted: '#5f6670',
  faint: '#9aa1ab',
  rule: '#d9dde3',
  accent,
  link: shade(accent, 0.12),
  ...over,
});

/** The original design from mohitstack.vercel.app: mono display type, warm palette, accent bars. */
const signature: TemplateSpec = {
  id: 'signature',
  name: 'Signature',
  description: 'Mono display type and warm accents. Distinctive, still single-column and ATS-safe.',
  defaultAccent: '#d9622b',
  accents: ['#d9622b', '#b5451a', '#2f6f5e', '#3b4c8c', '#7a3e8c'],
  palette: (accent) => ({
    ink: '#0a0a0a',
    body: '#24211d',
    muted: '#6d675e',
    faint: '#a59e93',
    rule: '#e2ddd4',
    accent,
    link: shade(accent, 0.18),
  }),
  docx: { font: 'Calibri', headingFont: 'Calibri', nameSize: 18, bodySize: 10.5, headingSize: 11, center: false, accentHeadings: true },
  faces: {
    body: 'gsf-400',
    bold: 'gsf-600',
    name: 'disket-700',
    headline: 'gsf-600',
    label: 'disket-700',
    date: 'disket-400',
    title: 'gsf-600',
    projectName: 'disket-700',
  },
  header: {
    align: 'left',
    nameSize: 23,
    nameCs: -0.7,
    nameUpper: true,
    headlineSize: 10.6,
    headlineColor: 'ink',
    taglineAccent: true,
    contactLinks: 'plain',
    contactSize: 8.6,
    separator: '  ·  ',
    rule: false,
  },
  section: { variant: 'signature', color: 'body', labelSize: 7.6, labelCs: 1.05, upper: true, before: 11, after: 7 },
  entry: {
    titleSize: 10,
    separator: ' — ',
    dateSize: 7.2,
    dateUpper: true,
    dateCs: 0.55,
    metaSize: 8.5,
    gap: 8.5,
    numberProjects: true,
    projectNameUpper: true,
  },
  text: { size: 9.1, lineHeight: 12.6, bullet: '•', bulletAccent: true, bulletIndent: 10.5, bulletGap: 0.4 },
};

/** Conservative serif layout for strict portals and traditional industries. */
const classic: TemplateSpec = {
  id: 'classic',
  name: 'Classic',
  description: 'Centred serif header and ruled headings. The safest choice for strict ATS portals.',
  defaultAccent: '#1f3a5f',
  accents: ['#1f3a5f', '#111111', '#7a1f2b', '#1f4d3a', '#4a3b2a'],
  palette: (accent) => neutral(accent, { ink: '#111111', body: '#222222', muted: '#555555' }),
  docx: { font: 'Georgia', headingFont: 'Georgia', nameSize: 20, bodySize: 10.5, headingSize: 11, center: true, accentHeadings: true },
  faces: {
    body: 'sserif-400',
    bold: 'sserif-600',
    name: 'sserif-600',
    headline: 'sserif-400',
    label: 'sserif-600',
    date: 'sserif-400',
    title: 'sserif-600',
    projectName: 'sserif-600',
  },
  header: {
    align: 'center',
    nameSize: 22,
    nameCs: 0.3,
    nameUpper: false,
    headlineSize: 11,
    headlineColor: 'muted',
    taglineAccent: false,
    contactLinks: 'plain',
    contactSize: 9,
    separator: '  |  ',
    rule: false,
  },
  section: { variant: 'underline', color: 'accent', labelSize: 10.2, labelCs: 0.9, upper: true, before: 12, after: 5 },
  entry: {
    titleSize: 10.4,
    separator: ', ',
    dateSize: 9.4,
    dateUpper: false,
    dateCs: 0,
    metaSize: 9.2,
    gap: 7,
    numberProjects: false,
    projectNameUpper: false,
  },
  text: { size: 9.9, lineHeight: 13, bullet: '•', bulletAccent: false, bulletIndent: 11, bulletGap: 1.2 },
};

/** Clean sans-serif with a colour accent. */
const modern: TemplateSpec = {
  id: 'modern',
  name: 'Modern',
  description: 'Crisp Inter type with an accent colour. Balanced for tech and product roles.',
  defaultAccent: '#2457c5',
  accents: ['#2457c5', '#0f766e', '#6d28d9', '#b42318', '#334155'],
  palette: (accent) => neutral(accent),
  docx: { font: 'Calibri', headingFont: 'Calibri', nameSize: 20, bodySize: 10.5, headingSize: 10.5, center: false, accentHeadings: true },
  faces: {
    body: 'inter-400',
    bold: 'inter-600',
    name: 'inter-700',
    headline: 'inter-600',
    label: 'inter-700',
    date: 'inter-400',
    title: 'inter-600',
    projectName: 'inter-600',
  },
  header: {
    align: 'left',
    nameSize: 24,
    nameCs: -0.4,
    nameUpper: false,
    headlineSize: 11.5,
    headlineColor: 'accent',
    taglineAccent: false,
    contactLinks: 'colored',
    contactSize: 8.8,
    separator: '  ·  ',
    rule: false,
  },
  section: { variant: 'accent', color: 'accent', labelSize: 8.6, labelCs: 1.1, upper: true, before: 13, after: 6 },
  entry: {
    titleSize: 10.2,
    separator: ' · ',
    dateSize: 8.6,
    dateUpper: false,
    dateCs: 0,
    metaSize: 8.6,
    gap: 8,
    numberProjects: false,
    projectNameUpper: false,
  },
  text: { size: 9.3, lineHeight: 13.1, bullet: '•', bulletAccent: true, bulletIndent: 11, bulletGap: 1.4 },
};

/** Dense layout that maximises content per page. */
const compact: TemplateSpec = {
  id: 'compact',
  name: 'Compact',
  description: 'Tighter type and spacing for long careers. Fits more on each page.',
  defaultAccent: '#0e7490',
  accents: ['#0e7490', '#334155', '#9a3412', '#4d7c0f', '#1d4ed8'],
  palette: (accent) => neutral(accent),
  docx: { font: 'Arial', headingFont: 'Arial', nameSize: 16, bodySize: 9.5, headingSize: 10, center: false, accentHeadings: false },
  faces: {
    body: 'ssans-400',
    bold: 'ssans-600',
    name: 'ssans-600',
    headline: 'ssans-600',
    label: 'ssans-600',
    date: 'ssans-400',
    title: 'ssans-600',
    projectName: 'ssans-600',
  },
  header: {
    align: 'left',
    nameSize: 19,
    nameCs: 0,
    nameUpper: false,
    headlineSize: 10.4,
    headlineColor: 'accent',
    taglineAccent: false,
    contactLinks: 'colored',
    contactSize: 8.6,
    separator: '  ·  ',
    rule: true,
  },
  section: { variant: 'inline-rule', color: 'ink', labelSize: 8.8, labelCs: 0.9, upper: true, before: 9, after: 3.5 },
  entry: {
    titleSize: 9.8,
    separator: ' — ',
    dateSize: 8.6,
    dateUpper: false,
    dateCs: 0,
    metaSize: 8.4,
    gap: 5,
    numberProjects: false,
    projectNameUpper: false,
  },
  text: { size: 9.2, lineHeight: 11.7, bullet: '•', bulletAccent: false, bulletIndent: 9, bulletGap: 0.6 },
};

export const TEMPLATES: Record<TemplateId, TemplateSpec> = { signature, classic, modern, compact };
export const TEMPLATE_LIST: TemplateSpec[] = [modern, classic, signature, compact];
