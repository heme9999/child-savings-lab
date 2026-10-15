import type { FieldIssue } from '../forms/feedback';

export type AccountStatus =
  | 'unknown'
  | 'auto-account'
  | 'claim-started'
  | 'manual-election-only'
  | 'active-account'
  | 'no-account-confirmed';

export type ClaimAuthority =
  | 'guardian-or-legal-custodian'
  | 'beneficiary-with-legal-capacity'
  | 'not-sure';

export type PilotElectionStatus = 'not-made' | 'submitted-pending' | 'processed' | 'unknown';

export type AccountPath =
  | 'needs-information'
  | 'not-baseline-eligible'
  | 'check-official-status'
  | 'claim-auto-account'
  | 'complete-activation'
  | 'active'
  | 'post-growth-period'
  | 'verify-existing-account'
  | 'manual-exception-review';

export type PilotStatus =
  | 'needs-information'
  | 'potentially-eligible-to-elect'
  | 'already-processed'
  | 'pending'
  | 'check-status'
  | 'not-potentially-eligible';

export interface EligibilityInput {
  checkYear: number;
  birthDate: string;
  hasEmploymentValidSsn: boolean | null;
  isUsCitizen: boolean | null;
  accountStatus: AccountStatus;
  claimAuthority: ClaimAuthority;
  pilotElectionStatus: PilotElectionStatus;
  qualifyingChildExpected: boolean | null;
}

export interface EligibilityResult {
  baselineEligible: boolean | null;
  accountPath: AccountPath;
  accountPathTitle: string;
  canReceiveFamilyOrEmployerContributions: boolean | null;
  fundingGuidance: string;
  validationErrors: string[];
  validationIssues: FieldIssue<keyof EligibilityInput>[];
  accountInformationNeeded: string[];
  pilotInformationNeeded: string[];
  pilotStatus: PilotStatus;
  pilotStatusTitle: string;
  accountReasons: string[];
  pilotReasons: string[];
  requiredActions: string[];
  formGuidance: string;
  sourceIds: string[];
  rulesVerifiedAt: string;
}
