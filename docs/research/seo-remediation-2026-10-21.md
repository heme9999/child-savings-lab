# October 21 SEO remediation and validation plan

## Publication scope

Keep Child Savings Lab as the neutral parent brand. Trump Accounts remain the first cluster. This release strengthens existing pages rather than publishing near-duplicate long-tail pages, adding languages, affiliate offers, analytics, or paid features.

## Crawl diagnosis

- Production baseline: 19 public routes, three genuine 404 paths, robots and both sitemap resources passed GET/HEAD and full-content checks before changes.
- The correct Search Console URL-prefix property was inspected in the existing authorized account. Both submitted sitemap rows still showed `Couldn't fetch`; the index entry was last submitted October 8.
- On October 21, Google Inspection Tool smartphone successfully fetched `/sitemap-index.xml`: crawl allowed `Yes`, page fetch `Successful`. A sitemap not being indexed as a search page is not itself an error.
- The same sitemap index was resubmitted once, with a visible `Sitemap submitted successfully` confirmation. The list still showed `Couldn't fetch` and zero discovered pages at the subsequent check. Submission receipt and a live-fetch success are not evidence of sitemap processing, URL indexing, ranking, or traffic. No Cloudflare security protections were weakened.
- Google guidance: https://support.google.com/webmasters/answer/7451001?hl=en

The historical failure's exact cause is not established. If the report remains unsuccessful, check the detailed request and authentic crawler/security evidence before changing hosting settings or repeatedly submitting.

## Existing-page search-intent map

| Existing landing page | Visitor question | Value to make visible | Measurement to collect |
| --- | --- | --- | --- |
| `/tools/trump-account-eligibility-checker/` | What account step should I check next? | Separate account status, claiming/activation, contribution readiness, and the pilot election | Non-brand GSC queries and impressions to this URL |
| `/tools/trump-account-growth-calculator/` | What do my contribution assumptions illustrate? | Partial-calendar-year checks, fees, reproducible assumptions and yearly table | Relevant calculator-query impressions/clicks; no household inputs in telemetry |
| `/forms/form-4547-guide/` | What role does this form have in my next step? | Source-linked explanation and appropriate official handoff | Form-specific queries and which existing page Google selects |
| `/contributions/trump-account-contribution-limits/` | How do scheduled family and employer amounts interact? | Calendar-year examples and links to the calculator | Contribution-limit query coverage and selected landing page |

These are intent hypotheses, not claims of keyword volume, low difficulty, or profitability. The October 19 search sample already included established calculators and financial publishers. No verified Volume/CPC/KD dataset is available, so KDRoi remains uncalculated. The prior GSC sample of one impression and zero clicks does not validate or invalidate market demand.

After crawlability is confirmed, compare non-brand queries and landing pages over a meaningful reporting window. Improve an existing relevant page before creating another URL for nearly the same question. Never send birth dates, account status, financial amounts, or free-text answers to analytics. Adding any measurement service requires a separate privacy/configuration decision.

## Guardrails

- The publication name in homepage `WebSite` data must be `Child Savings Lab`, not an individual page title. Inner pages reference that website rather than declaring separate sites.
- Maintain the 19 public routes, canonical URLs, genuine 404s, robots/sitemap consistency, ownership proof, and preview `noindex` protection.
- Keep default dates, pilot inclusion, balances and fee assumptions visible while controls are collapsed. Invalid hidden fields must reveal themselves, and blank values must not become zero.
- Keep uncertain pilot answers unresolved rather than interpreting them as a denial. Optional presentation does not remove those inputs from calculation/validation.
- Preserve existing financial rules, source records, verification dates, calculation version, and browser-local processing. This is not a new professional or site-wide legal/tax source review.
- Add useful readable questions, not FAQ-rich-result promises. Do not manufacture author identities, credentials, reviews, search metrics, or schema ratings.
- Check actual built JS/CSS chunks, including imported shared chunks, and the three sharing PNGs using GET/HEAD, MIME type, and SHA-256 after deployment.
