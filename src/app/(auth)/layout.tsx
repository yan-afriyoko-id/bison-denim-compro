import { getPublicSiteSettings } from '@/lib/public-content';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { grouped } = await getPublicSiteSettings();

  return (
    <div
      data-site-name={grouped.brand.site_name || 'Bison Denim'}
      data-logo-url={grouped.brand.logo || '/icon.png'}
    >
      {children}
    </div>
  );
}
