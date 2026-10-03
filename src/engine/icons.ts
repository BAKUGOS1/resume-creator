/**
 * Contact-link icons: original monoline glyphs on a 24×24 grid, drawn with a
 * 2-unit round stroke. Paths use only absolute M/L/C/Z so every renderer
 * (SVG preview, vector PDF, HTML export) can draw them from the same data.
 */
import type { LinkIcon } from '../domain/schema';

export type IconShape = { d: string } | { circle: [cx: number, cy: number, r: number] } | { rect: [x: number, y: number, w: number, h: number, r: number] };

export const ICON_STROKE = 2;

export const ICONS: Record<LinkIcon, { name: string; shapes: IconShape[] }> = {
  globe: {
    name: 'Globe',
    shapes: [{ circle: [12, 12, 10] }, { d: 'M2 12 L22 12' }, { d: 'M12 2 C15 5 16 8.5 16 12 C16 15.5 15 19 12 22 C9 19 8 15.5 8 12 C8 8.5 9 5 12 2 Z' }],
  },
  briefcase: {
    name: 'Briefcase',
    shapes: [{ rect: [2, 7, 20, 14, 2] }, { d: 'M8 7 L8 5 C8 3.9 8.9 3 10 3 L14 3 C15.1 3 16 3.9 16 5 L16 7' }, { d: 'M2 13 L22 13' }],
  },
  profile: {
    name: 'Profile',
    shapes: [{ rect: [3, 3, 18, 18, 3] }, { circle: [12, 10, 3] }, { d: 'M7 18 C7.8 15.6 9.7 14.5 12 14.5 C14.3 14.5 16.2 15.6 17 18' }],
  },
  repo: {
    name: 'Repository',
    shapes: [{ circle: [6, 5, 2.5] }, { circle: [6, 19, 2.5] }, { circle: [18, 7, 2.5] }, { d: 'M6 7.5 L6 16.5' }, { d: 'M18 9.5 C18 14 12.5 14.5 8.2 17.6' }],
  },
  code: {
    name: 'Code',
    shapes: [{ d: 'M8 6 L2 12 L8 18' }, { d: 'M16 6 L22 12 L16 18' }, { d: 'M14 3.5 L10 20.5' }],
  },
  pen: {
    name: 'Pen',
    shapes: [
      { d: 'M4 20 L4 16.5 L15.5 5 C16.3 4.2 17.7 4.2 18.5 5 L19 5.5 C19.8 6.3 19.8 7.7 19 8.5 L7.5 20 Z' },
      { d: 'M13.5 7 L17 10.5' },
      { d: 'M13 20 L20 20' },
    ],
  },
  mail: {
    name: 'Email',
    shapes: [{ rect: [2, 4, 20, 16, 2] }, { d: 'M3 6.5 L12 13 L21 6.5' }],
  },
  phone: {
    name: 'Phone',
    shapes: [{ rect: [6, 2, 12, 20, 2.5] }, { d: 'M11 18 L13 18' }],
  },
  pin: {
    name: 'Location',
    shapes: [{ d: 'M12 22 C12 22 4.5 15 4.5 9.5 C4.5 5.4 7.9 2 12 2 C16.1 2 19.5 5.4 19.5 9.5 C19.5 15 12 22 12 22 Z' }, { circle: [12, 9.5, 2.75] }],
  },
  chat: {
    name: 'Chat',
    shapes: [
      { d: 'M4 4 L20 4 C21.1 4 22 4.9 22 6 L22 15 C22 16.1 21.1 17 20 17 L9.5 17 L5 21 L5 17 L4 17 C2.9 17 2 16.1 2 15 L2 6 C2 4.9 2.9 4 4 4 Z' },
      { d: 'M7 9 L17 9' },
      { d: 'M7 12.5 L13 12.5' },
    ],
  },
  image: {
    name: 'Image',
    shapes: [{ rect: [2, 3, 20, 18, 2] }, { circle: [8.5, 8.5, 2] }, { d: 'M21 15.5 L16 10.5 L5 21' }],
  },
  play: {
    name: 'Video',
    shapes: [{ rect: [2, 4.5, 20, 15, 3.5] }, { d: 'M10 9 L15.5 12 L10 15 Z' }],
  },
  book: {
    name: 'Book',
    shapes: [{ d: 'M2 5 C5 3.8 8.5 3.8 12 5.5 C15.5 3.8 19 3.8 22 5 L22 19.5 C19 18.3 15.5 18.3 12 20 C8.5 18.3 5 18.3 2 19.5 Z' }, { d: 'M12 5.5 L12 20' }],
  },
  external: {
    name: 'Link',
    shapes: [
      { d: 'M14 3 L21 3 L21 10' },
      { d: 'M21 3 L11 13' },
      { d: 'M18 14 L18 19 C18 20.1 17.1 21 16 21 L5 21 C3.9 21 3 20.1 3 19 L3 8 C3 6.9 3.9 6 5 6 L10 6' },
    ],
  },
  star: { name: 'Star', shapes: [{ d: 'M12 2.5 L14.9 8.6 L21.5 9.3 L16.6 13.8 L18 20.4 L12 17 L6 20.4 L7.4 13.8 L2.5 9.3 L9.1 8.6 Z' }] },
  calendar: {
    name: 'Calendar',
    shapes: [{ rect: [3, 4.5, 18, 16.5, 2] }, { d: 'M3 9.5 L21 9.5' }, { d: 'M8 2.5 L8 6.5' }, { d: 'M16 2.5 L16 6.5' }],
  },
  mic: {
    name: 'Podcast',
    shapes: [{ rect: [9, 2, 6, 12, 3] }, { d: 'M5 11 C5 14.9 8.1 18 12 18 C15.9 18 19 14.9 19 11' }, { d: 'M12 18 L12 22' }],
  },
  camera: {
    name: 'Camera',
    shapes: [
      { d: 'M3 8 C3 6.9 3.9 6 5 6 L7.5 6 L9 3.5 L15 3.5 L16.5 6 L19 6 C20.1 6 21 6.9 21 8 L21 18 C21 19.1 20.1 20 19 20 L5 20 C3.9 20 3 19.1 3 18 Z' },
      { circle: [12, 12.5, 3.5] },
    ],
  },
};

