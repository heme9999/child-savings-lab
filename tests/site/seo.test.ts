import { describe, expect, it } from 'vitest';
import { pageSchema, publication, websiteSchema, socialCardForPath } from '../../src/lib/seo';

const site = new URL('https://child-savings-lab-mvp.pages.dev/');
describe('publication and page entities', () => {
  it('uses the neutral brand and canonical root for the single website entity', () => {
    expect(websiteSchema(site)).toMatchObject({ '@type': 'WebSite', name: 'Child Savings Lab', url: site.href, '@id': `${site.href}#website` });
    expect(websiteSchema(site).publisher.name).toBe(publication.name);
  });
  it('models a tool landing page as a page, not a new website', () => {
    const canonical = new URL('/tools/trump-account-growth-calculator/', site);
    expect(pageSchema({ title: 'Trump Account Growth Calculator', description: 'A hypothetical illustration.', canonical, site })).toMatchObject({
      '@type': 'WebPage', name: 'Trump Account Growth Calculator', url: canonical.href,
      isPartOf: { '@id': `${site.href}#website` }, publisher: { name: publication.name }
    });
  });
  it('preserves the verified article date without inventing a publication date or reviewer', () => {
    const schema = pageSchema({ title: 'A guide', description: 'Source-linked education.', canonical: new URL('/guide/', site), site, type: 'article', verifiedAt: '2026-10-12' });
    expect(schema).toMatchObject({ '@type': 'Article', headline: 'A guide', dateModified: '2026-10-12' });
    expect(schema).not.toHaveProperty('datePublished');
    expect(schema).not.toHaveProperty('reviewedBy');
    expect(schema).not.toHaveProperty('author');
  });
  it('does not add freshness dates to an undated page', () => {
    expect(pageSchema({ title: 'Home', description: 'Education.', canonical: site, site })).not.toHaveProperty('dateModified');
  });
  it('gives each interactive tool a specific card and other pages a neutral brand fallback', () => {
    expect(socialCardForPath('/').path).toBe('/social/child-savings-lab.png');
    expect(socialCardForPath('/guides/529-plans/').path).toBe('/social/child-savings-lab.png');
    expect(socialCardForPath('/tools/trump-account-growth-calculator/').path).toBe('/social/trump-account-growth.png');
    expect(socialCardForPath('/tools/trump-account-eligibility-checker/').path).toBe('/social/trump-account-checker.png');
    for (const path of ['/', '/tools/trump-account-growth-calculator/', '/tools/trump-account-eligibility-checker/']) expect(socialCardForPath(path).alt).toContain(publication.name);
  });
});
