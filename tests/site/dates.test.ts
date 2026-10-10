import { describe, expect, it } from 'vitest';
import { formatReviewDate, isValidIsoDate } from '../../src/lib/dates';

describe('single-source editorial dates', () => {
  it('formats the same ISO date used in structured data, without local-time shifts', () => {
    expect(formatReviewDate('2026-10-10')).toBe('October 10, 2026');
  });
  it.each(['October 10, 2026', '2026-02-30', ''])('rejects inconsistent or invalid source dates: %s', (value) => {
    expect(isValidIsoDate(value)).toBe(false);
    expect(() => formatReviewDate(value)).toThrow();
  });
});
