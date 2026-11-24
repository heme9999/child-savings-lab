import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { permanentRedirects, publicSiteUrl, validateHttpRedirect } from '../../scripts/lib/site-manifest.mjs';

describe('permanent comparison migration and sitemap alias', () => {
  it('ships exactly the permanent redirects checked after deployment', () => {
    const rules = readFileSync('public/_redirects', 'utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    expect(rules.sort()).toEqual(permanentRedirects.map(({ path, destination }) => `${path} ${destination} 301`).sort());
    expect(permanentRedirects.find(rule => rule.path === '/tools/child-savings-account-comparison/')?.destination).toBe('/guides/child-savings-account-comparison/');
  });
  it.each(permanentRedirects)('accepts a direct same-site 301 for $path', ({ destination }) => {
    expect(validateHttpRedirect({ status: 301, location: destination, destination })).toEqual([]);
    expect(validateHttpRedirect({ status: 301, location: new URL(destination, publicSiteUrl).href, destination })).toEqual([]);
  });
  it.each([200, 302, 404])('rejects fallback, temporary redirects and missing paths: %s', status => {
    expect(validateHttpRedirect({ status, location: '/guides/child-savings-account-comparison/', destination: '/guides/child-savings-account-comparison/' }).join(' ')).toContain('expected HTTP 301');
  });
  it.each([null, '', '/', '/tools/child-savings-account-comparison/', 'https://unrelated.example/guides/child-savings-account-comparison/'])('rejects a missing, looping, homepage or off-site Location: %s', location => {
    expect(validateHttpRedirect({ status: 301, location, destination: '/guides/child-savings-account-comparison/' }).length).toBeGreaterThan(0);
  });
  it('checks preview redirects against the preview origin rather than sending visitors to production', () => {
    const siteUrl = 'https://preview.child-savings-lab-mvp.pages.dev/';
    expect(validateHttpRedirect({ status: 301, location: '/guides/child-savings-account-comparison/', destination: '/guides/child-savings-account-comparison/', siteUrl })).toEqual([]);
    expect(validateHttpRedirect({ status: 301, location: `${publicSiteUrl}guides/child-savings-account-comparison/`, destination: '/guides/child-savings-account-comparison/', siteUrl }).length).toBeGreaterThan(0);
  });
});
