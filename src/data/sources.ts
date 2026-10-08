export type SourceStatus = 'temporary regulations' | 'official guidance' | 'form instructions' | 'proposed rule' | 'technical release' | 'official overview';

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
    verifiedAt: '2026-10-08',
    effectiveFrom: '2024-01-01',
    status: 'official overview',
    note: 'Federal tax overview for qualified tuition programs.'
  }
];

export const sourceById = Object.fromEntries(sources.map((source) => [source.id, source]));
