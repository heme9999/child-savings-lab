import type { EligibilityInput, EligibilityResult } from './types';

const VERIFIED_AT = '2026-10-08';
const PILOT_START = '2025-01-01';
const PILOT_END = '2028-12-31';
const authorizedRelationships = new Set(['legal-guardian', 'parent', 'adult-sibling', 'grandparent']);

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const accountReasons: string[] = [];
  const pilotReasons: string[] = [];
  const requiredActions: string[] = [];
  let birthDateInPilotWindow = false;
  let bornByElectionYearEnd = false;

  if (!Number.isInteger(input.applicationYear) || input.applicationYear < 2026 || input.applicationYear > 2100) {
    accountReasons.push('Choose an election year from 2026 through 2100.');
  }

  if (!isValidIsoDate(input.birthDate)) {
    accountReasons.push('Enter a complete, valid date of birth.');
  } else if (Number.isInteger(input.applicationYear)) {
    const birthDate = new Date(`${input.birthDate}T00:00:00Z`);
    const yearEnd = new Date(`${input.applicationYear}-12-31T23:59:59Z`);
    bornByElectionYearEnd = birthDate <= yearEnd;
    birthDateInPilotWindow = input.birthDate >= PILOT_START && input.birthDate <= PILOT_END;
    if (!bornByElectionYearEnd) {
      accountReasons.push('The child must be born by the end of the election year.');
    } else {
      let age = yearEnd.getUTCFullYear() - birthDate.getUTCFullYear();
      const hadBirthday =
        yearEnd.getUTCMonth() > birthDate.getUTCMonth() ||
        (yearEnd.getUTCMonth() === birthDate.getUTCMonth() && yearEnd.getUTCDate() >= birthDate.getUTCDate());
      if (!hadBirthday) age -= 1;
      if (age >= 18) accountReasons.push('The child must be under age 18 at the end of the election year.');
    }
  }

  if (!input.hasValidSsn) accountReasons.push('A valid Social Security number issued before the election is required.');
  if (input.priorAccountElection) accountReasons.push('An initial Trump Account election has already been filed for this child.');
  const qualifyingChildPilotPath =
    birthDateInPilotWindow &&
    bornByElectionYearEnd &&
    input.hasValidSsn &&
    input.isUsCitizen &&
    !input.priorPilotElection &&
    input.qualifyingChildExpected;
  if (!authorizedRelationships.has(input.relationship) && !qualifyingChildPilotPath) {
    accountReasons.push('This relationship is not listed by the IRS as an authorized individual for an account-only election.');
  }

  if (input.relationship === 'adult-sibling') {
    requiredActions.push('Confirm that no legal guardian or parent is available to make the account election.');
  }
  if (input.relationship === 'grandparent') {
    requiredActions.push('Confirm that no legal guardian, parent, or adult sibling is available to make the account election.');
  }

  const canOpenAccount = accountReasons.length === 0;

  if (!canOpenAccount) pilotReasons.push('The child must first meet the requirements for an initial account election.');
  if (isValidIsoDate(input.birthDate) && !birthDateInPilotWindow) {
    pilotReasons.push('The birth date is outside the January 1, 2025 through December 31, 2028 pilot window.');
  }
  if (!input.isUsCitizen) pilotReasons.push('The $1,000 pilot contribution requires U.S. citizenship.');
  if (input.priorPilotElection) pilotReasons.push('A prior pilot contribution election has already been processed or submitted.');
  if (!input.qualifyingChildExpected) {
    pilotReasons.push('The person making the pilot election must anticipate that the child will be their qualifying child for the election year.');
  }

  if (canOpenAccount) requiredActions.push('Submit Form 4547 through the IRS online account or with an eligible tax return.');
  if (canOpenAccount && pilotReasons.length === 0) requiredActions.push('Select the pilot contribution election on Form 4547.');
  requiredActions.push('Verify the latest IRS instructions before filing; this checker does not submit information.');

  return {
    canOpenAccount,
    pilotContributionEligible: canOpenAccount && pilotReasons.length === 0,
    accountReasons,
    pilotReasons,
    requiredActions,
    requiredForm: 'IRS Form 4547',
    sourceIds: ['IRS-TRUMP-ACCOUNTS', 'IRS-FORM-4547-INSTRUCTIONS'],
    rulesVerifiedAt: VERIFIED_AT
  };
}
