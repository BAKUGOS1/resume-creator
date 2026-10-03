/**
 * Minimal TrueType reader: advance widths and the Unicode cmap. Widths are
 * computed exactly like jsPDF (advance / unitsPerEm, no kerning), so the
 * on-screen layout and the PDF break lines at the same places.
 */
export interface FontMetrics {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  /** Advance width in em for a code point, or null when the font has no glyph. */
  advance(codePoint: number): number | null;
  has(codePoint: number): boolean;
}

export function parseTTF(buffer: ArrayBuffer): FontMetrics {
  const view = new DataView(buffer);
  const numTables = view.getUint16(4);
  const tables = new Map<string, number>();
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(view.getUint8(rec), view.getUint8(rec + 1), view.getUint8(rec + 2), view.getUint8(rec + 3));
    tables.set(tag, view.getUint32(rec + 8));
  }
  const table = (tag: string) => {
    const off = tables.get(tag);
    if (off === undefined) throw new Error(`Font is missing the ${tag} table`);
    return off;
  };

  const unitsPerEm = view.getUint16(table('head') + 18);
  const hhea = table('hhea');
  const ascent = view.getInt16(hhea + 4);
  const descent = view.getInt16(hhea + 6);
  const numberOfHMetrics = view.getUint16(hhea + 34);
  const hmtx = table('hmtx');
  const advanceOf = (gid: number) => view.getUint16(hmtx + 4 * Math.min(gid, numberOfHMetrics - 1));

  const glyphs = readCmap(view, table('cmap'));
  return {
    unitsPerEm,
    ascent: ascent / unitsPerEm,
    descent: descent / unitsPerEm,
    has: (cp) => (glyphs.get(cp) ?? 0) !== 0,
    advance: (cp) => {
      const gid = glyphs.get(cp);
      return gid ? advanceOf(gid) / unitsPerEm : null;
    },
  };
}

function readCmap(view: DataView, cmap: number): Map<number, number> {
  const map = new Map<number, number>();
  const count = view.getUint16(cmap + 2);
  let best = -1;
  let bestFormat = 0;
  for (let i = 0; i < count; i++) {
    const rec = cmap + 4 + i * 8;
    const platform = view.getUint16(rec);
    const encoding = view.getUint16(rec + 2);
    const offset = cmap + view.getUint32(rec + 4);
    const format = view.getUint16(offset);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (unicode && (format === 12 || (format === 4 && bestFormat !== 12))) {
      best = offset;
      bestFormat = format;
    }
  }
  if (best < 0) throw new Error('Font has no Unicode cmap');

  if (bestFormat === 4) {
    const segX2 = view.getUint16(best + 6);
    const ends = best + 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const ranges = deltas + segX2;
    for (let s = 0; s < segX2; s += 2) {
      const end = view.getUint16(ends + s);
      const start = view.getUint16(starts + s);
      const delta = view.getInt16(deltas + s);
      const rangeOffset = view.getUint16(ranges + s);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let gid: number;
        if (rangeOffset === 0) gid = (c + delta) & 0xffff;
        else {
          const g = view.getUint16(ranges + s + rangeOffset + 2 * (c - start));
          gid = g === 0 ? 0 : (g + delta) & 0xffff;
        }
        if (gid) map.set(c, gid);
      }
    }
  } else {
    const groups = view.getUint32(best + 12);
    for (let g = 0; g < groups; g++) {
      const rec = best + 16 + g * 12;
      const start = view.getUint32(rec);
      const end = view.getUint32(rec + 4);
      const gid = view.getUint32(rec + 8);
      for (let c = start; c <= end; c++) map.set(c, gid + (c - start));
    }
  }
  return map;
}
