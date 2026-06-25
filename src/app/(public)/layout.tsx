import { Header } from '@/components/public/header';
import { Footer } from '@/components/public/footer';
import { GoogleTranslateScripts } from '@/components/public/google-translate-scripts';
import { getNavigationTree, getPublicSiteSettings } from '@/lib/public-content';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navigation, { grouped }] = await Promise.all([
    getNavigationTree('header'),
    getPublicSiteSettings(),
  ]);

  return (
    <div className="theme-light flex min-h-screen flex-col bg-background text-text-primary">
      <GoogleTranslateScripts />
      <Header
        navigation={navigation}
        siteName={grouped.brand.site_name}
        logoUrl={grouped.brand.logo}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
