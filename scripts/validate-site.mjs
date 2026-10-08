import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

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
const htmlFiles = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path);
  }
}
walk(root);

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
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1]?.trim();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const h1Matches = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gis)];
  const h1 = h1Matches[0]?.[1]?.replace(/<[^>]+>/g, '').trim();
  if (!title) failures.push(`${name}: missing title`);
  if (!description || description.length < 70) failures.push(`${name}: missing or short meta description`);
  if (!canonical?.startsWith('http')) failures.push(`${name}: missing absolute canonical`);
  if (!html.includes('<meta name="robots" content="noindex,nofollow"')) failures.push(`${name}: public test page must be noindex`);
  if (!html.includes('application/ld+json')) failures.push(`${name}: missing JSON-LD`);
  if (!html.includes('og:title') || !html.includes('og:description')) failures.push(`${name}: missing Open Graph metadata`);
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

const eligibilityHtml = readFileSync(routeFile('/tools/trump-account-eligibility-checker/'), 'utf8');
const growthHtml = readFileSync(routeFile('/tools/trump-account-growth-calculator/'), 'utf8');
if (!eligibilityHtml.includes('Show next steps') || !eligibilityHtml.includes('Last verified')) failures.push('Status tool lacks rendered content or verification date');
if (!growthHtml.includes('Update projection') || !growthHtml.includes('Returns are not guaranteed')) failures.push('Growth tool lacks indexable content or limitation language');
if (!existsSync(join(root, 'robots.txt'))) failures.push('Missing robots.txt');
if (!existsSync(join(root, 'sitemap-index.xml'))) failures.push('Missing sitemap-index.xml');
if (!existsSync(join(root, '_headers'))) failures.push('Missing Cloudflare noindex headers');
if (!readFileSync(join(root, 'robots.txt'), 'utf8').includes('Disallow: /')) failures.push('Public test robots.txt must block crawling');
if (!readFileSync(join(root, '_headers'), 'utf8').includes('X-Robots-Tag: noindex, nofollow')) failures.push('Public test headers must send X-Robots-Tag');

if (failures.length) {
  console.error(`Site validation failed with ${failures.length} issue(s):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Site validation passed: ${htmlFiles.length} HTML pages, ${requiredRoutes.length} required routes, no broken internal links.`);
