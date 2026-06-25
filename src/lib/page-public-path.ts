import type { NavigationItem, Page } from '@/types';

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '');
}

export function buildDefaultPagePath(page: Pick<Page, 'slug' | 'page_key'>) {
  return page.page_key === 'home' || page.slug === 'home' ? '/' : `/${trimSlashes(page.slug)}`;
}

export function buildChildPagePath(parentHref: string, slug: string) {
  const parentPath = trimSlashes(parentHref);
  const childSlug = trimSlashes(slug);

  if (!parentPath) {
    return `/${childSlug}`;
  }

  if (!childSlug) {
    return `/${parentPath}`;
  }

  return `/${parentPath}/${childSlug}`;
}

export function findPageNavigationItem(
  page: Pick<Page, 'slug' | 'page_key' | 'title'>,
  navItems: NavigationItem[]
) {
  const defaultPath = buildDefaultPagePath(page);

  if (defaultPath === '/') {
    return navItems.find((item) => item.href === '/');
  }

  const slugSuffix = `/${trimSlashes(page.slug)}`;

  return (
    navItems.find((item) => item.href === defaultPath) ??
    navItems.find((item) => item.href.endsWith(slugSuffix) && item.label === page.title) ??
    navItems.find((item) => item.href.endsWith(slugSuffix))
  );
}

export function resolvePagePublicPath(
  page: Pick<Page, 'slug' | 'page_key' | 'title'>,
  navItems: NavigationItem[]
) {
  return findPageNavigationItem(page, navItems)?.href ?? buildDefaultPagePath(page);
}
