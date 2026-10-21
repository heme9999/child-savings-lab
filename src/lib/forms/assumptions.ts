import { claimAuthorityOptions } from '../../data/eligibility-options';

type Answers = { get(name: string): unknown };
const answer = (data: Answers, name: string) => String(data.get(name) ?? '').trim() || 'not set';

// Display entered precision verbatim. These are local UI summaries, not validated
// results, and must never turn a blank into zero or imply an eligibility finding.
export function growthDateSummary(data: Answers): string {
  return `Born ${answer(data, 'birthDate')} · Start ${answer(data, 'projectionStartDate')} · ${data.get('includePilot') === 'true' ? '$1,000 pilot included' : 'No pilot amount'}`;
}

export function growthExtraSummary(data: Answers): string {
  return `Starting $${answer(data, 'initialAmount')} · Employer $${answer(data, 'annualEmployerContribution')}/year · Fund ${answer(data, 'fundExpenseRate')}% · Account ${answer(data, 'accountFeeRate')}%`;
}

export function eligibilityContextSummary(data: Answers): string {
  const authority = claimAuthorityOptions.find(option => option.value === data.get('claimAuthority'));
  return `Review year ${answer(data, 'checkYear')} · Claim authority: ${authority?.label ?? 'not set'}`;
}
