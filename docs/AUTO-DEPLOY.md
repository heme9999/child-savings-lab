# GitHub push to Cloudflare Pages

## Current enablement status

The deployment workflow has been prepared, but no Cloudflare repository secret or deployment-enable variable existed at the initial inspection. Automatic publication must not be described as enabled until the credential is configured with the user's authorization, the switch is enabled, and a real main push successfully deploys and passes production checks.

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
