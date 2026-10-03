/**
 * Text measurement, font fallback and line breaking. Ported from the original
 * single-file engine (`flow`), generalised for any font and with hard breaks for
 * words longer than the line.
 */
import type { LinkIcon } from '../../domain/schema';
import type { FontSet } from '../fonts/loader';
import { FACES, type FaceId } from '../fonts/registry';

export interface TextStyle {
  face: FaceId;
  /** Face used for **bold** spans; defaults to `face`. */
  boldFace?: FaceId;
  size: number;
  color: string;
  /** Character spacing in points. */
  cs?: number;
  upper?: boolean;
}

export interface Run {
  text: string;
  style: TextStyle;
  link?: string | null;
  /** Interpret **bold** markers inside `text`. */
  rich?: boolean;
  /** Draw this icon (one em wide) instead of text; it never breaks from the text after it. */
  icon?: LinkIcon;
}

/** Advance of an inline icon, in ems; the glyph itself is ICON_BOX ems square. */
export const ICON_ADVANCE = 1.02;
export const ICON_BOX = 0.94;

/** A measured, positioned piece of one line (x relative to the line start). */
export interface Placed {
  text: string;
  x: number;
  width: number;
  face: FaceId;
  size: number;
  color: string;
  cs: number;
  link: string | null;
  icon?: LinkIcon;
}

export interface Line {
  pieces: Placed[];
  width: number;
  /** Largest font size on the line (for baseline placement). */
  size: number;
}

// eslint-disable-next-line no-control-regex -- stripping control characters is the point
const CONTROL_RE = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200D\u2028\u2029\uFEFF\uFFFE\uFFFF]/g;

/** Normalises user text for layout: no control chars, tabs/newlines become spaces. */
export function cleanText(text: string): string {
  return text.replace(CONTROL_RE, '').replace(/[\t\r\n]+/g, ' ');
}

/** Splits "**bold** text" into spans. Unbalanced markers are kept literally. */
export function parseInline(text: string): { text: string; bold: boolean }[] {
  const parts = text.split('**');
  if (parts.length % 2 === 0) return [{ text, bold: false }];
  return parts.map((t, i) => ({ text: t, bold: i % 2 === 1 })).filter((p) => p.text);
}

export class Measurer {
  readonly missing = new Set<string>();
  private cache = new Map<string, number>();

  constructor(private readonly fonts: FontSet) {}

  /** Face that can render `cp`, walking the fallback chain; null if none can. */
  faceFor(cp: number, face: FaceId): FaceId | null {
    for (let cur: FaceId | null = face; cur; cur = FACES[cur].fallback) {
      const f = this.fonts.get(cur);
      if (f?.metrics.has(cp)) return cur;
    }
    return null;
  }

  /** Splits text into runs of a single renderable face. Unrenderable characters become "?". */
  segments(text: string, face: FaceId): { text: string; face: FaceId }[] {
    const out: { text: string; face: FaceId }[] = [];
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      let f = cp === 0x20 || cp === 0xa0 ? face : this.faceFor(cp, face);
      let c = ch;
      if (!f) {
        this.missing.add(ch);
        f = face;
        c = '?';
      }
      const last = out[out.length - 1];
      if (last && last.face === f) last.text += c;
      else out.push({ text: c, face: f });
    }
    return out;
  }

  /** Width in points of text already resolved to a single face. */
  faceWidth(text: string, face: FaceId, size: number, cs = 0): number {
    const key = `${face}|${text}`;
    let em = this.cache.get(key);
    if (em === undefined) {
      const m = this.fonts.get(face)?.metrics;
      em = 0;
      if (m) for (const ch of text) em += m.advance(ch.codePointAt(0)!) ?? m.advance(0x3f) ?? 0.5;
      this.cache.set(key, em);
    }
    return em * size + cs * [...text].length;
  }

  width(text: string, style: TextStyle, bold = false): number {
    const face = bold ? (style.boldFace ?? style.face) : style.face;
    const t = style.upper ? text.toUpperCase() : text;
    return this.segments(t, face).reduce((w, s) => w + this.faceWidth(s.text, s.face, style.size, style.cs ?? 0), 0);
  }
}

interface TokenPart {
  text: string;
  style: TextStyle;
  bold: boolean;
  link: string | null;
  width: number;
  icon?: LinkIcon;
}

interface Token {
  space: boolean;
  parts: TokenPart[];
  width: number;
}

