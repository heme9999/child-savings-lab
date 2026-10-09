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

## Deploy and check HTTP behavior

After committing and pushing the verified source to GitHub, deploy with:

```bash
npm run deploy:cloudflare
```

This rebuilds and verifies the site, deploys to Cloudflare Pages, then runs `npm run validate:deployment` against production. The deployment checks request every public page, the sitemap index and its child XML files, robots.txt, and three intentionally missing paths with both GET and HEAD. They reject homepage fallback, HTTP 200 error pages, mismatched page metadata, stale sitemap files, missing copyright/ownership tags, and unexpected production noindex headers. A failed check exits nonzero; it does not automatically roll back the deployment.

To check an existing deployment after a successful local build:

```bash
npm run validate:deployment
npm run validate:deployment -- https://YOUR-DEPLOYMENT.child-savings-lab-mvp.pages.dev/
```

The top-level `dist/404.html` disables Cloudflare Pages’ default SPA fallback. It stays out of the sitemap and carries noindex. Sitemap validation requires both directions to match: every listed URL must have a generated, indexable HTML file with the same canonical, and every indexable generated page must appear in the sitemap. The intentionally unpublished 529-versus-custodial guide path must remain 404 until a real guide is added; update that negative test when publishing it.

## Privacy and scope

Calculator inputs stay in the browser. The site does not ask for or store names, SSNs, tax IDs, account numbers, or addresses. Content is educational and is not individualized tax, legal, benefits, payroll, or investment advice.

The production URL allows crawling and indexing. Version and branch preview URLs remain noindex through Cloudflare `_headers`. Calculator network form submissions are blocked by CSP, and submit buttons remain disabled until local scripts load. The source has not received licensed-professional sign-off; publication does not imply such review.

## Documentation

- `docs/project-plan.md`
- `docs/research/serp-audit-2026-10-08.md`
- `docs/launch-report.md`
