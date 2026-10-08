import { describe, expect, it } from 'vitest';
import { projectGrowth } from '../../src/lib/calculators/growth';
import { previewAssumptions, savingsPreview } from '../../src/lib/calculators/preview';

describe('homepage savings illustration', () => {
  it('matches the full calculator for every visible preset and rate', () => {
    for (const amount of [50, 100, 200]) {
      for (const rate of [0, 4, 6]) {
        const preview = savingsPreview(amount, rate);
        const full = projectGrowth({ ...previewAssumptions, familyContribution: amount, annualReturnRate: rate });
        expect(preview.endingBalance).toBe(full.endingBalance);
        expect(preview.totalContributed).toBe(full.totalContributed);
        expect(preview.points.at(-1)?.balance).toBe(full.endingBalance);
        expect(preview.points.at(-1)?.contributed).toBe(full.totalContributed);
      }
    }
  });

  it('plots chronological points using actual modeled months rather than equal-age spacing', () => {
    const preview = savingsPreview();
    expect(preview.points[0]).toEqual({ months: 0, balance: 0, contributed: 0 });
    expect(preview.points).toHaveLength(19);
    expect(preview.points[1]?.months).toBe(3);
    expect(preview.points.every((point, index) => index === 0 || point.months > (preview.points[index - 1]?.months ?? -1))).toBe(true);
    expect(preview.balancePath).toMatch(/^M8\.00,144\.00 /);
    expect(preview.balancePath).toContain('L352.00,');
    expect(preview.areaPath).toMatch(/L352,144 L8,144 Z$/);
  });

  it('shows a fee-related loss at a zero assumed return without clipping the contribution line', () => {
    const preview = savingsPreview(100, 0);
    expect(preview.investmentGrowth).toBeLessThan(0);
    expect(preview.endingBalance).toBeLessThan(preview.totalContributed);
    expect(preview.contributionPath).toMatch(/L352\.00,16\.00$/);
    expect(preview.balancePath).not.toContain('NaN');
  });
});
