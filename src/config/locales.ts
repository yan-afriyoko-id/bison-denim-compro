export const locales = ['en', 'id', 'jp', 'cn'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
  jp: 'Jepang',
  cn: 'Mandarin',
};

export const localePrefixes: Record<Locale, string> = {
  en: '',
  id: '/id',
  jp: '/jp',
  cn: '/cn',
};

export function getLocaleFromPath(pathname: string): { locale: Locale; path: string } {
  for (const loc of locales) {
    if (loc === 'en') continue;
    if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
      return { locale: loc, path: pathname.slice(3) || '/' };
    }
  }
  return { locale: 'en', path: pathname };
}

export function localizedPath(locale: Locale, path: string): string {
  if (locale === 'en') return path;
  return `/${locale}${path}`;
}

export function getAlternates(locale: Locale, path: string) {
  const alternates: Record<string, string> = {};
  for (const loc of locales) {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}${localizedPath(loc as Locale, path)}`;
    alternates[loc] = url;
  }
  return alternates;
}
