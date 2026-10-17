import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pageMetadata, readBuildManifest, validateSitemapConsistency } from './lib/site-manifest.mjs';

const root = resolve('dist');
const requiredRoutes = [
  '/',
  '/trump-accounts/',
  '/guides/529-plans/',
  '/tools/',
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
  const reviewTags = [...html.matchAll(/<time\b[^>]*data-review-date[^>]*>/gi)];
  for (const tag of reviewTags) {
    const date = tag[0].match(/datetime="([^"]+)"/)?.[1];
    const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)].map((match) => JSON.parse(match[1]));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '') || !schemas.some((schema) => schema.dateModified === date)) failures.push(`${name}: visible review date and structured modification date must share one ISO value`);
  }
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
    else if (href.includes('#')) {
      const fragment = href.split('#')[1];
      const preset = path === '/tools/trump-account-growth-calculator/' && /^preset=(50|100|200)-(0|4|6)$/.test(fragment);
      if (fragment && !preset && !readFileSync(target, 'utf8').includes(`id="${fragment}"`)) failures.push(`${name}: broken internal fragment ${href}`);
    }
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    if (!html.includes(`id="${match[1]}"`)) failures.push(`${name}: broken page-contents anchor #${match[1]}`);
  }
}

const homeHtml = readFileSync(routeFile('/'), 'utf8');
if (pageMetadata(homeHtml).title !== 'Child Savings Guides & Free Calculators | Child Savings Lab') failures.push('Homepage must retain its descriptive child-savings title');
const homeHead = homeHtml.match(/<head>(.*?)<\/head>/is)?.[1] ?? '';
const googleVerification = [...homeHead.matchAll(/<meta name="google-site-verification" content="([^"]+)"/g)];
if (googleVerification.length !== 1 || !googleVerification[0]?.[1]?.trim()) failures.push('Homepage must retain the Google Search Console ownership tag in its head');
const eligibilityHtml = readFileSync(routeFile('/tools/trump-account-eligibility-checker/'), 'utf8');
const growthHtml = readFileSync(routeFile('/tools/trump-account-growth-calculator/'), 'utf8');
if (!eligibilityHtml.includes('Show next steps') || !eligibilityHtml.includes('Rules checked:')) failures.push('Status tool lacks rendered content or verification date');
if (!growthHtml.includes('Update projection') || !growthHtml.includes('Returns are not guaranteed')) failures.push('Growth tool lacks indexable content or limitation language');
if (!growthHtml.includes('Parameters used for this report') || !growthHtml.includes('data-assumptions')) failures.push('Growth print report must include its input assumptions');
for (const [name, html] of [['growth', growthHtml], ['eligibility', eligibilityHtml]]) {
  if (!new RegExp(`<form\\b[^>]*id="${name}-form"[^>]*>\\s*<div id="${name}-errors"`).test(html)) failures.push(`${name}: validation summary must appear before inputs inside its form`);
  if (!/<nav\b[^>]*aria-label="Breadcrumb">[\s\S]*?href="\/tools\/"/.test(html)) failures.push(`${name}: Tools breadcrumb must link to the tools directory`);
  const resultTag = html.match(/<section\b[^>]*class="result-panel"[^>]*>/)?.[0] ?? '';
  if (!resultTag || /aria-live|aria-atomic/.test(resultTag)) failures.push(`${name}: the entire result must not be an atomic live region`);
  if (!new RegExp(`<p[^>]*id="${name}-announcement"[^>]*role="status"[^>]*><\\/p>`).test(html)) failures.push(`${name}: a persistent, initially empty announcement region is required`);
}
for (const page of manifest.pages.filter(page => page.html.includes('class="article-contents'))) {
  if (!/<details class="article-contents[^\"]*">/.test(page.html)) failures.push(`${page.route}: contents must use a closed native disclosure`);
  if (!page.html.includes('Review scope &amp; publication') || !page.html.includes('data-review-date')) failures.push(`${page.route}: compact article metadata must preserve scope and date`);
}
if (!readFileSync(routeFile('/tools/child-savings-account-comparison/'), 'utf8').includes('id="purpose-overview"')) failures.push('Comparison must retain its purpose-first overview');
if (!growthHtml.includes('min="2026-07-04"')) failures.push('Growth form must retain the statutory earliest contribution date');
if (!growthHtml.includes('id="growth-timeline"') || !growthHtml.includes('id="growth-yearly-rows"')) failures.push('Growth result must retain its chart and yearly data table');
if (!/<\/section>\s*<\/div>\s*<section\b[^>]*id="growth-timeline"/.test(growthHtml)) failures.push('Timeline must follow the calculator grid so the sticky result cannot cover it');
if (!growthHtml.includes('Statutory growth period ends')) failures.push('Growth result must distinguish the model cutoff and statutory growth-period end');
if (!eligibilityHtml.includes('id="eligibility-output" hidden') || !eligibilityHtml.includes('No eligibility assessment yet')) failures.push('Eligibility checker must not show a positive default determination');
const sourcesHtml = readFileSync(routeFile('/sources/'), 'utf8');
for (const match of sourcesHtml.matchAll(/<article[^>]*data-source-status="proposed rule"[^>]*>(.*?)<\/article>/gis)) {
  if (!match[1].includes('Proposed applicability') || /Effective(?: \/ scope)?:/.test(match[1])) failures.push('Proposed source record must show proposed applicability, not an effective-date label');
}
if (!/<nav\b[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?href="\/tools\/"/.test(homeHtml)) failures.push('Primary navigation must link to the tools hub');
if (!homeHtml.includes('data-mobile-navigation') || !homeHtml.includes('aria-controls="mobile-site-links"')) failures.push('Mobile navigation must retain its native disclosure and controlled links');
for (const [name, html] of [['growth', growthHtml], ['eligibility', eligibilityHtml]]) {
  if (!html.includes('tool-hero') || !html.includes('tool-meta')) failures.push(`${name}: tool pages must retain the compact header and review metadata`);
}
const toolsHtml = readFileSync(routeFile('/tools/'), 'utf8');
if (!toolsHtml.includes('Trump Account checker') || !toolsHtml.includes('Trump Account calculator') || !toolsHtml.includes('not 529 projections')) failures.push('Tools hub must identify the current tools and their Trump Account scope');
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
