import type { AccountStatus, ClaimAuthority } from '../lib/eligibility/types';

export const accountStatusOptions = [
  { value: 'unknown', label: 'Not checked', description: 'Unknown — I have not checked' },
  { value: 'auto-account', label: 'Unclaimed auto account', description: 'Treasury auto account exists but has not been claimed' },
  { value: 'claim-started', label: 'Claim started', description: 'Auto-account claim started; receiving account not activated' },
  { value: 'manual-election-only', label: 'Election made', description: 'Form 4547 election made; account not activated' },
  { value: 'active-account', label: 'Activated account', description: 'Claimed or other receiving account is activated' },
  { value: 'no-account-confirmed', label: 'No account confirmed', description: 'IRS confirms no account or prior election' }
] as const satisfies readonly { value: AccountStatus; label: string; description: string }[];

export const claimAuthorityOptions = [
  { value: 'guardian-or-legal-custodian', label: 'Guardian / custodian', description: 'Guardian or legal custodian with property-management authority' },
  { value: 'beneficiary-with-legal-capacity', label: 'Beneficiary', description: 'Beneficiary with legal capacity under state law' },
  { value: 'not-sure', label: 'Not sure', description: 'Not sure / relationship alone has not been legally confirmed' }
] as const satisfies readonly { value: ClaimAuthority; label: string; description: string }[];
