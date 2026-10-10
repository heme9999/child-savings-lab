import { describe, expect, it } from 'vitest';
import { formNumber, growthAssumptions, growthInputFromForm } from '../../src/lib/calculators/form';
import { previewAssumptions, inputFromPreviewHash, previewPresetHash, savingsPreview } from '../../src/lib/calculators/preview';
import { projectGrowth, validateGrowthInput } from '../../src/lib/calculators/growth';

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
