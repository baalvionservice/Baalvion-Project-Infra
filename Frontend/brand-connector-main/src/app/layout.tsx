import type { Metadata, Viewport } from 'next';
import './globals.css';
import { generateMetadata } from '@/lib/seo';

import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = generateMetadata();

export const viewport: Viewport = {
  themeColor: '#6C3AE8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Baalvion Connect',
    url: 'https://baalvion-connect.vercel.app',
    logo: 'https://baalvion-connect.vercel.app/logo.png',
    sameAs: [
      'https://twitter.com/baalvion',
      'https://linkedin.com/company/baalvion',
      'https://instagram.com/baalvion',
    ],
    description: 'The premier marketplace connecting innovative brands with creative talent using AI-powered matching.',
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-2xl focus:shadow-2xl focus:font-bold focus:ring-4 focus:ring-primary/20"
        >
          Skip to content
        </a>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
