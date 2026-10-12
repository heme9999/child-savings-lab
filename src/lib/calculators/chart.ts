import type { GrowthInput, GrowthProjection } from './growth';

export function growthChart(input: GrowthInput, projection: GrowthProjection) {
  const points = [
    { date: input.projectionStartDate, balance: input.initialAmount + (input.includePilot ? 1000 : 0), contributed: input.initialAmount + (input.includePilot ? 1000 : 0) },
    ...projection.yearly.map((year) => ({ date: year.asOfDate, balance: year.endingBalance, contributed: year.totalContributed }))
  ];
  const start = Date.parse(input.projectionStartDate);
  const duration = Date.parse(projection.targetDate) - start;
  const maximum = Math.max(1, ...points.flatMap((point) => [point.balance, point.contributed]));
  const path = (key: 'balance' | 'contributed') => points.map((point, index) => {
    const x = 20 + (Date.parse(point.date) - start) / duration * 460;
    const y = 180 - point[key] / maximum * 160;
    return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
  return { balancePath: path('balance'), contributionPath: path('contributed'), start: input.projectionStartDate, end: projection.targetDate };
}
