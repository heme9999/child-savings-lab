export const portal = 'https://trumpaccounts.gov/';
export const irsAccounts = 'https://www.irs.gov/trumpaccounts';
export const irsPilot = 'https://www.irs.gov/instructions/i4547';
export const temporaryRule = 'https://www.federalregister.gov/documents/2026/09/30/2026-20026/trump-accounts';
export const proposedRule = 'https://www.federalregister.gov/documents/2026/09/30/2026-20027/trump-accounts';
export const treasuryEnrollment = 'https://home.treasury.gov/news/press-releases/sb0642';
export const reportedClaims = 'https://news.bloomberglaw.com/in-house-counsel/trump-accounts-claimed-by-under-1-of-60-million-auto-enrolled';
export const fortuneClaims = 'https://fortune.com/2026/11/10/trump-accounts-unclaimed-children-investment-accounts-claim-rate-ashok-paudel/';
export const dellGift = 'https://investamerica.org/check-dell-250-eligibility/';
export const dellStatement = 'https://x.com/MichaelDell/status/2121603738993348814';
export const dellStatementContext = 'https://viewfromthegallery.com/breakdown/dell-accounts-unclaimed';
export const programDeposits = 'https://trumpaccounts.gov/news/friends-and-family-contributions-cross-one-billion/';
export const irsDepositSnapshot = 'https://www.irs.gov/newsroom/frank-bisignano-donates-to-trump-accounts-for-children-in-brooklyn-ny';
export const treasuryAnnualReport = 'https://home.treasury.gov/system/files/266/Treasury-FY-2026-AFR.pdf';
export const spacexAnnouncement = 'https://s21.q4cdn.com/184289198/files/doc_news/2026/Nov/25/SpaceX-to-Invest-in-the-Next-Generation-of-Americans.pdf';
export const stockReporting = 'https://www.brecorder.com/news/40450832/musk-pledges-two-spacex-shares-for-every-american-child';
export const transferStatement = 'https://x.com/elonmusk/status/2125832205301878841';
export const ssaFirstNumber = 'https://www.ssa.gov/number-card/request-number-first-time';

export const claimContextSources = [
  { title: 'Automatic enrollment announcement', publisher: 'U.S. Treasury', date: 'October 1, 2026', url: treasuryEnrollment, scope: 'Enrollment count and official rollout.' },
  { title: 'First-week account claims', publisher: 'Bloomberg Law', date: 'October 2026', url: reportedClaims, scope: 'Reported remarks by Treasury tax counsel Helen Morrison in her personal capacity, covering the first week after enrollment.' },
  { title: 'First-week claim figures in context', publisher: 'Fortune', date: 'November 10, 2026', url: fortuneClaims, scope: 'Commentary citing Bloomberg Law’s reporting on claims.' },
  { title: 'Dell contribution eligibility and payment', publisher: 'Invest America', date: 'October 9, 2026', url: dellGift, scope: 'Gift administrator explains the actual birth-year and ZIP rules, including treatment of earlier enrollment.' },
  { title: 'Michael Dell’s November 14 statement', publisher: 'Michael Dell', date: 'November 14, 2026', url: dellStatement, scope: 'Donor statement about claims, without a published count for the Dell-funded group.' },
  { title: 'Transcript and context for the Dell statement', publisher: 'View from the Gallery', date: 'November 17, 2026', url: dellStatementContext, scope: 'Includes the original post and explains the absence of an independently published claim count.' },
  { title: 'October claim-gap and gift reporting', publisher: 'TheStreet', date: 'November 1, 2026', url: 'https://www.thestreet.com/taxes/irs-ceo-bisignano-trump-accounts-brooklyn-donation-60-million-auto-enrolled-claim-gap', scope: 'Reports Morrison’s remarks and links to CNBC’s coverage of the original Dell pledge. Use the administrator’s rules for actual allocations.' },
  { title: 'Contribution and account-claim milestone', publisher: 'TrumpAccounts.gov', date: 'November 24, 2026', url: programDeposits, scope: 'Program-wide deposits and official claim and contribution instructions.' },
  { title: 'October account and deposit snapshot', publisher: 'Internal Revenue Service', date: 'October 29, 2026', url: irsDepositSnapshot, scope: 'Account count and deposit total from the same date for the program-wide illustration.' },
  { title: 'FY 2026 Agency Financial Report', publisher: 'U.S. Treasury', date: 'November 2026', url: treasuryAnnualReport, scope: 'Almost 70 million accounts at the reported rollout milestone. This is an account count, not an active-account count.' },
  { title: 'SpaceX contribution announcement', publisher: 'SpaceX', date: 'November 25, 2026', url: spacexAnnouncement, scope: 'Conditional share pledge and separate Shotwell announcement.' },
  { title: 'Reporting on SpaceX share price and pledge', publisher: 'Reuters via Business Recorder', date: 'November 26, 2026', url: stockReporting, scope: 'November 25 closing price and unanswered questions about the pledge.' },
  { title: 'Stated share transfer timing', publisher: 'Elon Musk', date: 'November 26, 2026', url: transferStatement, scope: 'Announced December 2026 and June 2027 timing, subject to confirmation.' },
  { title: 'Proposed Trump Account regulations', publisher: 'Treasury and IRS', date: 'September 30, 2026', url: proposedRule, scope: 'Companion proposal with a November 30, 2026 public-comment deadline.' }
] as const;
