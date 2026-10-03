/** Short, collision-resistant ids for resumes, sections and items. */
export function createId(prefix = ''): string {
  const raw =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix + raw.slice(0, 16);
}
