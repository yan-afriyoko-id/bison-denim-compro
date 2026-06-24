import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
});

const siteName = 'Bison Denim';

export const metadata: Metadata = {
  title: {
    default: `${siteName} — Fashion Berkualitas`,
    template: `%s | ${siteName}`,
  },
  description: 'Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas untuk Indonesia.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: `${siteName} — Fashion Berkualitas`,
    description: 'Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas untuk Indonesia.',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    siteName,
    locale: 'id',
    type: 'website',
    images: [{ url: '/icon.png', alt: siteName }],
  },
  twitter: {
    card: 'summary',
    title: `${siteName} — Fashion Berkualitas`,
    description: 'Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas untuk Indonesia.',
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
    <html
      lang="id"
      className={`${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
