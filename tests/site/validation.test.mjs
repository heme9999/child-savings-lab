import { describe, expect, it } from 'vitest';
import { pageMetadata, publicSiteUrl, validateHttpPage, validateSitemapConsistency } from '../../scripts/lib/site-manifest.mjs';

const page = (route, extras = {}) => ({ route, file: route === '/' ? 'index.html' : `${route.slice(1)}index.html`, canonical: new URL(route, publicSiteUrl).href, noindex: false, isError: false, ...extras });
const xml = (kind, urls) => `<?xml version="1.0"?><${kind} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<${kind === 'urlset' ? 'url' : 'sitemap'}><loc>${url}</loc></${kind === 'urlset' ? 'url' : 'sitemap'}>`).join('')}</${kind}>`;
function fixture() {
  return {
    indexXml: xml('sitemapindex', [new URL('/sitemap-0.xml', publicSiteUrl).href]),
    sitemapFiles: new Map([['/sitemap-0.xml', xml('urlset', [publicSiteUrl, new URL('/guide/', publicSiteUrl).href])]]),
    pages: [page('/'), page('/guide/'), page('/404', { file: '404.html', isError: true, noindex: true })]
  };
}

describe('sitemap and generated-file consistency', () => {
  it('accepts an exact match while excluding the error page', () => {
    expect(validateSitemapConsistency(fixture()).failures).toEqual([]);
  });
  it('rejects a child sitemap XML file that was not generated', () => {
    const build = fixture();
    build.sitemapFiles.clear();
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('missing XML file');
  });
  it('rejects the reported missing comparison route even if hosting would return HTTP 200', () => {
    const build = fixture();
    build.sitemapFiles.set('/sitemap-0.xml', xml('urlset', [publicSiteUrl, new URL('/guide/', publicSiteUrl).href, new URL('/compare/529-plans-vs-custodial-accounts/', publicSiteUrl).href]));
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('missing generated HTML file');
  });
  it('rejects an indexable page omitted from the sitemap', () => {
    const build = fixture();
    build.pages.push(page('/new-guide/'));
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('missing from sitemap');
  });
  it.each([{ isError: true }, { noindex: true }])('rejects an error/noindex page included in the sitemap: %j', (flags) => {
    const build = fixture();
    Object.assign(build.pages[1], flags);
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('non-indexable page');
  });
  it('rejects a generated page carrying the homepage canonical', () => {
    const build = fixture();
    build.pages[1].canonical = publicSiteUrl;
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('canonical');
  });
  it('rejects duplicate page URLs', () => {
    const build = fixture();
    build.sitemapFiles.set('/sitemap-0.xml', xml('urlset', [publicSiteUrl, publicSiteUrl]));
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('Duplicate sitemap page');
  });
  it('rejects duplicate child sitemap references', () => {
    const build = fixture();
    const url = new URL('/sitemap-0.xml', publicSiteUrl).href;
    build.indexXml = xml('sitemapindex', [url, url]);
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('Duplicate child sitemap');
  });
  it.each(['https://other.example/guide/', `${publicSiteUrl}guide/?a=1`, `${publicSiteUrl}guide/#section`, '/guide/'])('rejects off-site or non-canonical URLs: %s', (url) => {
    const build = fixture();
    build.sitemapFiles.set('/sitemap-0.xml', xml('urlset', [url]));
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('non-canonical site URL');
  });
  it('rejects empty or incorrect XML documents', () => {
    const build = fixture();
    build.indexXml = '<html>homepage fallback</html>';
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('missing sitemapindex document');
    build.indexXml = xml('sitemapindex', []);
    expect(validateSitemapConsistency(build).failures.join(' ')).toContain('no valid locations');
  });
});

const homeHtml = `<title>Child Savings Guides &amp; Free Calculators | Child Savings Lab</title><link rel="canonical" href="${publicSiteUrl}"><h1>Their tomorrow.</h1>`;
const errorHtml = `<title>Page Not Found | Child Savings Lab</title><link rel="canonical" href="${publicSiteUrl}404"><meta name="robots" content="noindex,nofollow"><h1>Let’s find your next step.</h1>`;
describe('deployment HTTP regression checks', () => {
  it('decodes the descriptive homepage title', () => {
    expect(pageMetadata(homeHtml).title).toBe('Child Savings Guides & Free Calculators | Child Savings Lab');
  });
  it('accepts a real HTTP 404 response with the built error page', () => {
    expect(validateHttpPage({ status: 404, html: errorHtml, expectedStatus: 404, expectedPage: pageMetadata(errorHtml) })).toEqual([]);
  });
  it('rejects homepage fallback for a missing path', () => {
    const failures = validateHttpPage({ status: 200, html: homeHtml, expectedStatus: 404, expectedPage: pageMetadata(errorHtml) });
    expect(failures.join(' ')).toContain('expected HTTP 404');
    expect(failures.join(' ')).toContain('canonical differs');
  });
  it('rejects an error-looking page that still returns HTTP 200', () => {
    expect(validateHttpPage({ status: 200, html: errorHtml, expectedStatus: 404, expectedPage: pageMetadata(errorHtml) }).join(' ')).toContain('expected HTTP 404');
  });
  it('rejects fallback content on a listed public route', () => {
    expect(validateHttpPage({ status: 200, html: homeHtml, expectedStatus: 200, expectedPage: { title: 'A guide', h1: 'Guide', canonical: `${publicSiteUrl}guide/` } }).join(' ')).toContain('possible homepage fallback');
  });
  it('rejects noindex headers on production but permits them on previews', () => {
    const input = { status: 200, html: homeHtml, headersNoindex: 'noindex, nofollow', expectedStatus: 200, expectedPage: pageMetadata(homeHtml) };
    expect(validateHttpPage(input).join(' ')).toContain('unexpectedly noindex');
    expect(validateHttpPage({ ...input, requireIndexable: false })).toEqual([]);
  });
  it('rejects an error page missing its noindex safeguard', () => {
    expect(validateHttpPage({ status: 404, html: errorHtml.replace('<meta name="robots" content="noindex,nofollow">', ''), expectedStatus: 404, expectedPage: pageMetadata(errorHtml) }).join(' ')).toContain('missing noindex');
  });
});
