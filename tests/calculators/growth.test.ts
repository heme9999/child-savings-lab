import { describe, expect, it } from 'vitest';
import { annualFamilyContribution, projectGrowth, projectScenarios, validateGrowthInput } from '../../src/lib/calculators/growth';
import type { GrowthInput } from '../../src/lib/calculators/growth';

const base: GrowthInput = {
  initialAmount: 0,
  includePilot: false,
  familyContribution: 0,
  familyFrequency: 'monthly',
  annualEmployerContribution: 0,
  annualReturnRate: 0,
  annualFeeRate: 0,
  currentAge: 0,
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

  it('models monthly family contributions', () => {
    const result = projectGrowth({ ...base, familyContribution: 100, targetAge: 1 });
    expect(result.totalContributed).toBe(1200);
    expect(result.endingBalance).toBe(1200);
  });

  it('models annual family and employer contributions', () => {
    const result = projectGrowth({
      ...base,
      familyContribution: 2000,
      familyFrequency: 'annual',
      annualEmployerContribution: 2500,
      targetAge: 1
    });
    expect(result.totalContributed).toBe(4500);
  });

  it('supports a negative return without treating losses as gains', () => {
    const result = projectGrowth({ ...base, initialAmount: 1000, annualReturnRate: -10, targetAge: 1 });
    expect(result.endingBalance).toBeLessThan(1000);
    expect(result.investmentGrowth).toBeLessThan(0);
  });

  it('shows a positive fee impact', () => {
    const result = projectGrowth({ ...base, initialAmount: 1000, annualReturnRate: 6, annualFeeRate: 1, targetAge: 10 });
    expect(result.feeImpact).toBeGreaterThan(0);
  });

  it('compounds a normal return and keeps principal separate', () => {
    const result = projectGrowth({ ...base, initialAmount: 1000, annualReturnRate: 6, targetAge: 18 });
    expect(result.endingBalance).toBeCloseTo(2854.34, 1);
    expect(result.totalContributed).toBe(1000);
    expect(result.investmentGrowth).toBeCloseTo(result.endingBalance - 1000, 8);
  });

  it('stops child-period contributions at age 18 for later target ages', () => {
    const result = projectGrowth({ ...base, currentAge: 17, targetAge: 30, familyContribution: 100 });
    expect(result.contributionYears).toBe(1);
    expect(result.totalContributed).toBe(1200);
  });

  it('returns three ordered scenarios', () => {
    const scenarios = projectScenarios({ ...base, initialAmount: 1000, annualReturnRate: 6 });
    expect(scenarios.map((item) => item.rate)).toEqual([4, 6, 8]);
    expect(scenarios[0]!.projection.endingBalance).toBeLessThan(scenarios[2]!.projection.endingBalance);
  });

  it('converts monthly family contributions to an annual amount', () => {
    expect(annualFamilyContribution({ ...base, familyContribution: 100 })).toBe(1200);
  });

  it('enforces the employer and aggregate limits', () => {
    expect(validateGrowthInput({ ...base, annualEmployerContribution: 2600 }).join(' ')).toContain('$2,500');
    expect(validateGrowthInput({ ...base, familyContribution: 300, annualEmployerContribution: 2000 }).join(' ')).toContain('$5,000');
  });

  it('validates age, return, fee, and negative contributions', () => {
    const errors = validateGrowthInput({
      ...base,
      familyContribution: -1,
      currentAge: 18,
      targetAge: 70,
      annualReturnRate: 21,
      annualFeeRate: 6
    });
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });
});
