import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { missingPaths, publicSiteUrl, readBuildManifest, validateHttpPage, validateSitemapConsistency } from './lib/site-manifest.mjs';

// Check the hosting layer, not Astro's dev server: a visible error page with HTTP 200 still fails.
async function main() {
  const args = process.argv.slice(2);
  const waitForDeployment = args.includes('--wait-for-deployment');
  const urls = args.filter((arg) => !arg.startsWith('--'));
  if (urls.length > 1 || args.some((arg) => arg.startsWith('--') && arg !== '--wait-for-deployment')) throw new Error('Usage: validate-deployment.mjs [site-root URL] [--wait-for-deployment]');
  const deployment = new URL(urls[0] || publicSiteUrl);
  if (!['http:', 'https:'].includes(deployment.protocol) || deployment.username || deployment.password || deployment.pathname !== '/' || deployment.search || deployment.hash) throw new Error('Supply a site-root HTTP(S) URL without credentials, query, or fragment.');
  const root = resolve('dist');
  const manifest = readBuildManifest(root);
  const sitemap = validateSitemapConsistency(manifest);
  if (sitemap.failures.length) throw new Error(`Build is invalid:\n${sitemap.failures.join('\n')}`);
  const notFound = manifest.pages.find((page) => page.file === '404.html');
  if (!notFound?.noindex) throw new Error('Build must include a noindex top-level 404.html before deployment testing.');
  const requireIndexable = deployment.origin === new URL(publicSiteUrl).origin;
  const pages = manifest.pages.filter((page) => !page.isError && !page.noindex);
  const cases = [
    ...pages.map((page) => ({ path: page.route, status: 200, page })),
    ...missingPaths.map((path) => ({ path, status: 404, page: notFound })),
    { path: '/sitemap-index.xml', status: 200, body: manifest.indexXml, contentType: 'xml' },
    ...sitemap.sitemapUrls.map((url) => ({ path: new URL(url).pathname, status: 200, body: manifest.sitemapFiles.get(new URL(url).pathname), contentType: 'xml' })),
    { path: '/robots.txt', status: 200, body: readFileSync(resolve(root, 'robots.txt'), 'utf8'), contentType: 'text/plain' }
  ];
  const maxAttempts = waitForDeployment ? 4 : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const failures = [];
    let cursor = 0;
    async function worker() {
      while (cursor < cases.length) {
        const check = cases[cursor++];
        try {
          const url = new URL(check.path, deployment);
          const [get, head] = await Promise.all(['GET', 'HEAD'].map((method) => fetch(url, { method, redirect: 'manual', signal: AbortSignal.timeout(15000) })));
          const html = await get.text();
          const errors = [];
          if (head.status !== check.status) errors.push(`HEAD expected HTTP ${check.status}, received ${head.status}`);
          if (check.page) {
            errors.push(...validateHttpPage({ status: get.status, html, headersNoindex: get.headers.get('x-robots-tag') ?? '', expectedStatus: check.status, expectedPage: check.page, requireIndexable }));
            if (!get.headers.get('content-type')?.includes('text/html')) errors.push('page response is not HTML');
            if (!html.includes(`© ${new Date().getUTCFullYear()} Child Savings Lab.`)) errors.push('current copyright footer is missing');
            if (check.path === '/') {
              const tag = manifest.pages.find((page) => page.route === '/').html.match(/<meta name="google-site-verification"[^>]+>/)?.[0];
              if (!tag || !html.includes(tag)) errors.push('Search Console ownership tag is missing or changed');
            }
          } else {
            if (get.status !== check.status) errors.push(`GET expected HTTP ${check.status}, received ${get.status}`);
            if (html.trim() !== check.body.trim()) errors.push('resource differs from the built file (possible fallback or stale deployment)');
            if (!get.headers.get('content-type')?.includes(check.contentType)) errors.push(`expected ${check.contentType} content type`);
          }
          if (errors.length) failures.push(`${check.path}: ${errors.join('; ')}`);
          console.log(`${errors.length ? 'FAIL' : 'PASS'} GET ${get.status} / HEAD ${head.status} ${check.path}`);
        } catch (error) {
          failures.push(`${check.path}: ${error.message}`);
        }
      }
    }
    await Promise.all(Array.from({ length: 4 }, worker));
    if (!failures.length) {
      console.log(`Deployment regression passed at ${deployment.origin}: ${pages.length} public pages, ${missingPaths.length} genuine 404 paths, and ${cases.length - pages.length - missingPaths.length} sitemap/robots resources; GET and HEAD checked.`);
      return;
    }
    if (attempt === maxAttempts) throw new Error(`Deployment regression failed:\n- ${failures.join('\n- ')}`);
    console.warn(`Deployment attempt ${attempt}/${maxAttempts}: ${failures.length} paths not ready. Rechecking the complete suite in 10 seconds; no failures are waived.`);
    await delay(10000);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
