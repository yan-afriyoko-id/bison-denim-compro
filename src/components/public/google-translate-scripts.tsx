import Script from 'next/script';

const SOURCE_LANGUAGE = 'id';
const GOOGLE_TRANSLATE_COOKIE = 'googtrans';
const PREFERRED_LOCALE_KEY = 'preferred-locale';
const DEFAULT_LOCALE = 'en';
const DEFAULT_TARGET_LANGUAGE = 'en';

export function GoogleTranslateScripts() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var preferredKey = '${PREFERRED_LOCALE_KEY}';
              var cookieName = '${GOOGLE_TRANSLATE_COOKIE}';
              var defaultLocale = '${DEFAULT_LOCALE}';
              var defaultCookie = '/${SOURCE_LANGUAGE}/${DEFAULT_TARGET_LANGUAGE}';
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
          `,
        }}
      />
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
      <div id="google_translate_element" className="sr-only" aria-hidden="true" />
    </>
  );
}
