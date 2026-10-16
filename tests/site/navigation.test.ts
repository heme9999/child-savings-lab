import { describe, expect, it } from 'vitest';
import { primaryNavigation } from '../../src/lib/navigation';

describe('primary navigation location', () => {
  it.each([
    ['/tools/', 'Tools', 'page'],
    ['/tools/trump-account-growth-calculator/', 'Tools', 'true'],
    ['/tools/trump-account-eligibility-checker/', 'Tools', 'true'],
    ['/tools/child-savings-account-comparison/', 'Compare', 'page'],
    ['/compare/trump-account-vs-529/', 'Compare', 'true'],
    ['/guides/529-plans/', '529 plans', 'page'],
    ['/trump-accounts/', 'Trump Accounts', 'page'],
    ['/forms/form-4547-guide/', 'Trump Accounts', 'true'],
    ['/sources/', 'Sources', 'page']
  ])('marks only the correct page or section for %s', (path, label, current) => {
    const selected = primaryNavigation(path).filter((item) => item.current);
    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({ label, current });
  });
  it.each(['/', '/about/', '/toolshed/', '/this-page-does-not-exist/'])('does not invent a current section for %s', (path) => {
    expect(primaryNavigation(path).filter((item) => item.current)).toHaveLength(0);
  });
  it('normalizes a missing trailing slash without duplicating Compare and Tools', () => {
    expect(primaryNavigation('/tools/child-savings-account-comparison')).toEqual(primaryNavigation('/tools/child-savings-account-comparison/'));
  });
});
