import { CALCULATION_VERSION, type GrowthInput, type GrowthProjection } from './growth';

export function contributionNote(result: GrowthProjection): string {
  const window = result.contributionEndDate
    ? `${result.contributionMonths} eligible contribution month-ends modeled, ending ${result.contributionEndDate}.`
    : 'No eligible contribution month-end falls within this projection.';
  return `${window} Statutory growth period ends ${result.growthPeriodEndDate}. Projection target: ${result.targetDate}. Returns are not guaranteed. Taxes, withdrawals, and partial months are not modeled.`;
}

// Required blanks remain invalid, rather than Number('') silently becoming zero.
export function formNumber(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string' || !value.trim()) return Number.NaN;
  return Number(value);
}

export function growthInputFromForm(data: Pick<FormData, 'get'>): GrowthInput {
  return {
    initialAmount: formNumber(data.get('initialAmount')),
    includePilot: data.get('includePilot') === 'true',
    familyContribution: formNumber(data.get('familyContribution')),
    familyFrequency: String(data.get('familyFrequency')) as GrowthInput['familyFrequency'],
    annualEmployerContribution: formNumber(data.get('annualEmployerContribution')),
    annualReturnRate: formNumber(data.get('annualReturnRate')),
    fundExpenseRate: formNumber(data.get('fundExpenseRate')),
    accountFeeRate: formNumber(data.get('accountFeeRate')),
    birthDate: String(data.get('birthDate') ?? ''),
    projectionStartDate: String(data.get('projectionStartDate') ?? ''),
    targetAge: formNumber(data.get('targetAge'))
  };
}

export function growthAssumptions(input: GrowthInput): [string, string][] {
  const usd = (value: number) => `$${reportDecimal(value, true)}`;
  return [
    ['Birth date (hypothetical values are welcome)', input.birthDate],
    ['Projection start date', input.projectionStartDate],
    ['Existing starting amount', usd(input.initialAmount)],
    ['Family contribution', `${usd(input.familyContribution)} ${input.familyFrequency === 'monthly' ? 'each month-end' : 'each December 31'}`],
    ['Pilot assumption', input.includePilot ? '$1,000 included in the starting balance; eligibility and payment not confirmed' : 'Not included'],
    ['Annual employer contribution', `${usd(input.annualEmployerContribution)} each December 31`],
    ['Assumed annual return', `${input.annualReturnRate}%`],
    ['Annual fund expense rate', `${reportDecimal(input.fundExpenseRate)}%`],
    ['Annual account/trustee fee rate', `${reportDecimal(input.accountFeeRate)}%`],
    ['Target age', String(input.targetAge)],
    ['Calculation version (not a policy review date)', CALCULATION_VERSION]
  ];
}

// Expand the shortest round-trip Number representation, without rounding away
// valid inputs such as 0.004% or sub-cent hypothetical contributions.
export function reportDecimal(value: number, grouped = false): string {
  if (!Number.isFinite(value)) throw new Error('Report assumptions must be finite.');
  const sign = value < 0 ? '-' : '';
  const [coefficient = '0', exponent = '0'] = String(Math.abs(value)).split('e');
  const [whole = '0', fraction = ''] = coefficient.split('.');
  const digits = whole + fraction;
  const point = whole.length + Number(exponent);
  const expanded = point <= 0 ? `0.${'0'.repeat(-point)}${digits}`
    : point >= digits.length ? digits + '0'.repeat(point - digits.length)
    : `${digits.slice(0, point)}.${digits.slice(point)}`;
  const [integer = '0', decimals = ''] = expanded.split('.');
  return `${sign}${grouped ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : integer}.${decimals.padEnd(2, '0')}`;
}
