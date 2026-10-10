import { isValidIsoDate } from '../dates';

export const FIRST_CONTRIBUTION_DATE = '2026-07-04';
export const CALCULATION_VERSION = '2026-10-10';
export type ContributionFrequency = 'monthly' | 'annual';

export interface GrowthInput {
  initialAmount: number;
  includePilot: boolean;
  familyContribution: number;
  familyFrequency: ContributionFrequency;
  annualEmployerContribution: number;
  annualReturnRate: number;
  fundExpenseRate: number;
  accountFeeRate: number;
  birthDate: string;
  projectionStartDate: string;
  targetAge: number;
}

export interface GrowthProjection {
  endingBalance: number;
  totalContributed: number;
  investmentGrowth: number;
  feeImpact: number;
  months: number;
  contributionMonths: number;
  contributionEndDate: string;
  targetDate: string;
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function birthdayAtAge(birthDate: Date, age: number): Date {
  const year = birthDate.getUTCFullYear() + age;
  const month = birthDate.getUTCMonth();
  const day = birthDate.getUTCDate();
  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCMonth() !== month) return new Date(Date.UTC(year, month + 1, 0));
  return date;
}

function endOfMonthAfterOrOn(value: Date): Date {
  const monthEnd = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0));
  if (monthEnd > value) return monthEnd;
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 2, 0));
}

function nextMonthEnd(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 2, 0));
}

export function annualFamilyContribution(input: GrowthInput): number {
  return input.familyFrequency === 'monthly' ? input.familyContribution * 12 : input.familyContribution;
}

export function growthPeriodEnd(input: Pick<GrowthInput, 'birthDate'>): string | null {
  if (!isValidIsoDate(input.birthDate)) return null;
  const birthDate = parseDate(input.birthDate);
  return `${birthDate.getUTCFullYear() + 17}-12-31`;
}

export function validateGrowthInput(input: GrowthInput): string[] {
  const errors: string[] = [];
  const numericFields: [string, number][] = [
    ['Existing starting amount', input.initialAmount],
    ['Family contribution', input.familyContribution],
    ['Annual employer contribution', input.annualEmployerContribution],
    ['Assumed annual return', input.annualReturnRate],
    ['Eligible fund expense rate', input.fundExpenseRate],
    ['Separate account/trustee fee', input.accountFeeRate],
    ['Target age', input.targetAge]
  ];
  for (const [label, value] of numericFields) {
    if (!Number.isFinite(value)) errors.push(`${label}: enter a valid number; a blank is not zero.`);
  }
  if (!['monthly', 'annual'].includes(input.familyFrequency)) errors.push('Choose a monthly or annual contribution frequency.');
  if (input.initialAmount < 0 || input.familyContribution < 0 || input.annualEmployerContribution < 0) {
    errors.push('Contribution amounts cannot be negative.');
  }
  if (!isValidIsoDate(input.birthDate)) errors.push('Enter a complete, valid birth date.');
  if (!isValidIsoDate(input.projectionStartDate)) errors.push('Enter a complete, valid projection start date.');
  else if (input.projectionStartDate < FIRST_CONTRIBUTION_DATE) {
    errors.push('Projection start date must be July 4, 2026 or later; Trump Accounts could not accept contributions before that date.');
  }
  if (!Number.isInteger(input.targetAge) || input.targetAge < 1 || input.targetAge > 65) {
    errors.push('Target age must be a whole number from 1 through 65.');
  }
  if (isValidIsoDate(input.birthDate) && isValidIsoDate(input.projectionStartDate) && Number.isInteger(input.targetAge)) {
    const birthDate = parseDate(input.birthDate);
    const startDate = parseDate(input.projectionStartDate);
    const targetDate = birthdayAtAge(birthDate, input.targetAge);
    const contributionEnd = new Date(Date.UTC(birthDate.getUTCFullYear() + 17, 11, 31));
    if (startDate < birthDate) errors.push('Projection start date cannot be before the birth date.');
    if (startDate >= targetDate) errors.push('Target age must occur after the projection start date.');
    if (startDate > contributionEnd) errors.push('This child-period calculator must start no later than the end of the growth period.');
  }
  if (input.annualReturnRate <= -100 || input.annualReturnRate > 20) errors.push('Assumed return must be greater than -100% and no more than 20%.');
  if (input.fundExpenseRate < 0 || input.fundExpenseRate > 0.1) {
    errors.push('Eligible-investment fund expenses must be from 0% through the statutory 0.10% maximum.');
  }
  if (input.accountFeeRate < 0 || input.accountFeeRate > 5) errors.push('Account or trustee fee rate must be from 0% through 5%.');
  if (input.annualEmployerContribution > 2500) errors.push('Employer contributions exceed the current $2,500 annual limit.');
  if (annualFamilyContribution(input) + input.annualEmployerContribution > 5000.01) {
    errors.push('Family and employer contributions together exceed the current $5,000 annual limit.');
  }
  return errors;
}

