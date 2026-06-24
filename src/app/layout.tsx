import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const tajawal = Tajawal({
  variable: '--font-tajawal',
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
});

const siteName = 'Bison Denim';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Quality Fashion`,
    template: `%s | ${siteName}`,
  },
  description: 'Quality denim, shirts, hoodies, and fashion essentials for Indonesia.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: `${siteName} | Quality Fashion`,
    description: 'Quality denim, shirts, hoodies, and fashion essentials for Indonesia.',
    url: siteUrl,
    siteName,
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/icon.png', alt: siteName }],
  },
  twitter: {
    card: 'summary',
    title: `${siteName} | Quality Fashion`,
    description: 'Quality denim, shirts, hoodies, and fashion essentials for Indonesia.',
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
