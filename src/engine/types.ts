/** Device-independent drawing primitives (PDF points, origin top-left, y = text baseline). */
import type { LinkIcon } from '../domain/schema';
import type { FaceId } from './fonts/registry';

export interface TextOp {
  type: 'text';
  text: string;
  x: number;
  y: number;
  face: FaceId;
  size: number;
  color: string;
  /** Extra space after every character (PDF charSpace / CSS letter-spacing). */
  cs: number;
}

export interface RectOp {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface LineOp {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
}

export interface LinkOp {
  type: 'link';
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
}

export interface CircleOp {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  color: string;
}

/** A contact icon (see icons.ts), drawn in a `size`-point square whose top-left is (x, y). */
export interface IconOp {
  type: 'icon';
  icon: LinkIcon;
  x: number;
  y: number;
  size: number;
  color: string;
}

export type DrawOp = TextOp | RectOp | LineOp | LinkOp | CircleOp | IconOp;

export interface PageSize {
  width: number;
  height: number;
}

export interface Page extends PageSize {
  ops: DrawOp[];
}

export interface LayoutResult {
  pages: Page[];
  /** Effective type scale after fit-to-page. */
  scale: number;
  /** False when fit-to-page was requested but the content still needs more than one page. */
  fitted: boolean;
  missingGlyphs: string[];
  facesUsed: FaceId[];
}

export const PAGE_SIZES: Record<'a4' | 'letter', PageSize> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};
