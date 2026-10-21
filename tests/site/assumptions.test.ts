import { describe, expect, it } from 'vitest';
import { growthDateSummary, growthExtraSummary, eligibilityContextSummary } from '../../src/lib/forms/assumptions';

const answers = (values: Record<string, string>) => new Map(Object.entries(values));
describe('visible disclosure summaries', () => {
  it('identifies fictional dates and the explicit no-pilot default', () => {
    expect(growthDateSummary(answers({ birthDate: '2026-01-15', projectionStartDate: '2026-10-08', includePilot: 'false' }))).toBe('Born 2026-01-15 · Start 2026-10-08 · No pilot amount');
  });
  it('summarizes pilot inclusion only as an assumption, not a finding', () => {
    expect(growthDateSummary(answers({ includePilot: 'true' }))).toBe('Born not set · Start not set · $1,000 pilot included');
  });
  it('preserves entered fee precision rather than rounding away small values', () => {
    const summary = growthExtraSummary(answers({ initialAmount: '0', annualEmployerContribution: '10.25', fundExpenseRate: '0.004', accountFeeRate: '0.001' }));
    expect(summary).toBe('Starting $0 · Employer $10.25/year · Fund 0.004% · Account 0.001%');
  });
  it('does not turn a blank or missing numeric answer into zero', () => {
    expect(growthExtraSummary(answers({ initialAmount: ' ' }))).not.toContain('$0');
    expect(growthExtraSummary(answers({}))).toContain('not set');
  });
  it('keeps unconfirmed claiming authority explicit', () => {
    expect(eligibilityContextSummary(answers({ checkYear: '2026', claimAuthority: 'not-sure' }))).toBe('Review year 2026 · Claim authority: Not sure');
    expect(eligibilityContextSummary(answers({ checkYear: '2027', claimAuthority: 'invalid' }))).toContain('Claim authority: not set');
  });
});
