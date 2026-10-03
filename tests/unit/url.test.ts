import { describe, expect, it } from 'vitest';
import { displayUrl, isValidEmail, isValidPhone, isValidUrl, safeHref } from '../../src/lib/url';

describe('url safety', () => {
  it('normalises bare domains and emails', () => {
    expect(safeHref('github.com/me')).toBe('https://github.com/me');
    expect(safeHref('me@example.com')).toBe('mailto:me@example.com');
    expect(safeHref('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
  });

  it('rejects dangerous or meaningless links', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('JaVaScRiPt:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeHref('vbscript:x')).toBeNull();
    expect(safeHref('localhost')).toBeNull();
    expect(safeHref('')).toBeNull();
  });

  it('validates inputs', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidUrl('linkedin.com/in/x')).toBe(true);
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidPhone('+91 91730 86652')).toBe(true);
    expect(isValidPhone('+1 (555) 014-2290')).toBe(true);
    expect(isValidPhone('call me')).toBe(false);
  });

  it('shortens URLs for display', () => {
    expect(displayUrl('https://www.github.com/me/')).toBe('github.com/me');
  });
});
