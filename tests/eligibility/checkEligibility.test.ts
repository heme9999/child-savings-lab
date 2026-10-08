import { describe, expect, it } from 'vitest';
import { checkEligibility } from '../../src/lib/eligibility/checkEligibility';
import type { EligibilityInput } from '../../src/lib/eligibility/types';

const valid: EligibilityInput = {
  applicationYear: 2026,
  birthDate: '2026-01-15',
  hasValidSsn: true,
  isUsCitizen: true,
  priorAccountElection: false,
  priorPilotElection: false,
  qualifyingChildExpected: true,
  relationship: 'parent'
};

describe('checkEligibility', () => {
  it('separates account eligibility from pilot eligibility', () => {
    const result = checkEligibility({ ...valid, birthDate: '2015-06-01' });
    expect(result.canOpenAccount).toBe(true);
    expect(result.pilotContributionEligible).toBe(false);
    expect(result.pilotReasons.join(' ')).toContain('outside');
  });

  it('allows a child under 18 at election-year end with a valid SSN', () => {
    expect(checkEligibility({ ...valid, birthDate: '2009-01-01' }).canOpenAccount).toBe(true);
  });

  it('rejects a child who is 18 by election-year end', () => {
    const result = checkEligibility({ ...valid, birthDate: '2008-12-31' });
    expect(result.canOpenAccount).toBe(false);
    expect(result.accountReasons.join(' ')).toContain('under age 18');
  });

  it('changes age eligibility when the election year changes', () => {
    expect(checkEligibility({ ...valid, birthDate: '2009-01-01', applicationYear: 2026 }).canOpenAccount).toBe(true);
    expect(checkEligibility({ ...valid, birthDate: '2009-01-01', applicationYear: 2027 }).canOpenAccount).toBe(false);
  });

  it('requires a valid SSN for the account', () => {
    const result = checkEligibility({ ...valid, hasValidSsn: false });
    expect(result.canOpenAccount).toBe(false);
    expect(result.accountReasons.join(' ')).toContain('Social Security number');
  });

  it('treats U.S. citizenship as a pilot rule, not an account rule', () => {
    const result = checkEligibility({ ...valid, isUsCitizen: false });
    expect(result.canOpenAccount).toBe(true);
    expect(result.pilotContributionEligible).toBe(false);
  });

  it('rejects a repeated pilot election without blocking an initial-account result', () => {
    const result = checkEligibility({ ...valid, priorPilotElection: true });
    expect(result.canOpenAccount).toBe(true);
    expect(result.pilotContributionEligible).toBe(false);
  });

  it('rejects a prior account election', () => {
    expect(checkEligibility({ ...valid, priorAccountElection: true }).canOpenAccount).toBe(false);
  });

  it('accepts both pilot birth-window boundary dates', () => {
    expect(checkEligibility({ ...valid, birthDate: '2025-01-01' }).pilotContributionEligible).toBe(true);
    expect(checkEligibility({ ...valid, birthDate: '2028-12-31', applicationYear: 2029 }).pilotContributionEligible).toBe(true);
  });

  it('rejects dates just outside the pilot birth window', () => {
    expect(checkEligibility({ ...valid, birthDate: '2024-12-31' }).pilotContributionEligible).toBe(false);
    expect(checkEligibility({ ...valid, birthDate: '2029-01-01', applicationYear: 2029 }).pilotContributionEligible).toBe(false);
  });

  it('reports missing or invalid inputs', () => {
    const result = checkEligibility({ ...valid, birthDate: '', applicationYear: 0 });
    expect(result.canOpenAccount).toBe(false);
    expect(result.accountReasons.length).toBeGreaterThanOrEqual(2);
  });

  it('adds priority-order caution for a grandparent', () => {
    const result = checkEligibility({ ...valid, relationship: 'grandparent' });
    expect(result.canOpenAccount).toBe(true);
    expect(result.requiredActions.join(' ')).toContain('legal guardian, parent, or adult sibling');
  });

  it('rejects an unlisted relationship for an account-only election', () => {
    expect(checkEligibility({ ...valid, relationship: 'other' }).canOpenAccount).toBe(false);
  });
});
