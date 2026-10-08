# Public launch report — October 8, 2026

## 1. Positioning and audience

Child Savings Lab is a neutral, expandable child-savings tools brand. Trump Accounts form the first traffic cluster. Primary users are U.S. families; secondary users are employers and benefits teams.

## 2. Information architecture

Seventeen public routes cover the home page, three tools, the Trump Accounts guide, Form 4547, 529 comparison, contribution limits, employer guidance, and trust/legal pages. The owner authorized launch as an individually operated educational publication and supplied `mayday0064@gmail.com` for editorial, accessibility, legal, and privacy correspondence. The production URL allows indexing; version and branch preview URLs remain noindex.

## 3. Technical architecture

Astro static rendering, TypeScript pure functions, central source and rule records, framework-free interactive islands, Vitest unit tests, and Cloudflare-compatible output. Calculator submit buttons start disabled and are enabled only after a local submit handler is attached. A `form-action 'none'` content security policy prevents network form submissions, including when JavaScript fails. No backend receives calculator values.

## 4. Monetization path

Trust and search traffic first; verified affiliate programs second; employer leads third; premium reports, embeds, white-label tools, and rule APIs after validation. No affiliate links or ads are present in the MVP.

## 5. Account-path and pilot rules

The tool implements TD 10056’s auto-enrollment baseline, official-status-first routing, auto-account claim authority, receiving-account activation, contribution readiness, rare manual-election exceptions, and distinct pilot-election states. It also tests the pilot birth window, citizenship, qualifying-child expectation, and employment-valid SSN requirement.

## 6. Growth formula and assumptions

Monthly compounding uses the monthly equivalent of the annual return minus monthly portions of separate eligible-fund and account-fee assumptions. The fund expense is capped at the statutory 0.10%. Monthly deposits occur at month-end; annual family and employer deposits occur on December 31. Contributions stop on December 31 of the calendar year the child turns 17, calculated from the birth date. Partial months, taxes, inflation, withdrawals, sequence risk, and tracking error are not modeled.

## 7. Test and SEO results

The post-audit October 8, 2026 verification run passed:

- Astro type check: 35 files, zero errors or warnings.
- Unit tests: 24 tests across account-path, pilot-status, date-window, growth-period, contribution-limit, and fee logic.
- Production build: 17 static routes.
- Site validation: all required routes, titles, descriptions, canonicals, JSON-LD, Open Graph fields, internal links, tool copy, indexable production pages, noindex preview headers, calculator submission safeguards, published contact links, robots.txt, and sitemap checks passed.
- Static accessibility validation: passed across generated HTML.
- Earlier audit browser QA covered the homepage, both calculators, mobile layout, desktop two-column layout, and calculator error states. Launch browser QA verified the refreshed homepage, activated-account next steps, local growth recalculation, the 0.10% fee error state, and unchanged URLs after calculation. A stale duplicate Form 4547 explanation was consolidated into the same result area so status changes replace it correctly.

## 8. Known limitations

- No licensed U.S. tax, legal, privacy, trademark, payroll, investment, or ERISA sign-off. The editorial policy states this explicitly. The owner’s publication decision does not imply professional approval.
- The basic brand search found no exact Child Savings Lab mark, but identified the related Class 036 registration SLFCU SAVINGS LABORATORY. This is documented for future clearance; the publisher uses the full name and makes no trademark-clearance claim.
- The publication is individually operated. No incorporated business, professional credentials, physical address, jurisdiction-specific liability limitation, or arbitration provision has been invented. Operator-location business registration and tax obligations require separate handling if applicable.
- Privacy practices cover local calculator processing, Cloudflare hosting, Gmail correspondence, retention criteria, and requests through the supplied email. Infrastructure retention follows provider policies; no false fixed retention period is promised.
- The account comparison is federal and high-level; state tax rules are not modeled.
- No provider directory, newsletter backend, analytics, account system, or personalization.
- Proposed employer and eligible-investment regulations may change.
- Projection output is nominal and pre-tax.

## 9. Publishing scope and future review

The current release provides free, general education for adults. It does not prepare or submit tax forms, open or access financial accounts, transfer money, recommend securities for individual portfolios, administer employer plans, or give individualized advice by email. Licensed review is a risk-management recommendation rather than a universal sign-off requirement for publishing this educational site. Reassess requirements before introducing paid personalized advice, account integrations, employer administration, advertising trackers, or data collection from children.

Basic brand searches are documented in `docs/research/brand-check-2026-10-08.md`. They do not constitute legal trademark clearance. No registered-trademark symbol is used.

The contact, privacy, terms, about, footer, and editorial-policy pages now reflect an independent individual publisher. Stale test/draft notices and the former mandatory-counsel launch gate have been removed. The public robots.txt advertises the canonical sitemap.

## 10. Phase two

Add 529/UGMA/UTMA/Custodial Roth/ABLE deep comparisons, grandparent contribution guidance, a contribution-limit tool, dated update notes, privacy-friendly analytics, Search Console, and an opt-in rule-update email after privacy and legal review.

## Public deployment

- GitHub source: `https://github.com/heme9999/child-savings-lab` (private)
- Cloudflare Pages: `https://child-savings-lab-mvp.pages.dev/`
