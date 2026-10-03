/** Test helper: loads fonts from public/fonts through the same loader the app uses. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FontLoader } from '../../src/engine/fonts/loader';

const dir = resolve(process.cwd(), 'public/fonts');

export const nodeFontLoader = new FontLoader(async (file) => {
  const buf = await readFile(resolve(dir, file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
});
