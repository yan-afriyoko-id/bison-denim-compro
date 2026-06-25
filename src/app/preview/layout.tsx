import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { Header } from '@/components/public/header';
import { Footer } from '@/components/public/footer';
import { GoogleTranslateScripts } from '@/components/public/google-translate-scripts';
import { getNavigationTree, getPublicSiteSettings } from '@/lib/public-content';

export default async function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    redirect('/auth/login');
  }

  const [navigation, { grouped }] = await Promise.all([
    getNavigationTree('header'),
    getPublicSiteSettings(),
  ]);

  return (
    <div className="theme-light flex min-h-screen flex-col bg-background text-text-primary">
      <GoogleTranslateScripts />
      <div className="sticky top-0 z-[60] border-b border-amber-200 bg-amber-50 px-6 py-3">
        <div className="mx-auto max-w-7xl text-sm font-semibold text-amber-800">
          Preview Mode
        </div>
      </div>
      <Header navigation={navigation} siteName={grouped.brand.site_name} logoUrl={grouped.brand.logo} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
