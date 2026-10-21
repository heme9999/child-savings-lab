import { describe, expect, it } from 'vitest';
import { referenceScenarios } from '../../src/data/reference-scenarios';

describe('public reproducibility examples', () => {
  it('keeps all examples fictional and explicit about omitted contributions and fees', () => {
    for (const { input } of referenceScenarios) {
      expect(input).toMatchObject({ birthDate: '2026-01-15', projectionStartDate: '2026-10-08', targetAge: 18, includePilot: false, initialAmount: 0, annualEmployerContribution: 0, accountFeeRate: 0 });
    }
  });
  it('reconciles the zero-return, zero-fee balance with the deposit count', () => {
    const example = referenceScenarios[0]!;
    expect(example.result.totalContributed).toBe(207 * 100);
    expect(example.result.endingBalance).toBe(207 * 100);
  });
  it('keeps the visible reference figures stable under unchanged assumptions', () => {
    expect(referenceScenarios.map(scenario => Math.round(scenario.result.endingBalance))).toEqual([20700, 35236, 70473]);
  });
});
