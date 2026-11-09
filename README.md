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

The workflow in `.github/workflows/ci.yml` can automatically publish verified `main` pushes to the existing Cloudflare Pages project. It must first be enabled with a dedicated repository secret and explicit deployment variable; merely pushing this workflow does not enable publication. See [the setup and verification guide](docs/AUTO-DEPLOY.md).

Once enabled, push to GitHub and wait for both `verify` and `Deploy production`. Do not also deploy the same revision manually. PRs only run checks. Deployments are serialized, older main revisions are skipped, and publication is followed by the full production HTTP regression.

The existing Direct Upload project and public URL are retained. Cloudflare will still display `Git Provider: No`: GitHub Actions performs the automated upload rather than Cloudflare's native Git integration.

For an explicitly requested manual fallback, deploy with:

```bash
npm run deploy:cloudflare
```

This rebuilds and verifies the site, deploys to Cloudflare Pages, then runs `npm run validate:deployment -- --wait-for-deployment` against production. It retries the complete suite at most four times, with 10-second gaps, to allow a just-published deployment to propagate. All checks must pass together; failure is never waived. The deployment checks request every public page, the sitemap index and its child XML files, robots.txt, and three intentionally missing paths with both GET and HEAD. They reject homepage fallback, HTTP 200 error pages, mismatched page metadata or full HTML content (including bundled asset references), stale sitemap files, missing copyright/ownership tags, and unexpected production noindex headers. A failed check exits nonzero; it does not automatically roll back the deployment. Build and test the exact source revision being deployed; a newer local build is expected to fail against an older live release.

To check an existing deployment after a successful local build:

```bash
npm run validate:deployment
npm run validate:deployment -- https://YOUR-DEPLOYMENT.child-savings-lab-mvp.pages.dev/
```

The top-level `dist/404.html` disables Cloudflare Pages’ default SPA fallback. It stays out of the sitemap and carries noindex. Sitemap validation requires both directions to match: every listed URL must have a generated, indexable HTML file with the same canonical, and every indexable generated page must appear in the sitemap. The intentionally unpublished 529-versus-custodial guide path must remain 404 until a real guide is added; update that negative test when publishing it.

## Privacy and scope

Calculator inputs stay in the browser. The site does not ask for or store names, SSNs, tax IDs, account numbers, or addresses. Content is educational and is not individualized tax, legal, benefits, payroll, or investment advice.

The homepage passes only allowlisted fictional presets through URL fragments to the full growth calculator. Custom financial inputs and birth dates are not serialized. Edited inputs hide stale results; missing required answers do not produce an eligibility rejection. Printed growth reports include their assumptions and calculation version.

The `/tools/` directory explains each tool’s scope. Form errors provide inline descriptions and keyboard-focusable links, preserve existing help text, and reveal invalid advanced fields. Reports preserve the calculation input precision instead of rounding small fee assumptions to zero. DOM feedback tests use jsdom; they do not replace real-browser layout and screen-reader checks.

Mobile navigation is a native disclosure that works without JavaScript; optional enhancements close it on Escape or an outside press. Primary navigation marks the current section and has touch targets at least 44px high. Tool headers put the first inputs within the tested narrow-screen viewports. Explicit tool submission focuses and reveals the result panel instantly; editing still hides stale results. Hover effects require a fine hover-capable pointer, and moving press feedback respects reduced motion. Browser viewport checks do not replace real-phone keyboard, zoom, and touch checks.

Article scope/publication details and contents use native disclosures, while review dates stay visible. The comparison offers an early purpose-first overview. Short eligibility select labels retain full, wrapping explanations that synchronize after selection and native reset. Result panels are not atomic live regions: separate persistent status nodes announce brief updates. The primary growth balance is visually distinct from secondary metrics. Focus colors are checked against light and dark surfaces, and anchor/error navigation is immediate by default.

Growth limit checks use the actual modeled deposit schedule per calendar year, including partial years, not an annualized monthly amount. They do not assess prior/outside deposits or predict future indexed limits. Annual table/chart data come from the same simulation. Existing-account paths, adult-stage handling, and incomplete pilot assessments are separate; a new-election age test is not used to invalidate an older account.

The production URL allows crawling and indexing. Version and branch preview URLs remain noindex through Cloudflare `_headers`. Calculator network form submissions are blocked by CSP, and submit buttons remain disabled until local scripts load. The source has not received licensed-professional sign-off; publication does not imply such review.

## Documentation

- `docs/project-plan.md`
- `docs/research/serp-audit-2026-10-08.md`
- `docs/launch-report.md`
- `docs/release-2026-10-12.md`
- `docs/release-2026-10-15.md`
- `docs/release-2026-10-16.md`
- `docs/release-2026-10-17.md`