/** Fixed-icon glyphs for the contact fields that aren't links. */
export const FIELD_ICONS = { location: 'pin', phone: 'phone', email: 'mail' } as const satisfies Record<string, LinkIcon>;

export type PathCommand = { op: 'm' | 'l'; c: [number, number] } | { op: 'c'; c: [number, number, number, number, number, number] } | { op: 'h'; c: [] };

/** Parses the restricted path syntax (absolute M, L, C, Z). */
export function parsePath(d: string): PathCommand[] {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/gi) ?? [];
  const out: PathCommand[] = [];
  let i = 0;
  const n = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++]!.toUpperCase();
    if (cmd === 'M') out.push({ op: 'm', c: [n(), n()] });
    else if (cmd === 'L') out.push({ op: 'l', c: [n(), n()] });
    else if (cmd === 'C') out.push({ op: 'c', c: [n(), n(), n(), n(), n(), n()] });
    else if (cmd === 'Z') out.push({ op: 'h', c: [] });
    else throw new Error(`Unsupported path command ${cmd}`);
  }
  return out;
}

const K = 0.5523; // cubic Bézier approximation of a quarter circle

/** A rounded rectangle as path commands (for renderers without one). */
export function roundedRectPath(x: number, y: number, w: number, h: number, r: number): PathCommand[] {
  const k = r * K;
  return [
    { op: 'm', c: [x + r, y] },
    { op: 'l', c: [x + w - r, y] },
    { op: 'c', c: [x + w - r + k, y, x + w, y + r - k, x + w, y + r] },
    { op: 'l', c: [x + w, y + h - r] },
    { op: 'c', c: [x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h] },
    { op: 'l', c: [x + r, y + h] },
    { op: 'c', c: [x + r - k, y + h, x, y + h - r + k, x, y + h - r] },
    { op: 'l', c: [x, y + r] },
    { op: 'c', c: [x, y + r - k, x + r - k, y, x + r, y] },
    { op: 'h', c: [] },
  ];
}

const attr = (n: number) => String(Math.round(n * 1000) / 1000);

/** Standalone inline SVG markup (HTML export). Decorative: hidden from assistive tech. */
export function iconSvg(icon: LinkIcon, className = 'cv-icon'): string {
  const body = ICONS[icon].shapes
    .map((s) =>
      'd' in s
        ? `<path d="${s.d}"/>`
        : 'circle' in s
          ? `<circle cx="${attr(s.circle[0])}" cy="${attr(s.circle[1])}" r="${attr(s.circle[2])}"/>`
          : `<rect x="${attr(s.rect[0])}" y="${attr(s.rect[1])}" width="${attr(s.rect[2])}" height="${attr(s.rect[3])}" rx="${attr(s.rect[4])}"/>`,
    )
    .join('');
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${ICON_STROKE}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
