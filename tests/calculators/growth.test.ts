import { describe, expect, it } from 'vitest';
import { annualFamilyContribution, growthPeriodEnd, projectGrowth, projectScenarios, validateGrowthInput } from '../../src/lib/calculators/growth';
import type { GrowthInput } from '../../src/lib/calculators/growth';

const base: GrowthInput = {
  initialAmount: 0,
  includePilot: false,
  familyContribution: 0,
  familyFrequency: 'monthly',
  annualEmployerContribution: 0,
  annualReturnRate: 0,
  fundExpenseRate: 0,
  accountFeeRate: 0,
  birthDate: '2026-07-04',
  projectionStartDate: '2026-07-04',
  targetAge: 18
};

describe('growth projection', () => {
  it('returns zero for a zero-balance, zero-contribution case', () => {
    expect(projectGrowth(base).endingBalance).toBe(0);
  });

  it('keeps a one-time starting amount unchanged at zero return', () => {
    const result = projectGrowth({ ...base, initialAmount: 2500 });
    expect(result.endingBalance).toBe(2500);
    expect(result.totalContributed).toBe(2500);
    expect(result.investmentGrowth).toBe(0);
  });

  it('adds the optional pilot amount to principal', () => {
    expect(projectGrowth({ ...base, includePilot: true }).totalContributed).toBe(1000);
  });

  it('models monthly family contributions to a target birthday', () => {
    const result = projectGrowth({ ...base, familyContribution: 100, targetAge: 1 });
    expect(result.contributionMonths).toBe(12);
    expect(result.totalContributed).toBe(1200);
  });

  it('models annual family and employer contributions at calendar year end', () => {
    const result = projectGrowth({
      ...base,
      familyContribution: 2000,
      familyFrequency: 'annual',
      annualEmployerContribution: 2500,
      targetAge: 1
    });
    expect(result.totalContributed).toBe(4500);
  });

  it('uses the statutory calendar-year growth-period end', () => {
    expect(growthPeriodEnd({ birthDate: '2009-06-01' })).toBe('2026-12-31');
    const result = projectGrowth({
      ...base,
      birthDate: '2009-06-01',
      projectionStartDate: '2026-10-08',
      targetAge: 30,
      familyContribution: 100
    });
    expect(result.contributionMonths).toBe(3);
    expect(result.totalContributed).toBe(300);
  });

  it('supports a negative return without treating losses as gains', () => {
    const result = projectGrowth({ ...base, initialAmount: 1000, annualReturnRate: -10, targetAge: 1 });
    expect(result.endingBalance).toBeLessThan(1000);
    expect(result.investmentGrowth).toBeLessThan(0);
  });

  it('shows a positive combined fee impact', () => {
    const result = projectGrowth({ ...base, initialAmount: 1000, annualReturnRate: 6, fundExpenseRate: 0.1, accountFeeRate: 0.2, targetAge: 10 });
    expect(result.feeImpact).toBeGreaterThan(0);
  });

  it('returns three ordered scenarios', () => {
    const scenarios = projectScenarios({ ...base, initialAmount: 1000, annualReturnRate: 6 });
    expect(scenarios.map((item) => item.rate)).toEqual([4, 6, 8]);
    expect(scenarios[0]!.projection.endingBalance).toBeLessThan(scenarios[2]!.projection.endingBalance);
  });

  it('converts monthly family contributions to an annual amount', () => {
    expect(annualFamilyContribution({ ...base, familyContribution: 100 })).toBe(1200);
  });

  it.each([-99.99, -99, -98, 18, 18.25, 20])('calculates supported boundary scenarios without throwing at %s%%', (annualReturnRate) => {
    const input = { ...base, familyContribution: 100, annualReturnRate };
    const scenarios = projectScenarios(input);
    expect(scenarios.some((scenario) => scenario.rate === annualReturnRate)).toBe(true);
    expect(scenarios.every(({ rate, projection }) => rate > -100 && rate <= 20 && Number.isFinite(projection.endingBalance))).toBe(true);
  });

  it('omits unsupported scenarios rather than changing the selected return', () => {
    expect(projectScenarios({ ...base, annualReturnRate: 20 }).map(({ rate }) => rate)).toEqual([18, 20]);
    expect(projectScenarios({ ...base, annualReturnRate: -99 }).map(({ rate }) => rate)).toEqual([-99, -97]);
  });

  it.each([-100, 20.25, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid center returns: %s', (annualReturnRate) => {
    expect(() => projectScenarios({ ...base, annualReturnRate })).toThrow();
  });

  it.each(['2025-02-01', '2026-01-01', '2026-07-03'])('rejects a projection before deposits were permitted: %s', (projectionStartDate) => {
    expect(() => projectGrowth({ ...base, birthDate: '2025-01-15', projectionStartDate, familyContribution: 100 })).toThrow('July 4, 2026');
  });

  it('starts the audited example at the first permitted monthly deposit', () => {
    const result = projectGrowth({ ...base, birthDate: '2025-01-15', projectionStartDate: '2026-07-04', familyContribution: 100 });
    expect(result.contributionMonths).toBe(198);
    expect(result.totalContributed).toBe(19800);
  });

  it('rejects an invalid contribution frequency', () => {
    expect(validateGrowthInput({ ...base, familyFrequency: 'weekly' as GrowthInput['familyFrequency'] }).join(' ')).toContain('frequency');
  });

  it('does not return infinite or NaN balances for overflowing inputs', () => {
    expect(() => projectGrowth({ ...base, initialAmount: 1e308, annualReturnRate: 20 })).toThrow('too large');
  });

  it('enforces employer, aggregate, and fund-expense limits', () => {
    expect(validateGrowthInput({ ...base, annualEmployerContribution: 2600 }).join(' ')).toContain('$2,500');
    expect(validateGrowthInput({ ...base, familyContribution: 300, annualEmployerContribution: 2000 }).join(' ')).toContain('$5,000');
    expect(validateGrowthInput({ ...base, fundExpenseRate: 0.11 }).join(' ')).toContain('0.10%');
  });

  it('validates dates, return, account fee, target age, and negative contributions', () => {
    const errors = validateGrowthInput({
      ...base,
      familyContribution: -1,
      birthDate: '',
      projectionStartDate: '',
      targetAge: 70,
      annualReturnRate: 21,
      accountFeeRate: 6
    });
    expect(errors.length).toBeGreaterThanOrEqual(6);
  });
});
