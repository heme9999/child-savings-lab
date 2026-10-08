export type ContributionFrequency = 'monthly' | 'annual';

export interface GrowthInput {
  initialAmount: number;
  includePilot: boolean;
  familyContribution: number;
  familyFrequency: ContributionFrequency;
  annualEmployerContribution: number;
  annualReturnRate: number;
  annualFeeRate: number;
  currentAge: number;
  targetAge: number;
}

export interface GrowthProjection {
  endingBalance: number;
  totalContributed: number;
  investmentGrowth: number;
  feeImpact: number;
  years: number;
  contributionYears: number;
}

export function annualFamilyContribution(input: GrowthInput): number {
  return input.familyFrequency === 'monthly' ? input.familyContribution * 12 : input.familyContribution;
}

export function validateGrowthInput(input: GrowthInput): string[] {
  const errors: string[] = [];
  const numericValues = [
    input.initialAmount,
    input.familyContribution,
    input.annualEmployerContribution,
    input.annualReturnRate,
    input.annualFeeRate,
    input.currentAge,
    input.targetAge
  ];
  if (numericValues.some((value) => !Number.isFinite(value))) errors.push('All fields must contain valid numbers.');
  if (input.initialAmount < 0 || input.familyContribution < 0 || input.annualEmployerContribution < 0) {
    errors.push('Contribution amounts cannot be negative.');
  }
  if (input.currentAge < 0 || input.currentAge >= 18) errors.push('Current age must be from 0 through 17.');
  if (input.targetAge <= input.currentAge || input.targetAge > 65) errors.push('Target age must be greater than current age and no more than 65.');
  if (input.annualReturnRate <= -100 || input.annualReturnRate > 20) errors.push('Assumed return must be greater than -100% and no more than 20%.');
  if (input.annualFeeRate < 0 || input.annualFeeRate > 5) errors.push('Fee rate must be from 0% through 5%.');
  if (input.annualEmployerContribution > 2500) errors.push('Employer contributions exceed the current $2,500 annual limit.');
  if (annualFamilyContribution(input) + input.annualEmployerContribution > 5000.01) {
    errors.push('Family and employer contributions together exceed the current $5,000 annual limit.');
  }
  return errors;
}

function simulate(input: GrowthInput, annualFeeRate: number): Omit<GrowthProjection, 'feeImpact'> {
  const years = input.targetAge - input.currentAge;
  const contributionYears = Math.max(0, Math.min(years, 18 - input.currentAge));
  const annualReturn = input.annualReturnRate / 100;
  const monthlyGrowth = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const monthlyFee = annualFeeRate / 100 / 12;
  const monthlyNetRate = Math.max(-0.999999, monthlyGrowth - monthlyFee);
  const opening = input.initialAmount + (input.includePilot ? 1000 : 0);
  let balance = opening;
  let totalContributed = opening;

  for (let month = 1; month <= years * 12; month += 1) {
    balance *= 1 + monthlyNetRate;
    const yearIndex = Math.ceil(month / 12);
    const withinGrowthPeriod = yearIndex <= contributionYears;
    if (withinGrowthPeriod && input.familyFrequency === 'monthly') {
      balance += input.familyContribution;
      totalContributed += input.familyContribution;
    }
    if (withinGrowthPeriod && month % 12 === 0) {
      const annualDeposit = (input.familyFrequency === 'annual' ? input.familyContribution : 0) + input.annualEmployerContribution;
      balance += annualDeposit;
      totalContributed += annualDeposit;
    }
  }

  return {
    endingBalance: balance,
    totalContributed,
    investmentGrowth: balance - totalContributed,
    years,
    contributionYears
  };
}

export function projectGrowth(input: GrowthInput): GrowthProjection {
  const errors = validateGrowthInput(input);
  if (errors.length) throw new Error(errors.join(' '));
  const net = simulate(input, input.annualFeeRate);
  const gross = simulate(input, 0);
  return {
    ...net,
    feeImpact: Math.max(0, gross.endingBalance - net.endingBalance)
  };
}

export function projectScenarios(input: GrowthInput) {
  const rates = [input.annualReturnRate - 2, input.annualReturnRate, input.annualReturnRate + 2];
  return rates.map((rate) => ({ rate, projection: projectGrowth({ ...input, annualReturnRate: rate }) }));
}
