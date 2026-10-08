# Child Savings Lab

Independent, source-linked tools for U.S. families comparing children’s savings accounts. Trump Accounts are the first SEO and product cluster; the brand and architecture extend to 529 plans, UGMA/UTMA, Custodial Roth IRAs, ABLE accounts, and employer benefits.

Public website: <https://child-savings-lab-mvp.pages.dev/>

Individually operated educational publication. Editorial, accessibility, and privacy contact: mayday0064@gmail.com.

## Commands

```bash
npm install
npm run dev
npm run verify
```

## Privacy and scope

Calculator inputs stay in the browser. The site does not ask for or store names, SSNs, tax IDs, account numbers, or addresses. Content is educational and is not individualized tax, legal, benefits, payroll, or investment advice.

The production URL allows crawling and indexing. Version and branch preview URLs remain noindex through Cloudflare `_headers`. Calculator network form submissions are blocked by CSP, and submit buttons remain disabled until local scripts load. The source has not received licensed-professional sign-off; publication does not imply such review.

## Documentation

- `docs/project-plan.md`
- `docs/research/serp-audit-2026-10-08.md`
- `docs/launch-report.md`
