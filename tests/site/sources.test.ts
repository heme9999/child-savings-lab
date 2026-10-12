import { describe, expect, it } from 'vitest';
import { sources } from '../../src/data/sources';

describe('source status and applicability contracts', () => {
  it('does not assign an effective date to a proposed rule', () => {
    const proposed = sources.filter((source) => source.status === 'proposed rule');
    expect(proposed.length).toBeGreaterThan(0);
    for (const source of proposed) {
      expect(source).not.toHaveProperty('effectiveFrom');
      expect(source.proposedApplicability).toContain('Not final');
      expect(source.proposedApplicability).toContain('publication');
    }
  });
  it('retains distinct linked-publication and verification dates', () => {
    const employer = sources.find((source) => source.id === 'IRS-PROPOSED-EMPLOYER-2026');
    expect(employer?.publishedAt).toBe('2026-09-08');
    expect(employer?.verifiedAt).toBe('2026-10-12');
  });
});
