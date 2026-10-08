# Child Savings Lab — MVP plan

## Positioning

Child Savings Lab is an independent U.S. family-finance tool platform. Trump Accounts are the first search and product cluster, not the brand boundary. The same information architecture can expand to 529 plans, UGMA/UTMA, Custodial Roth IRAs, ABLE accounts, children’s investing, and employer benefits.

Primary users are U.S. parents, expectant parents, grandparents, and guardians. Secondary users are HR, payroll, small-business, and benefits teams.

## Product strategy

1. Lead with utility: eligibility, growth, and account-comparison tools.
2. Build authority through first-party government sources and visible rule dates.
3. Earn links with useful account-status, claiming, activation, pilot-election, and growth tools—not thin-volume publishing.
4. Add a carefully disclosed affiliate layer only after specific programs are verified.
5. Expand to B2B employer checklists and leads after professional review.
6. Consider advanced reports, embeds, white-label tools, and a rule-update API only after usage validates demand.

## Technical architecture

- Astro static output with TypeScript.
- Framework-free client scripts for two interactive calculators.
- Central JSON rule records and TypeScript source records.
- Pure eligibility and projection functions covered by Vitest.
- Cloudflare-compatible static output.
- No database, account system, analytics, tracker, or sensitive form in the MVP.

## Information architecture

- Home: brand-level child savings entry point.
- Trump Accounts: core guide and first topical cluster.
- Tools: eligibility, growth, and cross-account comparison.
- Forms: post-auto-enrollment Form 4547 and pilot-election guide.
- Compare: Trump Account vs. 529.
- Contributions: current limits and examples.
- Employers: implementation education with proposed-rule labeling.
- Trust: methodology, sources, editorial policy, disclosure, privacy, terms, about, and contact.

## Design thesis

A calm, editorial “family finance field guide” with precise utility cards: deep ink and evergreen, muted sage, warm paper, and restrained gold. No campaign red/blue, political imagery, presidential portraiture, government seals, or official-looking mimicry.
