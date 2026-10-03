/**
 * Font faces shipped in /public/fonts (built by scripts/build-fonts.py).
 * Each face falls back to a wider-coverage face for characters it lacks.
 */
export const FACES = {
  'gsf-400': { file: 'gsf-400.ttf', family: 'Google Sans Flex', weight: 400, fallback: 'noto-400' },
  'gsf-600': { file: 'gsf-600.ttf', family: 'Google Sans Flex', weight: 600, fallback: 'noto-700' },
  'disket-400': { file: 'disket-400.ttf', family: 'Disket Mono', weight: 400, fallback: 'jbmono-400' },
  'disket-700': { file: 'disket-700.ttf', family: 'Disket Mono', weight: 700, fallback: 'jbmono-700' },
  'inter-400': { file: 'inter-400.ttf', family: 'Inter', weight: 400, fallback: 'noto-400' },
  'inter-600': { file: 'inter-600.ttf', family: 'Inter', weight: 600, fallback: 'noto-700' },
  'inter-700': { file: 'inter-700.ttf', family: 'Inter', weight: 700, fallback: 'noto-700' },
  'sserif-400': { file: 'sserif-400.ttf', family: 'Source Serif 4', weight: 400, fallback: 'noto-400' },
  'sserif-600': { file: 'sserif-600.ttf', family: 'Source Serif 4', weight: 600, fallback: 'noto-700' },
  'ssans-400': { file: 'ssans-400.ttf', family: 'Source Sans 3', weight: 400, fallback: 'noto-400' },
  'ssans-600': { file: 'ssans-600.ttf', family: 'Source Sans 3', weight: 600, fallback: 'noto-700' },
  'jbmono-400': { file: 'jbmono-400.ttf', family: 'JetBrains Mono', weight: 400, fallback: 'noto-400' },
  'jbmono-700': { file: 'jbmono-700.ttf', family: 'JetBrains Mono', weight: 700, fallback: 'noto-700' },
  'noto-400': { file: 'noto-400.ttf', family: 'Noto Sans', weight: 400, fallback: null },
  'noto-700': { file: 'noto-700.ttf', family: 'Noto Sans', weight: 700, fallback: null },
} as const satisfies Record<string, { file: string; family: string; weight: number; fallback: string | null }>;

export type FaceId = keyof typeof FACES;

/** All faces reachable from `faces` through the fallback chain. */
export function withFallbacks(faces: Iterable<FaceId>): FaceId[] {
  const out = new Set<FaceId>();
  for (let f of faces) {
    for (let cur: FaceId | null = f; cur && !out.has(cur); cur = FACES[cur].fallback) out.add(cur);
  }
  return [...out];
}
