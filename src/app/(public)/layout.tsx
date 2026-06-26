import { Header } from '@/components/public/header';
import { Footer } from '@/components/public/footer';
import { GoogleTranslateScripts } from '@/components/public/google-translate-scripts';
import { getNavigationTree, getPublicSearchItems, getPublicSiteSettings } from '@/lib/public-content';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navigation, searchItems, { grouped }] = await Promise.all([
    getNavigationTree('header'),
    getPublicSearchItems(),
    getPublicSiteSettings(),
  ]);

  return (
    <div className="theme-light flex min-h-screen flex-col bg-background text-text-primary">
      <GoogleTranslateScripts />
      <Header
        navigation={navigation}
        searchItems={searchItems}
        siteName={grouped.brand.site_name}
        logoUrl={grouped.brand.logo}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
