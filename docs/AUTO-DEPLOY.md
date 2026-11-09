# GitHub push to Cloudflare Pages

## Current enablement status

On November 9, 2026, the user authorized a dedicated deployment credential and explicitly increased its validity from 90 to 180 days. The credential has been created and saved to this repository's encrypted Actions secret; `CLOUDFLARE_DEPLOY_ENABLED` is `true`. The first normal main push successfully completed verification, automatic production publication, and live HTTP regression. The evidence below records that acceptance run; later main pushes publish newer revisions through the same workflow.

Credential metadata (never the value):

- Name: `child-savings-lab GitHub Actions`.
- Permission: only `Cloudflare Pages: Edit`, account `testing pages` (`dcb7b7a33a34b85d7bdf6ba4c01af700`). This is account-wide Pages access, not project-only access.
- Valid from: `2026-11-09T07:35:00Z` (November 9, 15:35 China Standard Time).
- Expires: `2027-05-08T07:35:00Z` (May 8, 2027, 15:35 China Standard Time), 180 days after the start.
- Destination: repository Actions secret `CLOUDFLARE_API_TOKEN` in `heme9999/child-savings-lab`; creation was visibly confirmed by GitHub and secret-name metadata was independently checked.
- No DNS, billing, other-account permission, broad local OAuth credential, or other project's token was granted or reused. No expiry reminder automation was created.

## First automatic publication evidence

- Initial workflow-only commit `4f17bb6a3714333fd61681e908bd0de8016143a8`: [run 42579806128](https://github.com/heme9999/child-savings-lab/actions/runs/42579806128) passed verification and correctly skipped publication while the enable variable was unset.
- After credential setup and enablement, normal push commit `083062c72d5205a6f750c3bb084d9be2bde48cf4`: [run 42580853395](https://github.com/heme9999/child-savings-lab/actions/runs/42580853395), event `push`, completed both `verify` and `Deploy production` successfully on November 9, 2026, at 07:41 UTC.
- Cloudflare production deployment `e2d15ef6-9a10-4298-b36f-a787b9b46c2b`, branch `main`, source shown as `083062c`; [immutable deployment](https://e2d15ef6.child-savings-lab-mvp.pages.dev/). Publication supplied the full Actions commit SHA; the independent Cloudflare deployment listing confirmed the matching source prefix and Production environment.
- The automatic regression passed GET and HEAD for 19 public pages, 3 genuine 404 paths, 3 sitemap/robots resources, and 11 static assets, including HTML markers, MIME types and SHA-256 comparisons (72 HTTP checks).
- The website content was unchanged by the automation setup. Local verification passed 229 tests, site validation and accessibility structure checks. Dependency audit reported zero known vulnerabilities after compatible lockfile updates.
- The first run reported Node 20 action-runtime deprecation. The follow-up configuration uses the official checkout/setup-node v6 actions with Node 24 runtimes, disables persisted Git checkout credentials, and selects `ubuntu-24.04` explicitly. Application builds continue to use Node 22. This follow-up push must pass the same complete workflow before being treated as deployed.

## Release path

`main` push → `verify` → `Deploy production` → live HTTP regression.

- Existing repository: `heme9999/child-savings-lab`.
- Existing Cloudflare account: `testing pages`, `dcb7b7a33a34b85d7bdf6ba4c01af700`.
- Existing Pages project: `child-savings-lab-mvp`.
- Public URL: https://child-savings-lab-mvp.pages.dev/
- The project remains Direct Upload; `Git Provider: No` is expected. GitHub Actions provides automatic publication without migrating the site or changing its URL.
- Only an explicitly enabled main push or main manual workflow run can publish. PRs and other branches do not receive the Cloudflare credential or deploy.
- Deployment requires successful tests/build checks. The deploy job rebuilds and validates the same source revision, confirms it is still remote main, and refuses to upload without the credential.
- Production uploads are serialized and are not cancelled mid-upload. An outdated revision is skipped rather than overwriting a newer one.
- Wrangler and the YAML test parser are exact development dependencies locked by `package-lock.json`.
- After upload, `validate:deployment` checks every public page, real 404s, sitemap/robots, production indexing headers, HTML and asset references, and asset MIME/SHA-256. A post-publication failure fails the job; it does not automatically roll back.

## One-time authorization and configuration

The user must approve any new persistent Cloudflare-to-GitHub authorization before a credential is created or stored. Do not reuse the broad local Wrangler OAuth login or another project's token.

| Kind | Name | Purpose |
| --- | --- | --- |
| Repository secret | `CLOUDFLARE_API_TOKEN` | Dedicated token with `Account → Cloudflare Pages → Edit`, limited to the account above; agree the expiry date with the user |
| Repository variable | `CLOUDFLARE_DEPLOY_ENABLED` | Set to the exact string `true` only after the credential has been configured |

Cloudflare Pages token permissions are account-wide, not single-project permissions: the token can affect other Pages projects in that account. The workflow's fixed project name is a safety guard, not a narrower API authorization scope. Store the token only in this repository's encrypted Actions secret; never in source code, evidence files, job summaries, or chat. Public visitors and PRs must not receive it. Maintainers able to change trusted main workflows can potentially use the credential.

## Acceptance

1. Keep the enable variable unset/false while verifying the initial workflow commit.
2. After authorized credential setup, enable the variable and make a normal main push.
3. Confirm the run contains a successful `verify` and `Deploy production`, not a skipped deployment.
4. Confirm the Cloudflare production deployment source equals that same full GitHub commit SHA.
5. Confirm the automatic live regression passes and independently check the production site.
6. Record the credential's name, permission scope, expiry, Actions run URL, commit, deployment ID and verification outcome—but never its value.

## Pause, renew, recover

- To stop future automatic publication, set `CLOUDFLARE_DEPLOY_ENABLED=false`. Already-started uploads and already-published versions are not undone.
- Update the same secret before the agreed expiry. Do not create a reminder automation unless the user requests one.
- For a failed release, inspect the Actions logs and the existing Cloudflare deployment history. Roll back only with authorization, and align main with a corrective commit or `git revert`.
- `npm run deploy:cloudflare` remains a verified manual fallback, not a second release step after every push.

## References

- [Cloudflare Direct Upload limitation](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Direct Upload with CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [GitHub Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [Official checkout v6 runtime](https://github.com/actions/checkout/blob/v6/action.yml)
- [Official setup-node v6 runtime](https://github.com/actions/setup-node/blob/v6/action.yml)
