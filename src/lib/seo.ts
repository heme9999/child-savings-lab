export const publication = {
  name: 'Child Savings Lab',
  description: 'Independent child savings guides and free, browser-local financial education tools.'
} as const;

export function socialCardForPath(path: string) {
  if (path === '/tools/trump-account-growth-calculator/') return { path: '/social/trump-account-growth.png', alt: 'Child Savings Lab Trump Account growth calculator: contributions, fee impact, and visible assumptions.' };
  if (path === '/tools/trump-account-eligibility-checker/') return { path: '/social/trump-account-checker.png', alt: 'Child Savings Lab Trump Account status checker: account next steps and the separate pilot election.' };
  return { path: '/social/child-savings-lab.png', alt: 'Child Savings Lab: independent child savings guides and free tools.' };
}

export function websiteSchema(site: URL) {
  const root = new URL('/', site).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${root}#website`,
    name: publication.name,
    description: publication.description,
    url: root,
    publisher: { '@type': 'Organization', '@id': `${root}#publisher`, name: publication.name, url: root }
  };
}

interface PageSchemaInput {
  title: string;
  description: string;
  canonical: URL;
  site: URL;
  type?: 'website' | 'article';
  verifiedAt?: string;
}

export function pageSchema({ title, description, canonical, site, type = 'website', verifiedAt }: PageSchemaInput) {
  const root = new URL('/', site).href;
  return {
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'Article' : 'WebPage',
    '@id': `${canonical.href}#webpage`,
    name: title,
    ...(type === 'article' ? { headline: title } : {}),
    description,
    url: canonical.href,
    isPartOf: { '@id': `${root}#website` },
    publisher: { '@type': 'Organization', '@id': `${root}#publisher`, name: publication.name, url: root },
    ...(verifiedAt ? { dateModified: verifiedAt } : {})
  };
}