/** Appends a non-space part, gluing it to a preceding non-space token. */
function pushPart(tokens: Token[], part: TokenPart, space: boolean): void {
  const last = tokens[tokens.length - 1];
  if (!space && last && !last.space) {
    last.parts.push(part);
    last.width += part.width;
  } else tokens.push({ space, parts: [part], width: part.width });
}

function tokenize(runs: Run[], m: Measurer): Token[] {
  const tokens: Token[] = [];
  for (const run of runs) {
    if (run.icon) {
      pushPart(tokens, { text: '', style: run.style, bold: false, link: run.link ?? null, width: run.style.size * ICON_ADVANCE, icon: run.icon }, false);
      continue;
    }
    const text = cleanText(run.style.upper ? run.text.toUpperCase() : run.text);
    const spans = run.rich ? parseInline(text) : [{ text, bold: false }];
    for (const span of spans) {
      for (const piece of span.text.split(/( +)/)) {
        if (!piece) continue;
        const part = { text: piece, style: run.style, bold: span.bold, link: run.link ?? null, width: m.width(piece, run.style, span.bold) };
        pushPart(tokens, part, /^ +$/.test(piece));
      }
    }
  }
  return tokens;
}

/** Splits a token that is wider than the line into character chunks that fit. */
function hardBreak(token: Token, width: number, m: Measurer): Token[] {
  const out: Token[] = [];
  let cur: Token = { space: false, parts: [], width: 0 };
  for (const part of token.parts) {
    if (part.icon) {
      if (cur.width + part.width > width && cur.parts.length) {
        out.push(cur);
        cur = { space: false, parts: [], width: 0 };
      }
      cur.parts.push(part);
      cur.width += part.width;
      continue;
    }
    for (const ch of part.text) {
      const w = m.width(ch, part.style, part.bold);
      if (cur.width + w > width && cur.parts.length) {
        out.push(cur);
        cur = { space: false, parts: [], width: 0 };
      }
      const last = cur.parts[cur.parts.length - 1];
      if (last && last.style === part.style && last.bold === part.bold && last.link === part.link) {
        last.text += ch;
        last.width += w;
      } else cur.parts.push({ ...part, text: ch, width: w });
      cur.width += w;
    }
  }
  if (cur.parts.length) out.push(cur);
  return out;
}

/** Greedy line breaking at spaces; returns positioned pieces per line. */
export function breakLines(runs: Run[], width: number, m: Measurer): Line[] {
  const tokens = tokenize(runs, m).flatMap((t) => (!t.space && t.width > width ? hardBreak(t, width, m) : [t]));
  const lines: Token[][] = [];
  let line: Token[] = [];
  let lw = 0;
  for (const t of tokens) {
    if (t.space) {
      if (line.length) {
        line.push(t);
        lw += t.width;
      }
      continue;
    }
    if (line.length && lw + t.width > width + 0.01) {
      while (line.length && line[line.length - 1]!.space) lw -= line.pop()!.width;
      lines.push(line);
      line = [];
      lw = 0;
    }
    line.push(t);
    lw += t.width;
  }
  while (line.length && line[line.length - 1]!.space) line.pop();
  if (line.length) lines.push(line);

  return lines.map((tokensOnLine) => {
    const pieces: Placed[] = [];
    let x = 0;
    let size = 0;
    for (const part of tokensOnLine.flatMap((t) => t.parts)) {
      const face = part.bold ? (part.style.boldFace ?? part.style.face) : part.style.face;
      size = Math.max(size, part.style.size);
      if (part.icon) {
        pieces.push({ text: '', x, width: part.width, face, size: part.style.size, color: part.style.color, cs: 0, link: part.link, icon: part.icon });
        x += part.width;
        continue;
      }
      for (const seg of m.segments(part.text, face)) {
        const w = m.faceWidth(seg.text, seg.face, part.style.size, part.style.cs ?? 0);
        const prev = pieces[pieces.length - 1];
        const cs = part.style.cs ?? 0;
        if (prev && prev.face === seg.face && prev.size === part.style.size && prev.color === part.style.color && prev.cs === cs && prev.link === part.link) {
          prev.text += seg.text;
          prev.width += w;
        } else pieces.push({ text: seg.text, x, width: w, face: seg.face, size: part.style.size, color: part.style.color, cs, link: part.link });
        x += w;
      }
    }
    return { pieces, width: x, size };
  });
}
