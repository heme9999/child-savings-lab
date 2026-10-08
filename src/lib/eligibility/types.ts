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
  | 'not-baseline-eligible'
  | 'check-official-status'
  | 'claim-auto-account'
  | 'complete-activation'
  | 'active'
  | 'manual-exception-review';

export type PilotStatus =
  | 'potentially-eligible-to-elect'
  | 'already-processed'
  | 'pending'
  | 'check-status'
  | 'not-potentially-eligible';

export interface EligibilityInput {
  checkYear: number;
  birthDate: string;
  hasEmploymentValidSsn: boolean;
  isUsCitizen: boolean;
  accountStatus: AccountStatus;
  claimAuthority: ClaimAuthority;
  pilotElectionStatus: PilotElectionStatus;
  qualifyingChildExpected: boolean;
}

export interface EligibilityResult {
  baselineEligible: boolean;
  accountPath: AccountPath;
  accountPathTitle: string;
  canReceiveFamilyOrEmployerContributions: boolean;
  pilotStatus: PilotStatus;
  pilotStatusTitle: string;
  accountReasons: string[];
  pilotReasons: string[];
  requiredActions: string[];
  formGuidance: string;
  sourceIds: string[];
  rulesVerifiedAt: string;
}