function simulate(input: GrowthInput, annualFeeRate: number): Omit<GrowthProjection, 'feeImpact'> {
  const birthDate = parseDate(input.birthDate);
  const startDate = parseDate(input.projectionStartDate);
  const targetDate = birthdayAtAge(birthDate, input.targetAge);
  const contributionEnd = new Date(Date.UTC(birthDate.getUTCFullYear() + 17, 11, 31));
  const annualReturn = input.annualReturnRate / 100;
  const monthlyGrowth = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const monthlyFee = annualFeeRate / 100 / 12;
  const monthlyNetRate = Math.max(-0.999999, monthlyGrowth - monthlyFee);
  const opening = input.initialAmount + (input.includePilot ? 1000 : 0);
  let balance = opening;
  let totalContributed = opening;
  let months = 0;
  let contributionMonths = 0;

  for (let monthEnd = endOfMonthAfterOrOn(startDate); monthEnd <= targetDate; monthEnd = nextMonthEnd(monthEnd)) {
    months += 1;
    balance *= 1 + monthlyNetRate;
    if (monthEnd <= contributionEnd) {
      contributionMonths += 1;
      if (input.familyFrequency === 'monthly') {
        balance += input.familyContribution;
        totalContributed += input.familyContribution;
      }
      if (monthEnd.getUTCMonth() === 11) {
        const annualDeposit = (input.familyFrequency === 'annual' ? input.familyContribution : 0) + input.annualEmployerContribution;
        balance += annualDeposit;
        totalContributed += annualDeposit;
      }
    }
  }

  return {
    endingBalance: balance,
    totalContributed,
    investmentGrowth: balance - totalContributed,
    months,
    contributionMonths,
    contributionEndDate: isoDate(contributionEnd),
    targetDate: isoDate(targetDate)
  };
}

export function projectGrowth(input: GrowthInput): GrowthProjection {
  const errors = validateGrowthInput(input);
  if (errors.length) throw new Error(errors.join(' '));
  const combinedFeeRate = input.fundExpenseRate + input.accountFeeRate;
  const net = simulate(input, combinedFeeRate);
  const gross = simulate(input, 0);
  if (![net.endingBalance, net.totalContributed, gross.endingBalance].every(Number.isFinite)) {
    throw new Error('The projection is too large to calculate reliably. Reduce the amounts or time horizon.');
  }
  return {
    ...net,
    feeImpact: Math.max(0, gross.endingBalance - net.endingBalance)
  };
}

export function projectScenarios(input: GrowthInput) {
  const errors = validateGrowthInput(input);
  if (errors.length) throw new Error(errors.join(' '));
  const rates = [input.annualReturnRate - 2, input.annualReturnRate, input.annualReturnRate + 2];
  return rates.filter((rate) => rate > -100 && rate <= 20)
    .map((rate) => ({ rate, projection: projectGrowth({ ...input, annualReturnRate: rate }) }));
}
