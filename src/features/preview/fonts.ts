/** Browser font loading: fetches TTFs once, registers them for SVG preview text. */
import { FontLoader, type FontSet } from '../../engine/fonts/loader';
import type { FaceId } from '../../engine/fonts/registry';

const base = import.meta.env.BASE_URL ?? '/';

export const fontLoader = new FontLoader(async (file) => {
  const res = await fetch(`${base}fonts/${file}`);
  if (!res.ok) throw new Error(`Could not load font ${file} (${res.status})`);
  return res.arrayBuffer();
});

/** CSS family name used for a face inside the SVG preview. */
export const cssFamily = (face: FaceId) => `rc-${face}`;

const registered = new Map<FaceId, Promise<void>>();

/** Registers faces with the document so SVG <text> renders with the exact PDF font. */
export function registerFaces(fonts: FontSet): Promise<void> {
  if (typeof FontFace === 'undefined') return Promise.resolve();
  const jobs = [...fonts.values()].map((f) => {
    let p = registered.get(f.id);
    if (!p) {
      const face = new FontFace(cssFamily(f.id), f.bytes.slice(0));
      p = face.load().then((loaded) => void document.fonts.add(loaded));
      registered.set(f.id, p);
    }
    return p;
  });
  return Promise.all(jobs).then(() => undefined);
}
