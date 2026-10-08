# MVP completion report

## 1. Positioning and audience

Child Savings Lab is a neutral, expandable child-savings tools brand. Trump Accounts form the first traffic cluster. Primary users are U.S. families; secondary users are employers and benefits teams.

## 2. Information architecture

Seventeen public test routes cover the home page, three tools, the Trump Accounts guide, Form 4547, 529 comparison, contribution limits, employer guidance, and trust/legal pages. The test deployment is intentionally blocked from search indexing until licensed review and operator details are complete.

## 3. Technical architecture

Astro static rendering, TypeScript pure functions, central source and rule records, framework-free interactive islands, Vitest unit tests, and Cloudflare-compatible output.

## 4. Monetization path

Trust and search traffic first; verified affiliate programs second; employer leads third; premium reports, embeds, white-label tools, and rule APIs after validation. No affiliate links or ads are present in the MVP.

## 5. Account-path and pilot rules

The tool implements TD 10056’s auto-enrollment baseline, official-status-first routing, auto-account claim authority, receiving-account activation, contribution readiness, rare manual-election exceptions, and distinct pilot-election states. It also tests the pilot birth window, citizenship, qualifying-child expectation, and employment-valid SSN requirement.

## 6. Growth formula and assumptions

Monthly compounding uses the monthly equivalent of the annual return minus monthly portions of separate eligible-fund and account-fee assumptions. The fund expense is capped at the statutory 0.10%. Monthly deposits occur at month-end; annual family and employer deposits occur on December 31. Contributions stop on December 31 of the calendar year the child turns 17, calculated from the birth date. Partial months, taxes, inflation, withdrawals, sequence risk, and tracking error are not modeled.

## 7. Test and SEO results

The post-audit October 8, 2026 verification run passed:

- Astro type check: 34 files, zero errors or warnings.
- Unit tests: 24 tests across account-path, pilot-status, date-window, growth-period, contribution-limit, and fee logic.
- Production build: 17 static routes.
- Site validation: all required routes, titles, descriptions, canonicals, JSON-LD, Open Graph fields, internal links, tool copy, noindex metadata, Cloudflare X-Robots-Tag headers, robots.txt, and sitemap checks passed.
- Static accessibility validation: passed across generated HTML.
- Manual browser QA: homepage, both calculators, mobile layout, desktop two-column layout, and calculator error states checked.

## 8. Known limitations

- No licensed U.S. tax, legal, privacy, trademark, payroll, investment, or ERISA sign-off yet.
- The final operating legal entity, monitored legal/privacy contacts, governing law, venue, and production retention schedule are not yet supplied.
- The account comparison is federal and high-level; state tax rules are not modeled.
- No provider directory, newsletter backend, analytics, account system, or personalization.
- Proposed employer and eligible-investment regulations may change.
- Projection output is nominal and pre-tax.

## 9. Pre-production reviews

Obtain U.S. counsel review of terms, privacy, disclaimers, brand clearance, and employer content; obtain qualified tax review of TD 10056, Form 4547, gift-tax, payroll-tax, and distribution treatment; identify the operator and monitored contacts; perform manual assistive-technology testing; and explicitly change the noindex controls only after approval.

## 10. Phase two

Add 529/UGMA/UTMA/Custodial Roth/ABLE deep comparisons, grandparent contribution guidance, a contribution-limit tool, dated update notes, privacy-friendly analytics, Search Console, and an opt-in rule-update email after privacy and legal review.

## Test deployment

- GitHub source: `https://github.com/heme9999/child-savings-lab` (private)
- Cloudflare Pages: `https://child-savings-lab-mvp.pages.dev/`
