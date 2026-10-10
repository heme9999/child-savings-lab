import type { AccountPath, EligibilityInput, EligibilityResult, PilotStatus } from './types';
import { isValidIsoDate } from '../dates';

const VERIFIED_AT = '2026-10-08';
const PILOT_START = '2025-01-01';
const PILOT_END = '2028-12-31';

function pathTitle(path: AccountPath): string {
  const titles: Record<AccountPath, string> = {
    'needs-information': 'More information is needed; no eligibility determination',
    'not-baseline-eligible': 'Baseline requirements not met',
    'check-official-status': 'Check the official account status first',
    'claim-auto-account': 'Claim the auto account',
    'complete-activation': 'Complete account activation',
    active: 'Account appears ready for permitted contributions',
    'manual-exception-review': 'Ask the IRS about the rare manual-election path'
  };
  return titles[path];
}

function pilotTitle(status: PilotStatus): string {
  const titles: Record<PilotStatus, string> = {
    'needs-information': 'Pilot eligibility has not been assessed',
    'potentially-eligible-to-elect': 'Potentially eligible to make the pilot election',
    'already-processed': 'Pilot election already processed',
    pending: 'Pilot election is pending',
    'check-status': 'Check the pilot-election status',
    'not-potentially-eligible': 'Pilot requirements not met based on these answers'
  };
  return titles[status];
}

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const accountReasons: string[] = [];
  const pilotReasons: string[] = [];
  const requiredActions: string[] = [];
  const validationErrors: string[] = [];
  const formGuidance = 'Form 4547 remains relevant to the separate pilot election and rare manual-account exceptions; it is no longer the default account-opening path after auto enrollment began.';
  let birthDateInPilotWindow = false;

  if (!Number.isInteger(input.checkYear) || input.checkYear < 2026 || input.checkYear > 2100) {
    validationErrors.push('Choose a review year from 2026 through 2100.');
  }

  if (!isValidIsoDate(input.birthDate)) {
    validationErrors.push('Enter a complete, valid date of birth.');
  } else if (Number.isInteger(input.checkYear)) {
    const birthDate = new Date(`${input.birthDate}T00:00:00Z`);
    const yearEnd = new Date(`${input.checkYear}-12-31T23:59:59Z`);
    birthDateInPilotWindow = input.birthDate >= PILOT_START && input.birthDate <= PILOT_END;
    if (birthDate > yearEnd) {
      validationErrors.push('The birth date must be on or before the end of the review year.');
    } else {
      const ageAtYearEnd = yearEnd.getUTCFullYear() - birthDate.getUTCFullYear();
      if (ageAtYearEnd >= 18) accountReasons.push('The individual must be under age 18 at the end of the election year.');
    }
  }

  for (const [answer, label] of [
    [input.hasEmploymentValidSsn, 'employment-valid SSN status'],
    [input.isUsCitizen, 'U.S. citizenship'],
    [input.qualifyingChildExpected, 'qualifying-child expectation']
  ] as const) {
    if (typeof answer !== 'boolean') validationErrors.push(`Confirm ${label}. If unsure, verify it using official instructions before relying on a result.`);
  }
  if (!['unknown', 'auto-account', 'claim-started', 'manual-election-only', 'active-account', 'no-account-confirmed'].includes(input.accountStatus)) validationErrors.push('Choose an account status, including Unknown if you have not checked.');
  if (!['guardian-or-legal-custodian', 'beneficiary-with-legal-capacity', 'not-sure'].includes(input.claimAuthority)) validationErrors.push('Choose a claim-authority answer.');
  if (!['not-made', 'submitted-pending', 'processed', 'unknown'].includes(input.pilotElectionStatus)) validationErrors.push('Choose a pilot-election status.');
  if (validationErrors.length) {
    return {
      baselineEligible: null,
      accountPath: 'needs-information', accountPathTitle: pathTitle('needs-information'),
      canReceiveFamilyOrEmployerContributions: null,
      pilotStatus: 'needs-information', pilotStatusTitle: pilotTitle('needs-information'),
      validationErrors, accountReasons: [], pilotReasons: [],
      requiredActions: ['Complete or confirm the missing answers. This tool has not assessed eligibility.'],
      formGuidance, sourceIds: ['TREASURY-TD-10056', 'IRS-FORM-4547-INSTRUCTIONS'], rulesVerifiedAt: VERIFIED_AT
    };
  }

  if (!input.hasEmploymentValidSsn) {
    accountReasons.push('An SSN valid for employment and issued before the election is required.');
  }

  const baselineEligible = accountReasons.length === 0;
  let accountPath: AccountPath;
  let canReceiveFamilyOrEmployerContributions = false;

  if (!baselineEligible) {
    accountPath = 'not-baseline-eligible';
    requiredActions.push('Confirm age and SSN facts using current IRS instructions.');
  } else if (input.accountStatus === 'unknown') {
    accountPath = 'check-official-status';
    requiredActions.push('Use the official IRS or Treasury account-status process before submitting another election.');
  } else if (input.accountStatus === 'auto-account') {
    accountPath = 'claim-auto-account';
    if (input.claimAuthority === 'not-sure') {
      accountReasons.push('Only a guardian or legal custodian with authority over the beneficiary’s property, or a legally capable beneficiary, may claim an auto account.');
    }
    requiredActions.push('Complete the official claim process, identity authentication, authority verification, and any required consent.');
    requiredActions.push('Activate the receiving account after the claim; the claim alone does not complete establishment.');
  } else if (input.accountStatus === 'claim-started' || input.accountStatus === 'manual-election-only') {
    accountPath = 'complete-activation';
    requiredActions.push('Follow the trustee’s instructions and sign the account agreement to activate the receiving account.');
  } else if (input.accountStatus === 'active-account') {
    accountPath = 'active';
    canReceiveFamilyOrEmployerContributions = true;
    requiredActions.push('Confirm contribution limits and the trustee’s current deposit instructions before funding.');
  } else {
    accountPath = 'manual-exception-review';
    requiredActions.push('Ask the IRS whether a rare Form 4547 manual election is appropriate or whether periodic auto enrollment will apply.');
  }

  if (!birthDateInPilotWindow) {
    pilotReasons.push('The birth date is outside the January 1, 2025 through December 31, 2028 pilot window.');
  }
  if (!input.isUsCitizen) pilotReasons.push('The $1,000 pilot contribution requires U.S. citizenship.');
  if (!input.qualifyingChildExpected) {
    pilotReasons.push('The person making the pilot election must anticipate that the child will be their qualifying child for the election year.');
  }
  if (!baselineEligible) pilotReasons.push('The child must first meet the baseline account requirements.');

  let pilotStatus: PilotStatus;
  if (input.pilotElectionStatus === 'processed') {
    pilotStatus = 'already-processed';
    requiredActions.push('Do not submit a duplicate pilot election; retain the official confirmation.');
  } else if (input.pilotElectionStatus === 'submitted-pending') {
    pilotStatus = 'pending';
    requiredActions.push('Check the official status before resubmitting a pending pilot election.');
  } else if (input.pilotElectionStatus === 'unknown') {
    pilotStatus = 'check-status';
    requiredActions.push('Check whether a pilot election has already been processed before filing another one.');
  } else if (pilotReasons.length === 0) {
    pilotStatus = 'potentially-eligible-to-elect';
    requiredActions.push('Review current Form 4547 instructions for the separate $1,000 pilot election.');
  } else {
    pilotStatus = 'not-potentially-eligible';
  }

  requiredActions.push('Verify all results at the official IRS Trump Accounts page; this tool does not access or submit account data.');

  return {
    validationErrors,
    baselineEligible,
    accountPath,
    accountPathTitle: pathTitle(accountPath),
    canReceiveFamilyOrEmployerContributions,
    pilotStatus,
    pilotStatusTitle: pilotTitle(pilotStatus),
    accountReasons,
    pilotReasons,
    requiredActions,
    formGuidance,
    sourceIds: ['TREASURY-TD-10056', 'IRS-FORM-4547-INSTRUCTIONS'],
    rulesVerifiedAt: VERIFIED_AT
  };
}
