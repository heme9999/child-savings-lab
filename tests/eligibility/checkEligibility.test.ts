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
    expect(result.accountInformationNeeded.join(' ')).toContain('legal custodian');
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

  it('separates the new-election age baseline from adult-stage account handling', () => {
    const result = checkEligibility({ ...valid, birthDate: '2008-12-31' });
    expect(result.baselineEligible).toBe(false);
    expect(result.accountPath).toBe('post-growth-period');
    expect(result.accountReasons.join(' ')).toContain('does not invalidate');
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

  it('keeps an unknown SSN baseline distinct from No', () => {
    const result = checkEligibility({ ...valid, hasEmploymentValidSsn: null });
    expect(result.accountPath).toBe('needs-information');
    expect(result.baselineEligible).toBeNull();
    expect(result.accountInformationNeeded).not.toEqual([]);
    expect(result.pilotStatus).toBe('needs-information');
  });

  it.each(['isUsCitizen', 'qualifyingChildExpected'] as const)('does not erase the account path when %s is unknown', (field) => {
    const result = checkEligibility({ ...valid, [field]: null });
    expect(result.accountPath).toBe('check-official-status');
    expect(result.baselineEligible).toBe(true);
    expect(result.validationErrors).toEqual([]);
    expect(result.pilotStatus).toBe('needs-information');
    expect(result.pilotInformationNeeded).not.toEqual([]);
  });

  it('preserves a reported activated account with incomplete pilot information', () => {
    const result = checkEligibility({ ...valid, accountStatus: 'active-account', isUsCitizen: null, qualifyingChildExpected: null });
    expect(result.accountPath).toBe('active');
    expect(result.fundingGuidance).toContain('reported as activated');
    expect(result.pilotStatus).toBe('needs-information');
    expect(result.pilotInformationNeeded).toHaveLength(2);
  });

  it('does not request irrelevant citizenship answers for a birth date outside the pilot window', () => {
    const result = checkEligibility({ ...valid, birthDate: '2016-01-15', accountStatus: 'active-account', isUsCitizen: null, qualifyingChildExpected: null });
    expect(result.accountPath).toBe('active');
    expect(result.pilotStatus).toBe('not-potentially-eligible');
    expect(result.pilotReasons.join(' ')).toContain('outside');
    expect(result.pilotInformationNeeded).toEqual([]);
  });

  it('does not send an activated account through activation again in the adult-stage year', () => {
    const result = checkEligibility({ ...valid, birthDate: '2009-01-15', checkYear: 2027, accountStatus: 'active-account' });
    expect(result.accountPath).toBe('post-growth-period');
    expect(result.canReceiveFamilyOrEmployerContributions).toBeNull();
    expect(result.fundingGuidance).toContain('traditional IRA');
    expect(result.fundingGuidance).not.toContain('wait');
    expect(result.requiredActions.join(' ')).toContain('Do not repeat');
  });

  it('routes an unclaimed adult-stage account to status-specific trustee guidance', () => {
    const result = checkEligibility({ ...valid, birthDate: '2009-01-15', checkYear: 2027, accountStatus: 'auto-account' });
    expect(result.accountPath).toBe('post-growth-period');
    expect(result.requiredActions.join(' ')).toContain('claim, transfer');
  });

  it('flags conflicting SSN facts without declaring an existing account unactivated', () => {
    const result = checkEligibility({ ...valid, accountStatus: 'active-account', hasEmploymentValidSsn: false });
    expect(result.accountPath).toBe('verify-existing-account');
    expect(result.canReceiveFamilyOrEmployerContributions).toBeNull();
  });

  it('keeps prior processed or pending pilot status separate from incomplete pilot eligibility', () => {
    for (const [pilotElectionStatus, expected] of [['processed', 'already-processed'], ['submitted-pending', 'pending']] as const) {
      const result = checkEligibility({ ...valid, accountStatus: 'active-account', isUsCitizen: null, qualifyingChildExpected: null, pilotElectionStatus });
      expect(result.accountPath).toBe('active');
      expect(result.pilotStatus).toBe(expected);
      expect(result.requiredActions.join(' ')).toMatch(/duplicate|resubmitting/);
    }
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
