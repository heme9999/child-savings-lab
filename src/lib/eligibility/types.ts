export type Relationship = 'legal-guardian' | 'parent' | 'adult-sibling' | 'grandparent' | 'other';

export interface EligibilityInput {
  applicationYear: number;
  birthDate: string;
  hasValidSsn: boolean;
  isUsCitizen: boolean;
  priorAccountElection: boolean;
  priorPilotElection: boolean;
  qualifyingChildExpected: boolean;
  relationship: Relationship;
}

export interface EligibilityResult {
  canOpenAccount: boolean;
  pilotContributionEligible: boolean;
  accountReasons: string[];
  pilotReasons: string[];
  requiredActions: string[];
  requiredForm: string;
  sourceIds: string[];
  rulesVerifiedAt: string;
}
