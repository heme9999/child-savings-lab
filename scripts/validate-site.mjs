import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pageMetadata, readBuildManifest, validateSitemapConsistency } from './lib/site-manifest.mjs';

const root = resolve('dist');
const requiredRoutes = [
  '/',
  '/trump-accounts/',
  '/tools/trump-account-eligibility-checker/',
  '/tools/trump-account-growth-calculator/',
  '/tools/child-savings-account-comparison/',
  '/forms/form-4547-guide/',
  '/compare/trump-account-vs-529/',
  '/contributions/trump-account-contribution-limits/',
  '/employers/trump-account-benefit-guide/',
  '/methodology/',
  '/sources/',
  '/editorial-policy/',
  '/affiliate-disclosure/',
  '/privacy/',
  '/terms/',
  '/about/',
  '/contact/'
];

const failures = [];
const manifest = readBuildManifest(root);
const htmlFiles = manifest.pages.map((page) => page.path);
failures.push(...validateSitemapConsistency(manifest).failures);

const notFound = manifest.pages.find((page) => page.file === '404.html');
if (!notFound) failures.push('Missing top-level 404.html: Cloudflare Pages would enable homepage fallback');
else {
  if (!notFound.noindex) failures.push('404.html must be noindex');
  if (!notFound.html.includes('404 · Page not found')) failures.push('404.html must clearly explain that the page was not found');
  if (notFound.canonical === 'https://child-savings-lab-mvp.pages.dev/') failures.push('404.html must not use the homepage canonical');
}

function routeFile(route) {
  return route === '/' ? join(root, 'index.html') : join(root, route, 'index.html');
}

for (const route of requiredRoutes) {
  if (!existsSync(routeFile(route))) failures.push(`Missing required route: ${route}`);
}

const titles = new Map();
const h1s = new Map();
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const name = relative(root, file);
  const isNotFound = name === '404.html';
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1]?.trim();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gis)];
  const h1 = h1Matches[0]?.[1]?.replace(/<[^>]+>/g, '').trim();
  if (!title) failures.push(`${name}: missing title`);
  if (!description || description.length < 70) failures.push(`${name}: missing or short meta description`);
  if (!canonical?.startsWith('http')) failures.push(`${name}: missing absolute canonical`);
  if (!isNotFound && /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html)) failures.push(`${name}: public launch page must allow indexing`);
  if (html.includes('Public test environment:') || html.includes('Pre-production status:') || html.includes('Draft test terms:')) failures.push(`${name}: obsolete pre-launch notice`);
  if (!html.includes('application/ld+json')) failures.push(`${name}: missing JSON-LD`);
  if (!html.includes('og:title') || !html.includes('og:description')) failures.push(`${name}: missing Open Graph metadata`);
  if (!html.includes(`© ${new Date().getUTCFullYear()} Child Savings Lab.`)) failures.push(`${name}: missing current copyright year`);
  if (h1Matches.length !== 1) failures.push(`${name}: expected one H1, found ${h1Matches.length}`);
  if (title) {
    if (titles.has(title)) failures.push(`${name}: duplicate title with ${titles.get(title)}`);
    titles.set(title, name);
  }
  if (h1) {
    if (h1s.has(h1)) failures.push(`${name}: duplicate H1 with ${h1s.get(h1)}`);
    h1s.set(h1, name);
  }

  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = match[1];
    if (!href || href.startsWith('//')) continue;
    const path = href.split('#')[0].split('?')[0];
    if (!path || /\.[a-z0-9]+$/i.test(path)) continue;
    const target = path === '/' ? join(root, 'index.html') : join(root, path, 'index.html');
    if (!existsSync(target)) failures.push(`${name}: broken internal link ${href}`);
  }
}

const homeHtml = readFileSync(routeFile('/'), 'utf8');
if (pageMetadata(homeHtml).title !== 'Child Savings Guides & Free Calculators | Child Savings Lab') failures.push('Homepage must retain its descriptive child-savings title');
const homeHead = homeHtml.match(/<head>(.*?)<\/head>/is)?.[1] ?? '';
const googleVerification = [...homeHead.matchAll(/<meta name="google-site-verification" content="([^"]+)"/g)];
if (googleVerification.length !== 1 || !googleVerification[0]?.[1]?.trim()) failures.push('Homepage must retain the Google Search Console ownership tag in its head');
const eligibilityHtml = readFileSync(routeFile('/tools/trump-account-eligibility-checker/'), 'utf8');
const growthHtml = readFileSync(routeFile('/tools/trump-account-growth-calculator/'), 'utf8');
if (!eligibilityHtml.includes('Show next steps') || !eligibilityHtml.includes('Last verified')) failures.push('Status tool lacks rendered content or verification date');
if (!growthHtml.includes('Update projection') || !growthHtml.includes('Returns are not guaranteed')) failures.push('Growth tool lacks indexable content or limitation language');
if (!existsSync(join(root, 'robots.txt'))) failures.push('Missing robots.txt');
if (!existsSync(join(root, 'sitemap-index.xml'))) failures.push('Missing sitemap-index.xml');
if (!existsSync(join(root, '_headers'))) failures.push('Missing Cloudflare headers');
const robots = readFileSync(join(root, 'robots.txt'), 'utf8');
if (/^Disallow:\s*\//m.test(robots)) failures.push('Public launch robots.txt must allow crawling');
if (!robots.includes('Sitemap: https://child-savings-lab-mvp.pages.dev/sitemap-index.xml')) failures.push('robots.txt must advertise the public sitemap');
const headers = readFileSync(join(root, '_headers'), 'utf8');
const globalHeaders = headers.split(/\n\s*\n/)[0];
if (/X-Robots-Tag:.*noindex/i.test(globalHeaders)) failures.push('Global headers must allow production indexing');
if (!headers.includes('https://:preview.child-savings-lab-mvp.pages.dev/*\n  X-Robots-Tag: noindex, nofollow')) failures.push('Preview URLs must remain noindex');
if (!globalHeaders.includes("form-action 'none'")) failures.push('Calculator network form submissions must be blocked');
for (const [name, html] of [['eligibility', eligibilityHtml], ['growth', growthHtml]]) {
  if (!/<button[^>]+type="submit"[^>]+disabled/.test(html) || !html.includes('<noscript>')) failures.push(`${name}: local calculator must remain safe without JavaScript`);
}
for (const route of ['/contact/', '/privacy/', '/terms/', '/about/']) {
  if (!readFileSync(routeFile(route), 'utf8').includes('mailto:mayday0064@gmail.com')) failures.push(`${route}: missing publisher contact`);
}

if (failures.length) {
  console.error(`Site validation failed with ${failures.length} issue(s):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Site validation passed: ${requiredRoutes.length} public routes and top-level 404.html, consistent sitemap and generated files, no broken internal links.`);
