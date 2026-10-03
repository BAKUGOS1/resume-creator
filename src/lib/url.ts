/** URL helpers: everything rendered as a link goes through `safeHref`. */

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Turns user input ("github.com/me", "me@x.com") into an absolute, safe href or null. */
export function safeHref(input: string | undefined | null): string | null {
  const value = (input ?? '').trim();
  if (!value) return null;
  if (EMAIL_RE.test(value)) return `mailto:${value}`;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (!SAFE_PROTOCOLS.has(url.protocol)) return null;
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname.includes('.')) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Display form of a URL: no protocol, no "www.", no trailing slash. */
export function displayUrl(input: string): string {
  return input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?/i, '')
    .replace(/^mailto:/i, '')
    .replace(/\/$/, '');
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  const href = safeHref(value);
  return href !== null && !href.startsWith('mailto:') && !href.startsWith('tel:');
}

/** Lenient phone check: digits, spaces and common punctuation, 7–15 digits. */
export function isValidPhone(value: string): boolean {
  if (!/^[+()\d\s./-]+$/.test(value.trim())) return false;
  const digits = value.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}
