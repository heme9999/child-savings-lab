export type SourceStatus = 'temporary regulations' | 'official guidance' | 'form instructions' | 'proposed rule' | 'technical release' | 'official overview' | 'regulator overview';

export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
  verifiedAt: string;
  effectiveFrom: string;
  status: SourceStatus;
  note: string;
}

export const sources: SourceRecord[] = [
  {
    id: 'TREASURY-TD-10056',
    title: 'TD 10056: Trump Accounts',
    publisher: 'U.S. Treasury and Internal Revenue Service',
    url: 'https://www.federalregister.gov/documents/2026/09/30/2026-20026/trump-accounts',
    publishedAt: '2026-09-30',
    verifiedAt: '2026-10-08',
    effectiveFrom: '2026-09-30',
    status: 'temporary regulations',
    note: 'Controlling temporary rules for automatic enrollment, auto accounts, claiming, activation, and qualified general contributions.'
  },
  {
    id: 'IRS-TRUMP-ACCOUNTS',
    title: 'Trump Accounts',
    publisher: 'Internal Revenue Service',
    url: 'https://www.irs.gov/trumpaccounts',
    publishedAt: '2026-05-01',
    verifiedAt: '2026-10-08',
    effectiveFrom: '2026-01-01',
    status: 'official overview',
    note: 'Current IRS entry point for eligibility, online Form 4547 submission, and status checks.'
  },
  {
    id: 'IRS-FORM-4547',
    title: 'About Form 4547, Trump Account Election(s)',
    publisher: 'Internal Revenue Service',
    url: 'https://www.irs.gov/forms-pubs/about-form-4547',
    publishedAt: '2025-12-01',
    verifiedAt: '2026-10-08',
    effectiveFrom: '2026-01-01',
    status: 'official guidance',
    note: 'Current form hub and revision history.'
  },
  {
    id: 'IRS-FORM-4547-INSTRUCTIONS',
    title: 'Instructions for Form 4547 (12/2025)',
    publisher: 'Internal Revenue Service',
    url: 'https://www.irs.gov/instructions/i4547',
    publishedAt: '2025-12-01',
    verifiedAt: '2026-10-08',
    effectiveFrom: '2026-01-01',
    status: 'form instructions',
    note: 'Primary source for account, pilot, authorized-individual, contribution, investment, and distribution rules used by the tools.'
  },
  {
    id: 'IRS-REV-PROC-2026-25',
    title: 'Revenue Procedure 2026-25',
    publisher: 'Internal Revenue Service',
    url: 'https://www.irs.gov/pub/irs-irbs/irb26-29.pdf',
    publishedAt: '2026-07-13',
    verifiedAt: '2026-10-08',
    effectiveFrom: '2026-07-13',
    status: 'official guidance',
    note: 'Addresses the transfer-tax safe harbor for certain individual contributions and confirms the $5,000 aggregate annual limit.'
  },
  {
    id: 'DOL-TR-2026-02',
    title: 'Technical Release 2026-02',
    publisher: 'U.S. Department of Labor',
    url: 'https://www.dol.gov/sites/dolgov/files/ebsa/employers-and-advisers/guidance/technical-releases/26-02.pdf',
    publishedAt: '2026-07-01',
    verifiedAt: '2026-10-08',
    effectiveFrom: '2026-07-01',
    status: 'technical release',
    note: 'DOL guidance on ERISA treatment and employer contribution programs.'
  },
  {
    id: 'IRS-PROPOSED-EMPLOYER-2026',
    title: 'Proposed Regulations: Trump Account Contribution Programs',
    publisher: 'U.S. Treasury and Internal Revenue Service',
    url: 'https://www.irs.gov/pub/irs-irbs/irb26-37.pdf',
    publishedAt: '2026-09-08',
    verifiedAt: '2026-10-08',
    effectiveFrom: '2026-08-11',
    status: 'proposed rule',
    note: 'Proposed—not final—employer program rules. Employer pages label this status explicitly.'
  },
  {
    id: 'IRS-PROPOSED-INVESTMENTS-2026',
    title: 'Proposed Regulations: Eligible Investments for Trump Accounts',
    publisher: 'U.S. Treasury and Internal Revenue Service',
    url: 'https://www.irs.gov/irb/2026-38_irb',
    publishedAt: '2026-09-14',
    verifiedAt: '2026-10-08',
    effectiveFrom: '2026-08-21',
    status: 'proposed rule',
    note: 'Explains the statutory 0.10% fund-expense ceiling and distinguishes investment-fund expenses from trustee or intermediary fees.'
  },
  {
    id: 'IRS-529-QA',
    title: '529 Plans: Questions and Answers',
    publisher: 'Internal Revenue Service',
    url: 'https://www.irs.gov/newsroom/529-plans-questions-and-answers',
    publishedAt: '2024-01-01',
    verifiedAt: '2026-10-10',
    effectiveFrom: '2024-01-01',
    status: 'official overview',
    note: 'Federal tax overview for qualified tuition programs. Some examples describe older law; historical K–12 dollar limits are not used as current 2026 limits.'
  },
  {
    id: 'SEC-529-INTRO', title: 'An Introduction to 529 Plans — Investor Bulletin',
    publisher: 'U.S. Securities and Exchange Commission, Investor.gov',
    url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/introduction-529-plans-investor-bulletin',
    publishedAt: '2026-01-28', verifiedAt: '2026-10-10', effectiveFrom: 'Educational bulletin, not a regulation',
    status: 'official overview', note: 'Dated overview of plan types, investment risks, costs, and qualified uses. A staff bulletin does not replace governing law or plan terms.'
  },
  {
    id: 'SEC-529-QUESTIONS', title: '10 Questions to Consider Before Opening a 529 Account',
    publisher: 'U.S. Securities and Exchange Commission, Investor.gov',
    url: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-10',
    publishedAt: '2026-01-28', verifiedAt: '2026-10-10', effectiveFrom: 'Educational bulletin, not a regulation',
    status: 'official overview', note: 'Questions about costs, state incentives, account arrangements, and unused funds; no provider ranking.'
  },
  {
    id: 'IRS-IRA-LIMITS', title: 'Retirement Topics — IRA Contribution Limits',
    publisher: 'Internal Revenue Service',
    url: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-ira-contribution-limits',
    publishedAt: 'Not specified here; consult the source revision', verifiedAt: '2026-10-10', effectiveFrom: 'Use the applicable tax-year rules',
    status: 'official guidance', note: 'Combined IRA limits, taxable-compensation requirement, and Roth income limitations. The comparison does not calculate a child’s allowable contribution.'
  },
  {
    id: 'IRS-ABLE-OVERVIEW', title: 'ABLE Accounts — Tax Benefit for People With Disabilities',
    publisher: 'Internal Revenue Service',
    url: 'https://www.irs.gov/government-entities/federal-state-local-governments/able-accounts-tax-benefit-for-people-with-disabilities',
    publishedAt: 'Not specified here; contains historical examples', verifiedAt: '2026-10-10', effectiveFrom: 'Check current tax-year and program rules',
    status: 'official overview', note: 'Source for the account purpose and qualified-disability-expense tax treatment, not for current annual dollar limits or disability-onset-age thresholds.'
  },
  {
    id: 'FINRA-CUSTODIAL', title: 'Saving for College: UGMA and UTMA Custodial Accounts',
    publisher: 'Financial Industry Regulatory Authority (FINRA)',
    url: 'https://syndication.finra.org/content/saving-college-ugma-and-utma-custodial-accounts',
    publishedAt: '2017-10-02', verifiedAt: '2026-10-10', effectiveFrom: 'State law governs; historical overview',
    status: 'regulator overview', note: 'Used only for irrevocable child ownership and custodial structure. Historical tax thresholds and financial-aid figures are not used as current rules; FINRA is not a federal tax authority.'
  }
];

export const sourceById = Object.fromEntries(sources.map((source) => [source.id, source]));
