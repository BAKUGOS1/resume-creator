import { FACES, type FaceId } from './registry';
import { parseTTF, type FontMetrics } from './ttf';

export interface LoadedFace {
  id: FaceId;
  metrics: FontMetrics;
  bytes: ArrayBuffer;
}

export type FontSet = ReadonlyMap<FaceId, LoadedFace>;
export type FontFetcher = (file: string) => Promise<ArrayBuffer>;

/** Loads and caches faces. One instance per app (browser) or per test run (node). */
export class FontLoader {
  private cache = new Map<FaceId, Promise<LoadedFace>>();

  constructor(private readonly fetchFile: FontFetcher) {}

  load(id: FaceId): Promise<LoadedFace> {
    let p = this.cache.get(id);
    if (!p) {
      p = this.fetchFile(FACES[id].file).then((bytes) => ({ id, bytes, metrics: parseTTF(bytes) }));
      p.catch(() => this.cache.delete(id)); // allow retry after a network error
      this.cache.set(id, p);
    }
    return p;
  }

  async loadAll(ids: Iterable<FaceId>): Promise<Map<FaceId, LoadedFace>> {
    const list = await Promise.all([...new Set(ids)].map((id) => this.load(id)));
    return new Map(list.map((f) => [f.id, f]));
  }
}

export function toBase64(bytes: ArrayBuffer): string {
  const u8 = new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(bin);
}
