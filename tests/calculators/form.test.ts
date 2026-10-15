import { describe, expect, it } from 'vitest';
import { formNumber, growthAssumptions, growthInputFromForm, reportDecimal } from '../../src/lib/calculators/form';
import { previewAssumptions, inputFromPreviewHash, previewPresetHash, savingsPreview } from '../../src/lib/calculators/preview';
import { growthInputIssues, projectGrowth, validateGrowthInput } from '../../src/lib/calculators/growth';

describe('calculator input and report contracts', () => {
  it.each(['', ' ', null, 'NaN', 'not-a-number'])('does not silently parse a missing numeric answer as zero: %s', (value) => {
    expect(Number.isNaN(formNumber(value))).toBe(true);
  });
  it('keeps an explicitly entered zero valid', () => { expect(formNumber('0')).toBe(0); });
  it('identifies a blank return rate by its field label', () => {
    const data = new FormData();
    Object.entries(previewAssumptions).forEach(([key, value]) => data.set(key, String(value)));
    data.set('annualReturnRate', '');
    expect(validateGrowthInput(growthInputFromForm(data)).join(' ')).toContain('Assumed annual return: enter a valid number');
  });
  it('includes the assumptions needed to reproduce a printed projection', () => {
    const summary = Object.fromEntries(growthAssumptions({ ...previewAssumptions, familyContribution: 200, annualReturnRate: 4 }));
    expect(summary['Family contribution']).toContain('$200.00');
    expect(summary['Assumed annual return']).toBe('4%');
    expect(summary['Pilot assumption']).toBe('Not included');
    expect(summary['Projection start date']).toBe('2026-10-08');
    expect(summary['Annual fund expense rate']).toBe('0.10%');
    expect(Object.keys(summary)).toHaveLength(11);
  });
  it.each([[0, '0.00'], [0.1, '0.10'], [0.004, '0.004'], [0.005, '0.005'], [1e-7, '0.0000001'], [1e21, '1000000000000000000000.00'], [0.10000000149011612, '0.10000000149011612']])('preserves report precision for %s', (value, expected) => {
    expect(reportDecimal(value as number)).toBe(expected);
    expect(Number(reportDecimal(value as number))).toBe(value);
  });
  it('keeps small fee rates and hypothetical sub-cent money reproducible', () => {
    const summary = Object.fromEntries(growthAssumptions({ ...previewAssumptions, fundExpenseRate: 0.004, accountFeeRate: 0.005, initialAmount: 1234.567, familyContribution: 0.001 }));
    expect(summary['Annual fund expense rate']).toBe('0.004%');
    expect(summary['Annual account/trustee fee rate']).toBe('0.005%');
    expect(summary['Existing starting amount']).toBe('$1,234.567');
    expect(summary['Family contribution']).toBe('$0.001 each month-end');
  });
  it('does not format invalid numeric assumptions as printable values', () => {
    expect(() => reportDecimal(NaN)).toThrow('finite');
    expect(() => reportDecimal(Infinity)).toThrow('finite');
  });
  it('identifies advanced and basic invalid fields without parsing message strings', () => {
    const issues = growthInputIssues({ ...previewAssumptions, initialAmount: -1, annualReturnRate: NaN, fundExpenseRate: 0.11 });
    expect(issues.map((issue) => issue.field)).toEqual(expect.arrayContaining(['initialAmount', 'annualReturnRate', 'fundExpenseRate']));
    expect(issues.map((issue) => issue.message)).toEqual(validateGrowthInput({ ...previewAssumptions, initialAmount: -1, annualReturnRate: NaN, fundExpenseRate: 0.11 }));
  });
  it('links a combined annual limit error to both deposit fields', () => {
    expect(growthInputIssues({ ...previewAssumptions, familyContribution: 300, annualEmployerContribution: 2000 }).map((issue) => issue.field)).toEqual(['familyContribution', 'annualEmployerContribution']);
  });
});

describe('privacy-preserving homepage handoff', () => {
  it('preserves every public preset and all shared assumptions', () => {
    for (const monthly of [50, 100, 200]) for (const rate of [0, 4, 6]) {
      const input = inputFromPreviewHash(previewPresetHash(monthly, rate));
      expect(input).not.toBeNull();
      expect(input!.includePilot).toBe(false);
      expect(projectGrowth(input!).endingBalance).toBe(savingsPreview(monthly, rate).endingBalance);
    }
  });
  it.each(['', '#preset=999-4', '#preset=200-20', '?preset=200-4', '#preset=200-4&birthDate=2026-01-15', '#birthDate=2026-01-15', '#preset=200-4-extra'])('ignores anything other than a supported fictional preset: %s', (hash) => {
    expect(inputFromPreviewHash(hash)).toBeNull();
  });
  it('does not create links for arbitrary financial amounts', () => { expect(previewPresetHash(12345, 4)).toBe(''); });
});
