import { describe, expect, it } from 'vitest';
import { formatDateRange, formatPartialDate, isRangeInverted, parseLooseDate, parseLooseRange } from '../../src/domain/dates';

describe('dates', () => {
  it('formats partial dates in every format', () => {
    expect(formatPartialDate('2025-11', 'short')).toBe('Nov 2025');
    expect(formatPartialDate('2025-11', 'long')).toBe('November 2025');
    expect(formatPartialDate('2025-01', 'numeric')).toBe('01/2025');
    expect(formatPartialDate('2025-11', 'year')).toBe('2025');
    expect(formatPartialDate('2022', 'short')).toBe('2022');
  });

  it('formats ranges, including current and single dates', () => {
    expect(formatDateRange({ start: '2025-11', end: '', current: true }, 'short')).toBe('Nov 2025 – Present');
    expect(formatDateRange({ start: '2022', end: '2026', current: false }, 'short')).toBe('2022 – 2026');
    expect(formatDateRange({ start: '2026-06', end: '2026-06', current: false }, 'short')).toBe('Jun 2026');
    expect(formatDateRange({ start: '', end: '2022', current: false }, 'short')).toBe('2022');
    expect(formatDateRange({ start: '', end: '', current: false }, 'short')).toBe('');
  });

  it('detects inverted ranges', () => {
    expect(isRangeInverted({ start: '2024-05', end: '2023-01', current: false })).toBe(true);
    expect(isRangeInverted({ start: '2024', end: '2024-03', current: false })).toBe(false);
    expect(isRangeInverted({ start: '2024-05', end: '2023-01', current: true })).toBe(false);
  });

  it('parses loose legacy text', () => {
    expect(parseLooseDate('Nov 2025')).toBe('2025-11');
    expect(parseLooseDate('September 2019')).toBe('2019-09');
    expect(parseLooseDate('11/2025')).toBe('2025-11');
    expect(parseLooseDate('2022')).toBe('2022');
    expect(parseLooseDate('someday')).toBe('');
    expect(parseLooseRange('Nov 2025 – Present')).toEqual({ start: '2025-11', end: '', current: true });
    expect(parseLooseRange('Oct 2022 – Oct 2025')).toEqual({ start: '2022-10', end: '2025-10', current: false });
    expect(parseLooseRange('2022 - 2026')).toEqual({ start: '2022', end: '2026', current: false });
  });
});
