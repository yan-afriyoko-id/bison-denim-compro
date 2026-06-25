import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { Toaster } from 'sonner';
import { getPublicSiteSettings } from '@/lib/public-content';
import { siteConfig } from '@/config/site';
import './globals.css';

const tajawal = Tajawal({
  variable: '--font-tajawal',
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const { grouped } = await getPublicSiteSettings();
  const siteName = grouped.brand.site_name || siteConfig.name;
  const siteDescription = grouped.company.site_description || siteConfig.description;
  const logoUrl = grouped.brand.logo || siteConfig.ogImage;
  const defaultTitle = `${siteName} | Quality Fashion`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    icons: {
      icon: logoUrl,
      shortcut: logoUrl,
      apple: logoUrl,
    },
    openGraph: {
      title: defaultTitle,
      description: siteDescription,
      url: siteUrl,
      siteName,
      locale: 'en_US',
      type: 'website',
      images: [{ url: logoUrl, alt: `${siteName} logo` }],
    },
    twitter: {
      card: 'summary',
      title: defaultTitle,
      description: siteDescription,
      images: [logoUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${tajawal.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0d0d0d',
              color: '#f5f5f5',
              border: '1px solid #262626',
            },
          }}
        />
      </body>
    </html>
  );
}
