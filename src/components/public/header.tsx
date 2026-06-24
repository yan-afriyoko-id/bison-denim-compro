'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Script from 'next/script';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, Globe, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { SearchOverlay } from './search-overlay';
import { createClient } from '@/lib/supabase/client';
import type { PublicNavItem } from '@/lib/public-content';

const SOURCE_LANGUAGE = 'id';
const GOOGLE_TRANSLATE_COOKIE = 'googtrans';
const PREFERRED_LOCALE_KEY = 'preferred-locale';

const localeOptions = {
  id: { flag: '\uD83C\uDDEE\uD83C\uDDE9', label: 'Bahasa Indonesia', googleCode: 'id' },
  en: { flag: '\uD83C\uDDFA\uD83C\uDDF8', label: 'English', googleCode: 'en' },
  jp: { flag: '\uD83C\uDDEF\uD83C\uDDF5', label: 'Jepang', googleCode: 'ja' },
  cn: { flag: '\uD83C\uDDE8\uD83C\uDDF3', label: 'Mandarin', googleCode: 'zh-CN' },
} as const;

type LocaleKey = keyof typeof localeOptions;

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: {
          new (
            options: {
              pageLanguage: string;
              includedLanguages: string;
              autoDisplay?: boolean;
              layout?: unknown;
            },
            elementId: string
          ): unknown;
          InlineLayout?: {
            SIMPLE: unknown;
          };
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

const localeKeys = Object.keys(localeOptions) as LocaleKey[];
const DEFAULT_LOCALE: LocaleKey = 'en';

function getGoogleTranslateCookieValue() {
  if (typeof document === 'undefined') {
    return null;
  }

  return (
    document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${GOOGLE_TRANSLATE_COOKIE}=`))
    ?.split('=')
    .slice(1)
    .join('=') ?? null
  );
}

function getSavedLocale(): LocaleKey {
  const cookieValue = getGoogleTranslateCookieValue();
  if (!cookieValue) {
    return 'id';
  }

  const targetLanguage = decodeURIComponent(cookieValue).split('/').pop();

  return localeKeys.find((locale) => localeOptions[locale].googleCode === targetLanguage) ?? 'id';
}

function getPreferredLocale(): LocaleKey {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const storedLocale = window.localStorage.getItem(PREFERRED_LOCALE_KEY);

  if (storedLocale && localeKeys.includes(storedLocale as LocaleKey)) {
    return storedLocale as LocaleKey;
  }

  if (!getGoogleTranslateCookieValue()) {
    return DEFAULT_LOCALE;
  }

  return getSavedLocale();
}

function setGoogleTranslateCookie(value: string) {
  document.cookie = `${GOOGLE_TRANSLATE_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
}

function persistPreferredLocale(locale: LocaleKey) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PREFERRED_LOCALE_KEY, locale);
}

function triggerGoogleTranslate(languageCode: string) {
  const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');

  if (!select) {
    return false;
  }

  if (select.value === languageCode) {
    return true;
  }

  select.value = languageCode;
  select.dispatchEvent(new Event('change'));

  return true;
}

function ensureGoogleTranslateElement() {
  const TranslateElement = window.google?.translate?.TranslateElement;
  const container = document.getElementById('google_translate_element');

  if (!TranslateElement || !container || container.childElementCount > 0) {
    return;
  }

  new TranslateElement(
    {
      pageLanguage: SOURCE_LANGUAGE,
      includedLanguages: localeKeys.map((locale) => localeOptions[locale].googleCode).join(','),
      autoDisplay: false,
      layout: TranslateElement.InlineLayout?.SIMPLE,
    },
    'google_translate_element'
  );
}

function syncGoogleTranslateState(locale: LocaleKey) {
  if (locale === 'id') {
    setGoogleTranslateCookie(`/${SOURCE_LANGUAGE}/${SOURCE_LANGUAGE}`);
    return;
  }

  const targetLanguage = localeOptions[locale].googleCode;
  setGoogleTranslateCookie(`/${SOURCE_LANGUAGE}/${targetLanguage}`);
  triggerGoogleTranslate(targetLanguage);
}

function isInternalHref(href: string) {
  return href.startsWith('/');
}

export function Header({
  navigation,
  siteName,
  logoUrl,
}: {
  navigation: PublicNavItem[];
  siteName: string;
  logoUrl: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<LocaleKey>(DEFAULT_LOCALE);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      let shouldClose = true;
      dropdownRefs.current.forEach((ref) => {
        if (ref && ref.contains(e.target as Node)) shouldClose = false;
      });
      if (shouldClose) setOpenDropdown(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const preferredLocale = getPreferredLocale();
      persistPreferredLocale(preferredLocale);
      setActiveLocale(preferredLocale);
    });
  }, []);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      ensureGoogleTranslateElement();

      syncGoogleTranslateState(getPreferredLocale());
    };

    ensureGoogleTranslateElement();

    return () => {
      delete window.googleTranslateElementInit;
    };
  }, []);

  useEffect(() => {
    const keepTranslationActive = () => {
      syncGoogleTranslateState(getPreferredLocale());
    };

    const intervalId = window.setInterval(keepTranslationActive, 1500);

    window.addEventListener('focus', keepTranslationActive);
    window.addEventListener('pageshow', keepTranslationActive);
    document.addEventListener('visibilitychange', keepTranslationActive);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', keepTranslationActive);
      window.removeEventListener('pageshow', keepTranslationActive);
      document.removeEventListener('visibilitychange', keepTranslationActive);
    };
  }, []);

  const isActive = (href: string) => {
    if (!isInternalHref(href)) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLanguageChange = (locale: LocaleKey) => {
    const targetLanguage = localeOptions[locale].googleCode;

    persistPreferredLocale(locale);
    setGoogleTranslateCookie(`/${SOURCE_LANGUAGE}/${targetLanguage}`);
    setActiveLocale(locale);
    setLangOpen(false);
    setMobileOpen(false);

    if (!triggerGoogleTranslate(targetLanguage)) {
      window.location.reload();
    }
  };

  return (
    <>
      <Script
        id="google-translate-default-locale"
        strategy="beforeInteractive"
      >{`
        (function () {
          var preferredKey = '${PREFERRED_LOCALE_KEY}';
          var cookieName = '${GOOGLE_TRANSLATE_COOKIE}';
          var defaultLocale = '${DEFAULT_LOCALE}';
          var defaultCookie = '/${SOURCE_LANGUAGE}/${localeOptions.en.googleCode}';
          var hasPreferredLocale = false;
          var hasTranslateCookie = false;

          try {
            hasPreferredLocale = !!window.localStorage.getItem(preferredKey);
          } catch (error) {}

          hasTranslateCookie = document.cookie.split('; ').some(function (row) {
            return row.indexOf(cookieName + '=') === 0;
          });

          if (!hasPreferredLocale) {
            try {
              window.localStorage.setItem(preferredKey, defaultLocale);
            } catch (error) {}
          }

          if (!hasTranslateCookie) {
            document.cookie = cookieName + '=' + encodeURIComponent(defaultCookie) + '; path=/; max-age=31536000';
          }
        })();
      `}</Script>
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
      <div id="google_translate_element" className="sr-only" aria-hidden="true" />

      <header className="sticky top-0 z-50 border-b border-[#d4d4d4] bg-white/95 backdrop-blur-md transition-[background-color,box-shadow] duration-300 ease-out">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
          <Link href="/" className="navbar-interactive flex items-center gap-3 flex-shrink-0 rounded-sm">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image
                src={logoUrl}
                alt={`${siteName} logo`}
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-sm font-bold text-black tracking-tight uppercase">
                {siteName}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center h-full">
            {navigation.map((link) => {
              const hasChildren = link.children.length > 0;
              const isDropdownOpen = openDropdown === link.id;

              return (
                <div
                  key={link.id}
                  ref={(el) => {
                    if (hasChildren) dropdownRefs.current.set(link.id, el);
                  }}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => hasChildren && setOpenDropdown(link.id)}
                  onMouseLeave={() => hasChildren && setOpenDropdown(null)}
                >
                  <Link
                    href={link.href}
                    target={link.open_new_tab ? '_blank' : undefined}
                    rel={link.open_new_tab ? 'noopener noreferrer' : undefined}
                    className={cn(
                      'navbar-interactive flex h-full items-center gap-1 px-4 text-sm font-semibold tracking-tight border-b-2 border-transparent transition-[color,border-color] duration-300 ease-out',
                      isActive(link.href)
                        ? 'text-black border-black'
                        : 'text-[#555] hover:text-black hover:border-[#d4d4d4]'
                    )}
                  >
                    {link.label}
                    {hasChildren && <ChevronDown size={14} className={cn('transition-transform duration-200', isDropdownOpen && 'rotate-180')} />}
                  </Link>

                  {hasChildren && isDropdownOpen && (
                    <div className="navbar-dropdown absolute top-full left-0 z-50 w-48 border border-[#d4d4d4] bg-white/95 py-1 shadow-[0_18px_50px_rgba(17,17,17,0.08)] backdrop-blur-sm">
                      {link.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          target={child.open_new_tab ? '_blank' : undefined}
                          rel={child.open_new_tab ? 'noopener noreferrer' : undefined}
                          onClick={() => setOpenDropdown(null)}
                          className={cn(
                            'navbar-interactive block border-l-2 border-transparent px-4 py-2.5 text-sm transition-[background-color,color,border-color] duration-300 ease-out',
                            isActive(child.href)
                              ? 'text-black font-semibold border-black bg-[#f7f7f7]'
                              : 'text-[#555] hover:text-black hover:bg-[#f7f7f7] hover:border-[#d4d4d4]'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="navbar-interactive hidden h-9 w-9 items-center justify-center rounded-sm text-[#555] transition-[background-color,color] duration-300 ease-out hover:bg-[#f7f7f7] hover:text-black md:flex"
              aria-label="Cari"
            >
              <Search size={16} />
            </button>

            <div className="relative hidden md:block" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="navbar-interactive flex h-9 items-center gap-1 rounded-sm px-2 text-sm text-[#555] transition-[background-color,color] duration-300 ease-out hover:bg-[#f7f7f7] hover:text-black"
                aria-label="Bahasa"
              >
                <Globe size={14} />
                <span className="text-xs">{localeOptions[activeLocale].flag}</span>
                <ChevronDown size={12} className={cn('transition-transform duration-200', langOpen && 'rotate-180')} />
              </button>
              {langOpen && (
                <div className="navbar-dropdown absolute right-0 z-50 w-40 border border-[#d4d4d4] bg-white/95 py-1 shadow-[0_18px_50px_rgba(17,17,17,0.08)] backdrop-blur-sm">
                  {localeKeys.map((locale) => (
                    <button
                      type="button"
                      key={locale}
                      onClick={() => handleLanguageChange(locale)}
                      aria-pressed={activeLocale === locale}
                      className={cn(
                        'navbar-interactive flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-[background-color,color] duration-300 ease-out',
                        activeLocale === locale
                          ? 'bg-[#f7f7f7] font-semibold text-black'
                          : 'text-[#555] hover:text-black hover:bg-[#f7f7f7]'
                      )}
                    >
                      <span className="text-xs">{localeOptions[locale].flag}</span>
                      <span>{localeOptions[locale].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <div className="relative hidden md:block" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="navbar-interactive flex h-9 w-9 items-center justify-center rounded-sm text-[#555] transition-[background-color,color] duration-300 ease-out hover:bg-[#f7f7f7] hover:text-black"
                  aria-label="Profile"
                >
                  <User size={18} />
                </button>
                {profileOpen && (
                  <div className="navbar-dropdown absolute right-0 z-50 w-44 border border-[#d4d4d4] bg-white/95 py-1 shadow-[0_18px_50px_rgba(17,17,17,0.08)] backdrop-blur-sm">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="navbar-interactive flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#555] transition-[background-color,color] duration-300 ease-out hover:text-black hover:bg-[#f7f7f7]"
                    >
                      <LayoutDashboard size={15} />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        setProfileOpen(false);
                        const { signOut } = await import('@/actions/auth.actions');
                        await signOut();
                        router.push('/auth/login');
                      }}
                      className="navbar-interactive flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#555] transition-[background-color,color] duration-300 ease-out hover:text-red-600 hover:bg-[#f7f7f7]"
                    >
                      <LogOut size={15} />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="navbar-interactive hidden h-9 items-center gap-1.5 rounded-sm border border-black bg-white px-4 text-sm font-semibold text-black transition-colors duration-300 ease-out hover:bg-black hover:text-white md:flex"
              >
                Login
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="navbar-interactive flex h-9 w-9 items-center justify-center rounded-sm text-[#555] transition-[background-color,color] duration-300 ease-out hover:bg-[#f7f7f7] hover:text-black md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-[280px] bg-white border-l border-[#d4d4d4] z-50 md:hidden flex flex-col">
            <div className="flex items-center justify-between h-[72px] px-6 border-b border-[#d4d4d4] flex-shrink-0">
              <span className="text-sm font-bold text-black tracking-tight uppercase">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="navbar-interactive flex h-9 w-9 items-center justify-center rounded-sm text-[#555] transition-[background-color,color] duration-300 ease-out hover:bg-[#f7f7f7] hover:text-black"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {navigation.map((link) => {
                const hasChildren = link.children.length > 0;
                return (
                  <div key={link.id}>
                    <Link
                      href={link.href}
                      target={link.open_new_tab ? '_blank' : undefined}
                      rel={link.open_new_tab ? 'noopener noreferrer' : undefined}
                      onClick={() => !hasChildren && setMobileOpen(false)}
                      className={cn(
                        'navbar-interactive flex items-center border-l-2 border-transparent px-4 py-3 text-sm font-semibold transition-[background-color,color,border-color] duration-300 ease-out',
                        isActive(link.href)
                          ? 'text-black border-black bg-[#f7f7f7]'
                          : 'text-[#555] hover:text-black hover:bg-[#f7f7f7]'
                      )}
                    >
                      {link.label}
                    </Link>
                    {hasChildren && (
                      <div className="ml-4 space-y-0.5 mt-0.5">
                        {link.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            target={child.open_new_tab ? '_blank' : undefined}
                            rel={child.open_new_tab ? 'noopener noreferrer' : undefined}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'navbar-interactive flex items-center border-l-2 border-transparent px-4 py-2.5 text-sm transition-[background-color,color,border-color] duration-300 ease-out',
                              isActive(child.href)
                                ? 'text-black border-black bg-[#f7f7f7]'
                                : 'text-[#555] hover:text-black hover:bg-[#f7f7f7] hover:border-[#d4d4d4]'
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-[#d4d4d4] p-4 flex-shrink-0">
              {isLoggedIn ? (
                <div className="mb-3 space-y-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="navbar-interactive flex h-10 items-center justify-center gap-2 border border-black bg-white text-sm font-semibold text-black transition-colors duration-300 ease-out hover:bg-black hover:text-white"
                  >
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileOpen(false);
                      const { signOut } = await import('@/actions/auth.actions');
                      await signOut();
                      router.push('/auth/login');
                    }}
                    className="navbar-interactive flex h-10 w-full items-center justify-center gap-2 border border-red-200 bg-white text-sm font-semibold text-red-600 transition-colors duration-300 ease-out hover:bg-red-50"
                  >
                    <LogOut size={15} />
                    Keluar
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="navbar-interactive mb-3 flex h-10 items-center justify-center border border-black bg-white text-sm font-semibold text-black transition-colors duration-300 ease-out hover:bg-black hover:text-white"
                >
                  Login
                </Link>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-[#999] mb-3">Bahasa</p>
              <div className="space-y-1">
                {localeKeys.map((locale) => (
                  <button
                    type="button"
                    key={locale}
                    onClick={() => handleLanguageChange(locale)}
                    aria-pressed={activeLocale === locale}
                    className={cn(
                      'navbar-interactive flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-[background-color,color] duration-300 ease-out',
                      activeLocale === locale
                        ? 'bg-[#f7f7f7] font-semibold text-black'
                        : 'text-[#555] hover:text-black hover:bg-[#f7f7f7]'
                    )}
                  >
                    <span className="text-xs">{localeOptions[locale].flag}</span>
                    <span>{localeOptions[locale].label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
