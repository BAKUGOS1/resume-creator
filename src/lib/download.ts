/** Triggers a browser download for an in-memory file. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "Jordan Ellis" → "Jordan_Ellis"; safe on every OS. */
export function fileSlug(text: string, fallback = 'Resume'): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return slug || fallback;
}

/** Reads a user-selected text file with a size cap (defends against huge uploads). */
export function readTextFile(file: File, maxBytes: number): Promise<string> {
  if (file.size > maxBytes) return Promise.reject(new Error(`File is too large (max ${Math.round(maxBytes / 1024)} KB).`));
  return file.text();
}
