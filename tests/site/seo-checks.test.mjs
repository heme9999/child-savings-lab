import { describe, expect, it } from 'vitest';
import { assetMime, collectReleaseAssets, metaContent, validateAssetResponse, validatePublicationMetadata, validateSocialPng } from '../../scripts/lib/seo-checks.mjs';

const siteUrl = 'https://child-savings-lab-mvp.pages.dev/';
const image = `${siteUrl}social/child-savings-lab.png`;
function fixture(home = true) {
  const schemas = [
    { '@type': 'WebPage', publisher: { name: 'Child Savings Lab' }, isPartOf: { '@id': `${siteUrl}#website` } },
    ...(home ? [{ '@type': 'WebSite', name: 'Child Savings Lab', '@id': `${siteUrl}#website`, url: siteUrl }] : [])
  ];
  return `<script type="application/ld+json">${JSON.stringify(schemas)}</script>` + [
    ['og:image', image], ['twitter:image', image], ['twitter:card', 'summary_large_image'],
    ['og:image:alt', 'Child Savings Lab tools'], ['twitter:image:alt', 'Child Savings Lab tools'],
    ['og:image:type', 'image/png'], ['og:image:width', '1200'], ['og:image:height', '630']
  ].map(([key, value]) => `<meta property="${key}" content="${value}">`).join('');
}

describe('built publication and social metadata gates', () => {
  it('accepts one branded root website and an inner-page reference', () => {
    expect(validatePublicationMetadata(fixture(), { isHome: true, siteUrl })).toEqual([]);
    expect(validatePublicationMetadata(fixture(false), { isHome: false, siteUrl })).toEqual([]);
  });
  it('rejects a page title being reused as the publication name', () => {
    const html = fixture().replace('"name":"Child Savings Lab","@id"', '"name":"Child Savings Guides & Free Calculators","@id"');
    expect(validatePublicationMetadata(html, { isHome: true, siteUrl }).join(' ')).toContain('neutral-brand WebSite');
  });
  it('rejects a separate website entity on an inner page', () => {
    expect(validatePublicationMetadata(fixture(), { siteUrl }).join(' ')).toContain('inner page');
  });
  it('rejects missing image alternatives, wrong dimensions, or inconsistent Twitter metadata', () => {
    for (const key of ['og:image:alt', 'twitter:image:alt', 'og:image:width', 'twitter:card']) {
      const html = fixture().replace(new RegExp(`<meta property="${key}"[^>]+>`), '');
      expect(validatePublicationMetadata(html, { isHome: true, siteUrl }).length).toBeGreaterThan(0);
    }
  });
  it('rejects relative or external sharing image URLs', () => {
    for (const replacement of ['/social/test.png', 'https://other.example/social/test.png']) {
      expect(validatePublicationMetadata(fixture().replaceAll(image, replacement), { isHome: true, siteUrl }).join(' ')).toContain('absolute, same-site');
    }
  });
  it('validates both the PNG signature and its declared dimensions', () => {
    const png = Buffer.alloc(24); Buffer.from('89504e470d0a1a0a', 'hex').copy(png);
    png.writeUInt32BE(1200, 16); png.writeUInt32BE(630, 20);
    expect(validateSocialPng(png)).toEqual([]);
    png.writeUInt32BE(300, 16); expect(validateSocialPng(png).join(' ')).toContain('1200 by 630');
    expect(validateSocialPng(Buffer.from('<html>fallback</html>')).join(' ')).toContain('not a PNG');
  });
});

describe('release asset regression gates', () => {
  it('deduplicates the actual JS, CSS, and image references', () => {
    const html = fixture() + '<script src="/_astro/tool.js"></script><link href="/_astro/site.css">';
    expect(metaContent(html, 'og:image')).toBe(image);
    expect(collectReleaseAssets([{ html }, { html }])).toEqual(['/_astro/site.css', '/_astro/tool.js', '/social/child-savings-lab.png']);
  });
  it('accepts matching bytes and MIME type', () => {
    const bytes = Buffer.from('body{color:green}');
    expect(validateAssetResponse({ status: 200, bytes, expectedBytes: bytes, contentType: 'text/css; charset=utf-8', expectedMime: assetMime('/site.css') })).toEqual([]);
  });
  it('also checks shared chunks imported by a script rather than referenced in HTML', () => {
    expect(collectReleaseAssets([{ html: fixture() }], ['/_astro/shared.js'])).toContain('/_astro/shared.js');
  });
  it('rejects HTTP-200 homepage fallbacks and stale bytes', () => {
    const errors = validateAssetResponse({ status: 200, bytes: Buffer.from('<html>home</html>'), expectedBytes: Buffer.from('new script'), contentType: 'text/html', expectedMime: assetMime('/tool.js') });
    expect(errors.join(' ')).toContain('MIME'); expect(errors.join(' ')).toContain('SHA-256');
  });
  it('rejects failed asset responses even with matching bytes', () => {
    const bytes = Buffer.from('script');
    expect(validateAssetResponse({ status: 404, bytes, expectedBytes: bytes, contentType: 'text/javascript', expectedMime: assetMime('/tool.js') }).join(' ')).toContain('HTTP 200');
    expect(() => assetMime('/unknown.exe')).toThrow('Unsupported');
  });
});
