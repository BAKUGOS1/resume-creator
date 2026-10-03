import type { DrawOp, Page, PageSize } from '../types';
import { shift, type Block } from './composer';

export interface PageFrame extends PageSize {
  top: number;
  bottom: number;
}

/**
 * Places blocks on pages. Chains of keep-with-next blocks move to a new page
 * together when they don't fit (unless the chain is taller than a whole page).
 * Space-before collapses at the top of a page.
 */
export function paginate(blocks: Block[], frame: PageFrame): Page[] {
  const pages: DrawOp[][] = [[]];
  const limit = frame.height - frame.bottom;
  const capacity = limit - frame.top;
  let y = frame.top;

  const newPage = () => {
    pages.push([]);
    y = frame.top;
  };
  const place = (b: Block) => {
    let gap = y === frame.top ? 0 : b.spaceBefore;
    if (y + gap + b.height > limit + 0.01 && y > frame.top) {
      newPage();
      gap = 0;
    }
    y += gap;
    pages[pages.length - 1]!.push(...shift(b.ops, y));
    y += b.height;
  };

  for (let i = 0; i < blocks.length;) {
    let j = i;
    while (j < blocks.length - 1 && blocks[j]!.keepWithNext) j++;
    let chain = blocks[i]!.height;
    for (let k = i + 1; k <= j; k++) chain += blocks[k]!.spaceBefore + blocks[k]!.height;
    const lead = y === frame.top ? 0 : blocks[i]!.spaceBefore;
    if (y > frame.top && y + lead + chain > limit + 0.01 && chain <= capacity) newPage();
    for (let k = i; k <= j; k++) place(blocks[k]!);
    i = j + 1;
  }

  return pages.map((ops) => ({ width: frame.width, height: frame.height, ops }));
}
