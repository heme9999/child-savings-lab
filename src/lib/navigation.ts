const items = [
  { label: 'Trump Accounts', href: '/trump-accounts/' },
  { label: '529 plans', href: '/guides/529-plans/' },
  { label: 'Tools', href: '/tools/' },
  { label: 'Compare', href: '/tools/child-savings-account-comparison/' },
  { label: 'Sources', href: '/sources/' }
];

export function primaryNavigation(pathname: string) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const exact = items.find((item) => item.href === path);
  const section = path.startsWith('/compare/') ? 'Compare'
    : path.startsWith('/tools/') ? 'Tools'
    : ['/trump-accounts/', '/forms/', '/contributions/', '/employers/'].some((prefix) => path.startsWith(prefix)) ? 'Trump Accounts'
    : undefined;
  const active = exact?.label ?? section;
  return items.map((item) => ({ ...item, current: item.label === active ? (exact ? 'page' as const : 'true' as const) : undefined }));
}
