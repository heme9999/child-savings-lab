import { projectGrowth, type GrowthInput } from './growth';

export const previewAssumptions: GrowthInput = {
  initialAmount: 0,
  includePilot: false,
  familyContribution: 100,
  familyFrequency: 'monthly',
  annualEmployerContribution: 0,
  annualReturnRate: 6,
  fundExpenseRate: 0.1,
  accountFeeRate: 0,
  birthDate: '2026-01-15',
  projectionStartDate: '2026-10-08',
  targetAge: 18
};

// The homepage illustration uses exactly the same rules as the full calculator.
export function savingsPreview(monthlyContribution = 100, annualReturnRate = 6) {
  const input = { ...previewAssumptions, familyContribution: monthlyContribution, annualReturnRate };
  const projection = projectGrowth(input);
  const points = [
    { months: 0, balance: 0, contributed: 0 },
    ...Array.from({ length: 18 }, (_, index) => {
      const result = projectGrowth({ ...input, targetAge: index + 1 });
      return { months: result.months, balance: result.endingBalance, contributed: result.totalContributed };
    })
  ];
  const ceiling = Math.max(...points.flatMap((point) => [point.balance, point.contributed]), 1);
  const pathFor = (key: 'balance' | 'contributed') => points.map((point, index) => {
    const x = 8 + (point.months / projection.months) * 344;
    const y = 144 - (point[key] / ceiling) * 128;
    return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  return {
    ...projection,
    points,
    balancePath: pathFor('balance'),
    contributionPath: pathFor('contributed'),
    areaPath: `${pathFor('balance')} L352,144 L8,144 Z`
  };
}
