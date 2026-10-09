import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export const publicSiteUrl = 'https://child-savings-lab-mvp.pages.dev/';
export const missingPaths = [
  '/compare/529-plans-vs-custodial-accounts/',
  '/this-page-does-not-exist-12345/',
  '/tools/this-tool-does-not-exist-12345/'
];

function decodeEntities(value) {
  return value.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (_, entity) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(entity[1].toLowerCase() === 'x' ? 2 : 1), entity[1].toLowerCase() === 'x' ? 16 : 10));
    return named[entity.toLowerCase()];
  });
}

export function pageMetadata(html) {
  return {
    title: decodeEntities(html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? ''),
    canonical: decodeEntities(html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? ''),
    noindex: /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html),
    h1: decodeEntities(html.match(/<h1[^>]*>(.*?)<\/h1>/is)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '')
  };
}

export function readBuildManifest(root) {
  const pages = [];
  const sitemapFiles = new Map();
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.html') || entry.name.endsWith('.xml')) {
        const file = relative(root, path).replaceAll('\\', '/');
        const html = readFileSync(path, 'utf8');
        if (file.endsWith('.xml')) sitemapFiles.set(`/${file}`, html);
        else {
          const route = file === 'index.html' ? '/' : `/${file.replace(/index\.html$/, '').replace(/\.html$/, '')}`;
          pages.push({ file, path, route, html, isError: /^(404|500)\.html$/.test(file), ...pageMetadata(html) });
        }
      }
    }
  }
  walk(root);
  return { pages, sitemapFiles, indexXml: sitemapFiles.get('/sitemap-index.xml') ?? '' };
}

function locations(xml, kind, name, failures) {
  if (!new RegExp(`<${kind}\\b[^>]*>`).test(xml) || !xml.includes(`</${kind}>`)) {
    failures.push(`${name}: missing ${kind} document`);
    return [];
  }
  const values = [...xml.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((match) => decodeEntities(match[1]));
  if (!values.length || values.some((value) => !value)) failures.push(`${name}: no valid locations`);
  return values;
}

export function validateSitemapConsistency({ pages, sitemapFiles, indexXml, siteUrl = publicSiteUrl }) {
  const failures = [];
  const site = new URL(siteUrl);
  const routes = new Map(pages.map((page) => [page.route, page]));
  const pageUrls = [];
  const sitemapUrls = locations(indexXml, 'sitemapindex', 'sitemap-index.xml', failures);
  const seenSitemaps = new Set();
  const seenPages = new Set();
  function localUrl(value, name) {
    try {
      const url = new URL(value);
      if (url.origin !== site.origin || url.username || url.password || url.search || url.hash || url.href !== value) throw new Error();
      return url;
    } catch {
      failures.push(`${name}: invalid or non-canonical site URL ${value}`);
      return null;
    }
  }
  for (const value of sitemapUrls) {
    if (seenSitemaps.has(value)) failures.push(`Duplicate child sitemap: ${value}`);
    seenSitemaps.add(value);
    const url = localUrl(value, 'Sitemap index');
    if (!url) continue;
    const xml = sitemapFiles.get(url.pathname);
    if (!xml) {
      failures.push(`Sitemap index points to missing XML file: ${value}`);
      continue;
    }
    for (const pageUrl of locations(xml, 'urlset', url.pathname, failures)) {
      if (seenPages.has(pageUrl)) failures.push(`Duplicate sitemap page: ${pageUrl}`);
      seenPages.add(pageUrl);
      pageUrls.push(pageUrl);
      const parsed = localUrl(pageUrl, url.pathname);
      if (!parsed) continue;
      const page = routes.get(parsed.pathname);
      if (!page) failures.push(`Sitemap points to missing generated HTML file: ${pageUrl}`);
      else if (page.isError || page.noindex) failures.push(`Sitemap includes a non-indexable page: ${pageUrl}`);
      else if (page.canonical !== pageUrl) failures.push(`Sitemap URL differs from generated canonical: ${pageUrl}`);
    }
  }
  for (const page of pages.filter((page) => !page.isError && !page.noindex)) {
    const expected = new URL(page.route, site).href;
    if (page.canonical !== expected) failures.push(`${page.file}: canonical must match its generated route (${expected})`);
    if (!seenPages.has(expected)) failures.push(`Indexable generated page missing from sitemap: ${expected}`);
  }
  return { failures, sitemapUrls, pageUrls };
}

export function validateHttpPage({ status, html, headersNoindex = '', expectedStatus, expectedPage, requireIndexable = true }) {
  const failures = [];
  const metadata = pageMetadata(html);
  if (status !== expectedStatus) failures.push(`expected HTTP ${expectedStatus}, received ${status}`);
  if (metadata.title !== expectedPage.title) failures.push('title differs from the built page (possible homepage fallback or stale deployment)');
  if (metadata.h1 !== expectedPage.h1) failures.push('H1 differs from the built page');
  if (metadata.canonical !== expectedPage.canonical) failures.push('canonical differs from the built page');
  if (expectedStatus === 404 && !metadata.noindex) failures.push('404 response is missing noindex');
  if (requireIndexable && expectedStatus === 200 && (metadata.noindex || /noindex/i.test(headersNoindex))) failures.push('public page is unexpectedly noindex');
  return failures;
}
