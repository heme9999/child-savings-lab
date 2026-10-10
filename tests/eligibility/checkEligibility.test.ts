import { describe, expect, it } from 'vitest';
import { checkEligibility } from '../../src/lib/eligibility/checkEligibility';
import type { EligibilityInput } from '../../src/lib/eligibility/types';

const valid: EligibilityInput = {
  checkYear: 2026,
  birthDate: '2026-01-15',
  hasEmploymentValidSsn: true,
  isUsCitizen: true,
  accountStatus: 'unknown',
  claimAuthority: 'guardian-or-legal-custodian',
  pilotElectionStatus: 'not-made',
  qualifyingChildExpected: true
};

describe('checkEligibility', () => {
  it('routes an unknown account to the official status process', () => {
    const result = checkEligibility(valid);
    expect(result.baselineEligible).toBe(true);
    expect(result.accountPath).toBe('check-official-status');
    expect(result.requiredActions.join(' ')).toContain('account-status');
  });

  it('routes an auto account to claim and activation', () => {
    const result = checkEligibility({ ...valid, accountStatus: 'auto-account' });
    expect(result.accountPath).toBe('claim-auto-account');
    expect(result.canReceiveFamilyOrEmployerContributions).toBe(false);
    expect(result.requiredActions.join(' ')).toContain('Activate');
  });

  it('does not treat an uncertain relationship as sufficient claim authority', () => {
    const result = checkEligibility({ ...valid, accountStatus: 'auto-account', claimAuthority: 'not-sure' });
    expect(result.accountReasons.join(' ')).toContain('legal custodian');
  });

  it('routes an election or claim without activation to activation', () => {
    expect(checkEligibility({ ...valid, accountStatus: 'manual-election-only' }).accountPath).toBe('complete-activation');
    expect(checkEligibility({ ...valid, accountStatus: 'claim-started' }).accountPath).toBe('complete-activation');
  });

  it('allows permitted private contributions only after activation', () => {
    const result = checkEligibility({ ...valid, accountStatus: 'active-account' });
    expect(result.accountPath).toBe('active');
    expect(result.canReceiveFamilyOrEmployerContributions).toBe(true);
  });

  it('uses the manual Form 4547 path only as an exception', () => {
    const result = checkEligibility({ ...valid, accountStatus: 'no-account-confirmed' });
    expect(result.accountPath).toBe('manual-exception-review');
    expect(result.formGuidance).toContain('rare manual-account exceptions');
  });

  it('rejects a child who is 18 by election-year end', () => {
    const result = checkEligibility({ ...valid, birthDate: '2008-12-31' });
    expect(result.baselineEligible).toBe(false);
    expect(result.accountReasons.join(' ')).toContain('under age 18');
  });

  it('requires an employment-valid SSN issued before election', () => {
    const result = checkEligibility({ ...valid, hasEmploymentValidSsn: false });
    expect(result.baselineEligible).toBe(false);
    expect(result.accountReasons.join(' ')).toContain('valid for employment');
  });

  it('separates account baseline from pilot citizenship', () => {
    const result = checkEligibility({ ...valid, isUsCitizen: false });
    expect(result.baselineEligible).toBe(true);
    expect(result.pilotStatus).toBe('not-potentially-eligible');
  });

  it('recognizes both pilot-window boundary dates', () => {
    expect(checkEligibility({ ...valid, birthDate: '2025-01-01' }).pilotStatus).toBe('potentially-eligible-to-elect');
    expect(checkEligibility({ ...valid, birthDate: '2028-12-31', checkYear: 2029 }).pilotStatus).toBe('potentially-eligible-to-elect');
  });

  it('distinguishes processed, pending, and unknown pilot elections', () => {
    expect(checkEligibility({ ...valid, pilotElectionStatus: 'processed' }).pilotStatus).toBe('already-processed');
    expect(checkEligibility({ ...valid, pilotElectionStatus: 'submitted-pending' }).pilotStatus).toBe('pending');
    expect(checkEligibility({ ...valid, pilotElectionStatus: 'unknown' }).pilotStatus).toBe('check-status');
  });

  it('reports missing or invalid inputs', () => {
    const result = checkEligibility({ ...valid, birthDate: '', checkYear: 0 });
    expect(result.baselineEligible).toBeNull();
    expect(result.accountPath).toBe('needs-information');
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(2);
    expect(result.pilotReasons).toEqual([]);
  });

  it.each(['', '2026-02-30', 'not-a-date'])('does not infer pilot ineligibility from an invalid date: %s', (birthDate) => {
    const result = checkEligibility({ ...valid, birthDate });
    expect(result.pilotStatus).toBe('needs-information');
    expect(result.pilotReasons.join(' ')).not.toContain('outside');
    expect(result.canReceiveFamilyOrEmployerContributions).toBeNull();
  });

  it.each(['hasEmploymentValidSsn', 'isUsCitizen', 'qualifyingChildExpected'] as const)('keeps an unsure %s distinct from No', (field) => {
    const result = checkEligibility({ ...valid, [field]: null });
    expect(result.accountPath).toBe('needs-information');
    expect(result.baselineEligible).toBeNull();
    expect(result.validationErrors).not.toEqual([]);
  });

  it('still reports a real date outside the pilot window after complete answers', () => {
    const result = checkEligibility({ ...valid, birthDate: '2024-12-31' });
    expect(result.baselineEligible).toBe(true);
    expect(result.pilotStatus).toBe('not-potentially-eligible');
    expect(result.pilotReasons.join(' ')).toContain('outside');
  });

  it('does not route tampered account status to a manual election', () => {
    const result = checkEligibility({ ...valid, accountStatus: 'invalid' as EligibilityInput['accountStatus'] });
    expect(result.accountPath).toBe('needs-information');
  });
});
