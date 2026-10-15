import type { AccountPath, EligibilityInput, EligibilityResult, PilotStatus } from './types';
import { isValidIsoDate } from '../dates';

const VERIFIED_AT = '2026-10-12';
const PILOT_START = '2025-01-01';
const PILOT_END = '2028-12-31';

function pathTitle(path: AccountPath): string {
  const titles: Record<AccountPath, string> = {
    'needs-information': 'More account information is needed',
    'not-baseline-eligible': 'New-election baseline requirements not met',
    'check-official-status': 'Check the official account status first',
    'claim-auto-account': 'Claim the auto account',
    'complete-activation': 'Complete account activation',
    active: 'Receiving account reported as activated',
    'post-growth-period': 'Review adult-stage rules and existing account status',
    'verify-existing-account': 'Verify conflicting facts about the existing account',
    'manual-exception-review': 'Ask the IRS about the rare manual-election path'
  };
  return titles[path];
}

function pilotTitle(status: PilotStatus): string {
  const titles: Record<PilotStatus, string> = {
    'needs-information': 'Pilot eligibility has not been assessed',
    'potentially-eligible-to-elect': 'Potentially eligible to make the pilot election',
    'already-processed': 'Pilot election reported as processed',
    pending: 'Pilot election reported as pending',
    'check-status': 'Check the pilot-election status',
    'not-potentially-eligible': 'Pilot requirements not met based on these answers'
  };
  return titles[status];
}

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const result: EligibilityResult = {
    baselineEligible: null,
    accountPath: 'needs-information', accountPathTitle: pathTitle('needs-information'),
    canReceiveFamilyOrEmployerContributions: null,
    fundingGuidance: 'Funding eligibility has not been assessed. Confirm the relevant facts using official instructions.',
    validationErrors: [], validationIssues: [], accountInformationNeeded: [], pilotInformationNeeded: [],
    pilotStatus: 'needs-information', pilotStatusTitle: pilotTitle('needs-information'),
    accountReasons: [], pilotReasons: [], requiredActions: [],
    formGuidance: 'Form 4547 remains relevant to the separate pilot election and rare manual-account exceptions; it is no longer the default account-opening path after auto enrollment began.',
    sourceIds: ['TREASURY-TD-10056', 'IRS-FORM-4547-INSTRUCTIONS'], rulesVerifiedAt: VERIFIED_AT
  };
  const finish = () => {
    result.accountPathTitle = pathTitle(result.accountPath);
    result.pilotStatusTitle = pilotTitle(result.pilotStatus);
    return result;
  };
  const invalid = (field: keyof EligibilityInput, message: string) => {
    result.validationErrors.push(message); result.validationIssues.push({ field, message });
  };
  if (!Number.isInteger(input.checkYear) || input.checkYear < 2026 || input.checkYear > 2100) invalid('checkYear', 'Choose a review year from 2026 through 2100.');
  if (!isValidIsoDate(input.birthDate)) invalid('birthDate', 'Enter a complete, valid date of birth.');
  else if (Number.isInteger(input.checkYear) && input.birthDate > input.checkYear + '-12-31') invalid('birthDate', 'The birth date must be on or before the end of the review year.');
  if (!['unknown', 'auto-account', 'claim-started', 'manual-election-only', 'active-account', 'no-account-confirmed'].includes(input.accountStatus)) invalid('accountStatus', 'Choose an account status, including Unknown if you have not checked.');
  if (!['guardian-or-legal-custodian', 'beneficiary-with-legal-capacity', 'not-sure'].includes(input.claimAuthority)) invalid('claimAuthority', 'Choose a claim-authority answer.');
  if (!['not-made', 'submitted-pending', 'processed', 'unknown'].includes(input.pilotElectionStatus)) invalid('pilotElectionStatus', 'Choose a pilot-election status.');
  if (result.validationErrors.length) return finish();

  const ageAtYearEnd = input.checkYear - Number(input.birthDate.slice(0, 4));
  const postGrowthPeriod = ageAtYearEnd >= 18;
  const reportedExisting = !['unknown', 'no-account-confirmed'].includes(input.accountStatus);
  // This baseline concerns a NEW election in the review year, not the validity of an existing account.
  result.baselineEligible = postGrowthPeriod || input.hasEmploymentValidSsn === false ? false : input.hasEmploymentValidSsn === true ? true : null;

  if (postGrowthPeriod) {
    result.accountPath = 'post-growth-period';
    result.accountReasons.push('The child growth period ended on December 31 of the year the beneficiary turned 17. The new-election age test does not invalidate an account established earlier.');
    result.fundingGuidance = 'Growth-period family/employer contribution rules have ended. Verify current traditional IRA requirements with the trustee; this tool has not assessed adult funding eligibility.';
    result.requiredActions.push(input.accountStatus === 'active-account'
      ? 'You reported an activated account. Do not repeat claiming or activation solely because the beneficiary entered the adult stage; ask the trustee which adult IRA rules now apply.'
      : 'Check whether an account was established earlier and ask the IRS or trustee about any claim, transfer, or adult-stage steps appropriate to its actual status.');
    result.formGuidance = 'Do not use this checker to make a new child-period account election after the growth period. Ask the trustee about an existing account and the applicable adult IRA rules.';
  } else if (reportedExisting) {
    if (input.hasEmploymentValidSsn === false) {
      result.accountPath = 'verify-existing-account';
      result.accountReasons.push('You reported an existing account but answered No to the employment-valid SSN question. This tool cannot resolve those facts or invalidate an existing account.');
      result.requiredActions.push('Verify the relevant election-year SSN facts and the official account record before acting. Do not repeat activation based only on this result.');
    } else {
      if (input.hasEmploymentValidSsn !== true) result.accountInformationNeeded.push('The new-election SSN baseline is unconfirmed. The account path below reflects only the existing status you reported, not an independent eligibility determination.');
      if (input.accountStatus === 'active-account') {
        result.accountPath = 'active';
        result.canReceiveFamilyOrEmployerContributions = true;
        result.fundingGuidance = 'Receiving account reported as activated; verify trustee instructions and all applicable contribution requirements.';
        result.requiredActions.push('Confirm contribution limits and the trustee’s current deposit instructions before funding.');
      } else if (input.accountStatus === 'auto-account') {
        result.accountPath = 'claim-auto-account';
        result.canReceiveFamilyOrEmployerContributions = false;
        result.fundingGuidance = 'Family/employer deposits must wait for a permitted receiving account to be claimed and activated.';
        if (input.claimAuthority === 'not-sure') result.accountInformationNeeded.push('Confirm that a guardian or legal custodian has property-management authority, or that the beneficiary has legal capacity. Relationship alone is not enough.');
        result.requiredActions.push('Complete the official claim process, identity authentication, authority verification, and required consent.', 'Activate the receiving account after the claim; the claim alone does not complete establishment.');
      } else {
        result.accountPath = 'complete-activation';
        result.canReceiveFamilyOrEmployerContributions = false;
        result.fundingGuidance = 'Complete receiving-account activation and verify trustee readiness before family/employer deposits.';
        result.requiredActions.push('Follow the trustee’s instructions and sign the account agreement to activate the receiving account.');
      }
    }
  } else if (result.baselineEligible === false) {
    result.accountPath = 'not-baseline-eligible';
    result.canReceiveFamilyOrEmployerContributions = false;
    result.accountReasons.push('A new initial-account election requires an SSN valid for employment and issued before the election.');
    result.requiredActions.push('Confirm election-year age and SSN facts, and any prior account record, using current IRS instructions.');
  } else if (result.baselineEligible === null) {
    result.accountInformationNeeded.push('Confirm employment-valid SSN status before relying on a new-election baseline. Unknown is not a No.');
    result.requiredActions.push('Confirm the missing account facts using official instructions.');
  } else if (input.accountStatus === 'unknown') {
    result.accountPath = 'check-official-status';
    result.canReceiveFamilyOrEmployerContributions = false;
    result.fundingGuidance = 'Check official account status and receiving-account readiness before planning family/employer deposits.';
    result.requiredActions.push('Use the official IRS or Treasury account-status process before submitting another election.');
  } else {
    result.accountPath = 'manual-exception-review';
    result.canReceiveFamilyOrEmployerContributions = false;
    result.fundingGuidance = 'Confirm account establishment and activation before family/employer deposits.';
    result.requiredActions.push('Ask the IRS whether a rare Form 4547 manual election is appropriate or whether periodic auto enrollment will apply.');
  }

  const inPilotWindow = input.birthDate >= PILOT_START && input.birthDate <= PILOT_END;
  if (!inPilotWindow) result.pilotReasons.push('The birth date is outside the January 1, 2025 through December 31, 2028 pilot window.');
  if (input.isUsCitizen === false) result.pilotReasons.push('The $1,000 pilot contribution requires U.S. citizenship.');
  if (input.qualifyingChildExpected === false) result.pilotReasons.push('The pilot-electing person must anticipate that the child will be their qualifying child for the election year.');
  if (result.baselineEligible === false) result.pilotReasons.push('A new pilot election must meet the applicable age and employment-valid SSN requirements.');

  // A reported prior election is a status to verify, not a reason to submit a duplicate.
  if (input.pilotElectionStatus === 'processed') {
    result.pilotStatus = 'already-processed';
    result.requiredActions.push('Do not submit a duplicate pilot election; retain and verify the official processed confirmation.');
  } else if (input.pilotElectionStatus === 'submitted-pending') {
    result.pilotStatus = 'pending';
    result.requiredActions.push('Check official status before resubmitting a pending pilot election.');
  } else if (input.pilotElectionStatus === 'unknown') {
    result.pilotStatus = 'check-status';
    result.requiredActions.push('Check whether a pilot election has already been processed before filing another one.');
  } else if (result.pilotReasons.length) {
    result.pilotStatus = 'not-potentially-eligible';
  } else {
    if (input.hasEmploymentValidSsn !== true) result.pilotInformationNeeded.push('Confirm employment-valid SSN status for the relevant pilot election.');
    if (input.isUsCitizen !== true) result.pilotInformationNeeded.push('Confirm U.S. citizenship for the pilot contribution.');
    if (input.qualifyingChildExpected !== true) result.pilotInformationNeeded.push('Confirm the qualifying-child expectation for the pilot-election year.');
    if (result.pilotInformationNeeded.length) {
      result.pilotStatus = 'needs-information';
      result.requiredActions.push('Confirm the missing pilot facts. Uncertain pilot answers do not erase the separate account-status path.');
    } else {
      result.pilotStatus = 'potentially-eligible-to-elect';
      result.requiredActions.push('Review current Form 4547 instructions for the separate $1,000 pilot election.');
    }
  }
  if (['already-processed', 'pending', 'check-status'].includes(result.pilotStatus)) result.pilotInformationNeeded.push('Reported election status is not independently verified here. Confirm the official record and any conflicting answers before acting.');
  result.requiredActions.push('Verify all results at the official IRS Trump Accounts page; this tool does not access or submit account data.');
  return finish();
}
