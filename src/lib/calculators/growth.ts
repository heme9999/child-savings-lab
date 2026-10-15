import { isValidIsoDate } from '../dates';
import type { FieldIssue } from '../forms/feedback';

export const FIRST_CONTRIBUTION_DATE = '2026-07-04';
export const CALCULATION_VERSION = '2026-10-15';
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
  contributionEndDate: string | null;
  growthPeriodEndDate: string;
  targetDate: string;
  yearly: YearlyProjection[];
}

export interface YearlyProjection {
  year: number;
  asOfDate: string;
  familyContributions: number;
  employerContributions: number;
  endingBalance: number;
  totalContributed: number;
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

// One calendar schedule drives both limit validation and the balance simulation.
// A month-end equal to the projection start is excluded, as in the original model.
function* timeline(input: GrowthInput) {
  const target = birthdayAtAge(parseDate(input.birthDate), input.targetAge);
  const growthEnd = parseDate(growthPeriodEnd(input)!);
  for (let date = endOfMonthAfterOrOn(parseDate(input.projectionStartDate)); date <= target; date = nextMonthEnd(date)) {
    const inGrowthPeriod = date <= growthEnd;
    yield {
      date, inGrowthPeriod,
      family: inGrowthPeriod && (input.familyFrequency === 'monthly' || date.getUTCMonth() === 11) ? input.familyContribution : 0,
      employer: inGrowthPeriod && date.getUTCMonth() === 11 ? input.annualEmployerContribution : 0
    };
  }
}

export function scheduledYearlyContributions(input: GrowthInput) {
  const years = new Map<number, { year: number; family: number; employer: number; total: number }>();
  for (const { date, inGrowthPeriod, family, employer } of timeline(input)) {
    if (!inGrowthPeriod) continue;
    const year = date.getUTCFullYear();
    const row = years.get(year) ?? { year, family: 0, employer: 0, total: 0 };
    row.family += family; row.employer += employer; row.total += family + employer;
    years.set(year, row);
  }
  return [...years.values()];
}

export function growthPeriodEnd(input: Pick<GrowthInput, 'birthDate'>): string | null {
  if (!isValidIsoDate(input.birthDate)) return null;
  const birthDate = parseDate(input.birthDate);
  return `${birthDate.getUTCFullYear() + 17}-12-31`;
}

export function growthInputIssues(input: GrowthInput): FieldIssue<keyof GrowthInput>[] {
  const errors: FieldIssue<keyof GrowthInput>[] = [];
  const add = (field: keyof GrowthInput, message: string) => { errors.push({ field, message }); };
  const numericFields: [keyof GrowthInput, string, number][] = [
    ['initialAmount', 'Existing starting amount', input.initialAmount],
    ['familyContribution', 'Family contribution', input.familyContribution],
    ['annualEmployerContribution', 'Annual employer contribution', input.annualEmployerContribution],
    ['annualReturnRate', 'Assumed annual return', input.annualReturnRate],
    ['fundExpenseRate', 'Eligible fund expense rate', input.fundExpenseRate],
    ['accountFeeRate', 'Separate account/trustee fee', input.accountFeeRate],
    ['targetAge', 'Target age', input.targetAge]
  ];
  for (const [field, label, value] of numericFields) {
    if (!Number.isFinite(value)) add(field, `${label}: enter a valid number; a blank is not zero.`);
  }
  if (!['monthly', 'annual'].includes(input.familyFrequency)) add('familyFrequency', 'Choose a monthly or annual contribution frequency.');
  for (const field of ['initialAmount', 'familyContribution', 'annualEmployerContribution'] as const) {
    if (input[field] < 0) add(field, 'Contribution amounts cannot be negative.');
  }
  if (!isValidIsoDate(input.birthDate)) add('birthDate', 'Enter a complete, valid birth date.');
  if (!isValidIsoDate(input.projectionStartDate)) add('projectionStartDate', 'Enter a complete, valid projection start date.');
  else if (input.projectionStartDate < FIRST_CONTRIBUTION_DATE) {
    add('projectionStartDate', 'Projection start date must be July 4, 2026 or later; Trump Accounts could not accept contributions before that date.');
  }
  if (!Number.isInteger(input.targetAge) || input.targetAge < 1 || input.targetAge > 65) {
    add('targetAge', 'Target age must be a whole number from 1 through 65.');
  }
  if (isValidIsoDate(input.birthDate) && isValidIsoDate(input.projectionStartDate) && Number.isInteger(input.targetAge)) {
    const birthDate = parseDate(input.birthDate);
    const startDate = parseDate(input.projectionStartDate);
    const targetDate = birthdayAtAge(birthDate, input.targetAge);
    const contributionEnd = new Date(Date.UTC(birthDate.getUTCFullYear() + 17, 11, 31));
    if (startDate < birthDate) add('projectionStartDate', 'Projection start date cannot be before the birth date.');
    if (startDate >= targetDate) add('targetAge', 'Target age must occur after the projection start date.');
    if (startDate > contributionEnd) add('projectionStartDate', 'This child-period calculator must start no later than the end of the growth period.');
  }
  if (input.annualReturnRate <= -100 || input.annualReturnRate > 20) add('annualReturnRate', 'Assumed return must be greater than -100% and no more than 20%.');
  if (input.fundExpenseRate < 0 || input.fundExpenseRate > 0.1) {
    add('fundExpenseRate', 'Eligible-investment fund expenses must be from 0% through the statutory 0.10% maximum.');
  }
  if (input.accountFeeRate < 0 || input.accountFeeRate > 5) add('accountFeeRate', 'Account or trustee fee rate must be from 0% through 5%.');
  if (input.annualEmployerContribution > 2500) add('annualEmployerContribution', 'Employer contributions exceed the current $2,500 annual limit.');
  if (!errors.length) {
    for (const year of scheduledYearlyContributions(input)) {
      // Allow machine rounding, not an extra cent of contribution headroom.
      if (year.total > 5000 + 1e-7) {
        const message = `${year.year}: modeled family and employer deposits exceed the current $5,000 annual benchmark. Reduce deposits scheduled in that year.`;
        add('familyContribution', message);
        if (input.annualEmployerContribution > 0) add('annualEmployerContribution', message);
        break;
      }
    }
  }
  return errors;
}

export function validateGrowthInput(input: GrowthInput): string[] {
  return [...new Set(growthInputIssues(input).map((issue) => issue.message))];
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
  let contributionEndDate: string | null = null;
  const years = new Map<number, YearlyProjection>();
  const yearRow = (date: Date): YearlyProjection => {
    const year = date.getUTCFullYear();
    const row = years.get(year) ?? { year, asOfDate: isoDate(date), familyContributions: 0, employerContributions: 0, endingBalance: balance, totalContributed };
    years.set(year, row);
    return row;
  };
  yearRow(startDate);

  for (const { date: monthEnd, inGrowthPeriod, family, employer } of timeline(input)) {
    months += 1;
    balance *= 1 + monthlyNetRate;
    if (inGrowthPeriod) {
      contributionMonths += 1;
      contributionEndDate = isoDate(monthEnd);
    }
    balance += family + employer;
    totalContributed += family + employer;
    const row = yearRow(monthEnd);
    row.asOfDate = isoDate(monthEnd);
    row.familyContributions += family; row.employerContributions += employer;
    row.endingBalance = balance; row.totalContributed = totalContributed;
  }
  // A partial target year has no extra deposits or interest beyond the month-end model.
  const finalRow = yearRow(targetDate);
  finalRow.asOfDate = isoDate(targetDate); finalRow.endingBalance = balance; finalRow.totalContributed = totalContributed;

  return {
    endingBalance: balance,
    totalContributed,
    investmentGrowth: balance - totalContributed,
    months,
    contributionMonths,
    contributionEndDate,
    growthPeriodEndDate: isoDate(contributionEnd),
    targetDate: isoDate(targetDate),
    yearly: [...years.values()]
  };
}

export function projectGrowth(input: GrowthInput): GrowthProjection {
  const errors = validateGrowthInput(input);
  if (errors.length) throw new Error(errors.join(' '));
  const combinedFeeRate = input.fundExpenseRate + input.accountFeeRate;
  const net = simulate(input, combinedFeeRate);
  const gross = simulate(input, 0);
  if (![net.endingBalance, net.totalContributed, gross.endingBalance, ...net.yearly.flatMap((year) => [year.endingBalance, year.totalContributed])].every(Number.isFinite)) {
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
