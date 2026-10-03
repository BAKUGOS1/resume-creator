/**
 * Builds a flat list of blocks (lines, rules, headings) that the paginator
 * distributes over pages. Blocks carry collapsible space-before and
 * keep-with-next flags so headings never end a page alone.
 */
import type { DrawOp } from '../types';
import { breakLines, type Line, type Measurer, type Run, type TextStyle } from './text';

export interface Block {
  height: number;
  /** Ops positioned relative to the block's top-left corner of the page content box. */
  ops: DrawOp[];
  spaceBefore: number;
  keepWithNext: boolean;
}

export interface ParagraphOptions {
  lineHeight: number;
  /** Offset from the content box's left edge. */
  indent?: number;
  width?: number;
  align?: 'left' | 'center';
  /** Drawn right-aligned on the first line (e.g. dates); the text wraps before it. */
  right?: Run[];
  /** Drawn in the indent gutter on the first line (e.g. bullet markers). */
  marker?: { text: string; style: TextStyle; offset: number };
  /** "block": keep all lines together; "lines": allow breaks but avoid widows/orphans. */
  keep?: 'block' | 'lines';
}

export class Composer {
  readonly blocks: Block[] = [];
  private pending = 0;

  constructor(
    readonly m: Measurer,
    /** Absolute x of the content box (page margin). */
    readonly x: number,
    readonly width: number,
  ) {}

  /** Vertical gap before the next block; dropped when the block starts a page. */
  space(points: number): void {
    this.pending += points;
  }

  add(height: number, ops: DrawOp[], keepWithNext = false): void {
    this.blocks.push({ height, ops, spaceBefore: this.pending, keepWithNext });
    this.pending = 0;
  }

  /** Glue the most recent block to whatever comes next. */
  keepWithNext(): void {
    const last = this.blocks[this.blocks.length - 1];
    if (last) last.keepWithNext = true;
  }

  /** Ends a keep-together run (e.g. after an entry with no bullets) so it can't chain into the next entry. */
  releaseKeep(): void {
    const last = this.blocks[this.blocks.length - 1];
    if (last) last.keepWithNext = false;
  }

  measure(runs: Run[]): number {
    return runs.reduce((w, r) => w + this.m.width(r.text, r.style), 0);
  }

  lineOps(line: Line, x: number, baseline: number): DrawOp[] {
    const ops: DrawOp[] = [];
    for (const p of line.pieces) {
      if (!p.text.trim() && !p.link) continue;
      ops.push({ type: 'text', text: p.text, x: x + p.x, y: baseline, face: p.face, size: p.size, color: p.color, cs: p.cs });
      if (p.link) ops.push({ type: 'link', url: p.link, x: x + p.x, y: baseline - p.size * 0.82, w: p.width - p.cs, h: p.size * 1.08 });
    }
    return ops;
  }

  /** Lays out rich text; returns the number of lines produced. */
  paragraph(runs: Run[], o: ParagraphOptions): number {
    const indent = o.indent ?? 0;
    const width = o.width ?? this.width - indent;
    const rightWidth = o.right?.length ? this.measure(o.right) : 0;
    const gap = rightWidth ? Math.max(10, o.lineHeight) : 0;
    const lines = breakLines(runs, width - rightWidth - gap, this.m);
    if (!lines.length && !rightWidth) return 0;
    if (!lines.length) lines.push({ pieces: [], width: 0, size: o.lineHeight * 0.75 });

    const lineBlocks: { height: number; ops: DrawOp[] }[] = lines.map((line, i) => {
      const size = Math.max(line.size, i === 0 && o.right ? o.right[0]!.style.size : 0) || o.lineHeight * 0.75;
      const baseline = (o.lineHeight + size * 0.72) / 2;
      const left = this.x + indent + (o.align === 'center' ? (width - line.width) / 2 : 0);
      const ops = this.lineOps(line, left, baseline);
      if (i === 0 && o.marker) {
        const mk = breakLines([{ text: o.marker.text, style: o.marker.style }], 1e6, this.m)[0];
        if (mk) ops.unshift(...this.lineOps(mk, this.x + o.marker.offset, baseline));
      }
      if (i === 0 && o.right?.length) {
        const r = breakLines(o.right, 1e6, this.m)[0];
        if (r) ops.push(...this.lineOps(r, this.x + this.width - r.width + (r.pieces.at(-1)?.cs ?? 0), baseline));
      }
      return { height: o.lineHeight, ops };
    });

    if (o.keep === 'block' || lineBlocks.length === 1) {
      const ops: DrawOp[] = [];
      lineBlocks.forEach((lb, i) => ops.push(...shift(lb.ops, i * o.lineHeight)));
      this.add(lineBlocks.length * o.lineHeight, ops);
    } else {
      const n = lineBlocks.length;
      lineBlocks.forEach((lb, i) => this.add(lb.height, lb.ops, i === 0 || (i === n - 2 && n > 2)));
    }
    return lines.length;
  }

  /** Ops for a single unwrapped line of text, vertically centred in `lineHeight`. */
  paragraphOps(text: string, style: TextStyle, offset: number, lineHeight: number): DrawOp[] {
    const line = breakLines([{ text, style }], 1e6, this.m)[0];
    return line ? this.lineOps(line, this.x + offset, (lineHeight + style.size * 0.72) / 2) : [];
  }

  rule(color: string, width: number, height = width): void {
    this.add(height, [{ type: 'line', x1: this.x, y1: height / 2, x2: this.x + this.width, y2: height / 2, color, width }]);
  }
}

/** Moves ops down by `dy` (block-relative coordinates). */
export function shift(ops: DrawOp[], dy: number): DrawOp[] {
  if (!dy) return ops;
  return ops.map((op) =>
    op.type === 'line' ? { ...op, y1: op.y1 + dy, y2: op.y2 + dy } : op.type === 'circle' ? { ...op, cy: op.cy + dy } : { ...op, y: op.y + dy },
  );
}
