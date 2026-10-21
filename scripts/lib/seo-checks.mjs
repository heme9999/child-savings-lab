import { createHash } from 'node:crypto';

export function metaContent(html, key) {
  return html.match(new RegExp(`<meta\\b[^>]*(?:name|property)="${key}"[^>]*content="([^"]*)"`, 'i'))?.[1] ?? '';
}

export function validatePublicationMetadata(html, { isHome = false, siteUrl }) {
  const failures = [];
  const root = new URL('/', siteUrl).href;
  const schemas = [];
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)) {
    try { const data = JSON.parse(match[1]); schemas.push(...(Array.isArray(data) ? data : data['@graph'] ?? [data])); }
    catch { failures.push('invalid JSON-LD'); }
  }
  const websites = schemas.filter(schema => schema['@type'] === 'WebSite');
  if (isHome) {
    if (websites.length !== 1 || websites[0].name !== 'Child Savings Lab' || websites[0].url !== root || websites[0]['@id'] !== `${root}#website`) failures.push('homepage must declare one neutral-brand WebSite at the canonical root');
  } else if (websites.length) failures.push('an inner page must not declare a different WebSite');
  const page = schemas.find(schema => ['WebPage', 'Article'].includes(schema['@type']));
  if (!page || page.isPartOf?.['@id'] !== `${root}#website` || page.publisher?.name !== 'Child Savings Lab') failures.push('page must reference the publication and website identity');
  const image = metaContent(html, 'og:image');
  try {
    const url = new URL(image);
    if (url.origin !== new URL(root).origin || !/^\/social\/[a-z-]+\.png$/.test(url.pathname) || url.search || url.hash) throw new Error();
  } catch { failures.push('sharing image must be an absolute, same-site social PNG URL'); }
  if (metaContent(html, 'twitter:image') !== image || metaContent(html, 'twitter:card') !== 'summary_large_image') failures.push('Twitter card must use the same large sharing image');
  if (!metaContent(html, 'og:image:alt') || !metaContent(html, 'twitter:image:alt')) failures.push('sharing images require descriptive alternative text');
  if (metaContent(html, 'og:image:type') !== 'image/png' || metaContent(html, 'og:image:width') !== '1200' || metaContent(html, 'og:image:height') !== '630') failures.push('sharing metadata must identify a 1200 by 630 PNG');
  return failures;
}

export function validateSocialPng(bytes) {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return ['social image is not a PNG'];
  return bytes.readUInt32BE(16) === 1200 && bytes.readUInt32BE(20) === 630 ? [] : ['social PNG must be 1200 by 630'];
}

export function assetMime(path) {
  if (path.endsWith('.js')) return /(?:text|application)\/(?:javascript|ecmascript)/i;
  if (path.endsWith('.css')) return /text\/css/i;
  if (path.endsWith('.png')) return /image\/png/i;
  throw new Error(`Unsupported release asset type: ${path}`);
}

export function collectReleaseAssets(pages, bundledAssets = []) {
  const paths = new Set(bundledAssets);
  for (const page of pages) {
    for (const match of page.html.matchAll(/(?:src|href)="(\/_astro\/[^"?#]+)"/g)) paths.add(match[1]);
    const social = metaContent(page.html, 'og:image');
    if (social) paths.add(new URL(social).pathname);
  }
  return [...paths].sort();
}

export function validateAssetResponse({ status, contentType, bytes, expectedBytes, expectedMime }) {
  const failures = [];
  if (status !== 200) failures.push(`asset expected HTTP 200, received ${status}`);
  if (!expectedMime.test(contentType ?? '')) failures.push('asset MIME type does not match its file type');
  const hash = value => createHash('sha256').update(value).digest('hex');
  if (hash(bytes) !== hash(expectedBytes)) failures.push('asset SHA-256 differs from the built file');
  return failures;
}
