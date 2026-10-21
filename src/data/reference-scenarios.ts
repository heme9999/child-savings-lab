import { projectGrowth } from '../lib/calculators/growth';
import { previewAssumptions } from '../lib/calculators/preview';

// Fictional, reproducible software examples. No real household data is used.
export const referenceScenarios = [
  { label: 'Arithmetic check', familyContribution: 100, annualReturnRate: 0, fundExpenseRate: 0 },
  { label: 'Default illustration', familyContribution: 100, annualReturnRate: 6, fundExpenseRate: 0.1 },
  { label: 'Higher contribution', familyContribution: 200, annualReturnRate: 6, fundExpenseRate: 0.1 }
].map(scenario => {
  const input = { ...previewAssumptions, ...scenario };
  return { ...scenario, input, result: projectGrowth(input) };
});
