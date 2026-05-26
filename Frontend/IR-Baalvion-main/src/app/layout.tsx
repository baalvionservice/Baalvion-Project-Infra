
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import QuickLinksSection from '@/components/sections/quick-links-section';
import Script from 'next/script';
import { AppConfig } from '@/config';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const viewport: Viewport = {
  themeColor: '#18181b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: 'Baalvion | Institutional Investor Relations',
    template: '%s | Baalvion',
  },
  description: 'The global operating system for B2B trade infrastructure. Access performance reports, board resolutions, and strategic materials.',
  metadataBase: new URL(AppConfig.baseUrl),
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: 'Baalvion Investor Relations',
    description: 'Engineering the backbone of global trade.',
    url: AppConfig.baseUrl,
    siteName: 'Baalvion',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://baalvion.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Baalvion Investor Relations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Baalvion Investor Relations',
    description: 'Engineering the backbone of global trade.',
    creator: '@baalvion',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Baalvion Investor Relations',
    url: AppConfig.baseUrl,
    logo: 'https://baalvion.com/logo.png',
    description: 'Institutional-grade investment and infrastructure management.',
    parentOrganization: {
      '@type': 'Organization',
      name: 'Baalvion Group',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Yeshwant Avenue Building, NX',
      addressLocality: 'Virar',
      addressRegion: 'Maharashtra',
      postalCode: '401303',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-8951284770',
      contactType: 'Investor Relations',
      email: 'invrel@baalvion.com',
    },
  };

  return (
    <html lang="en" className={cn('dark', inter.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-body antialiased selection:bg-primary/30" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-xl focus:outline-none"
        >
          Skip to main content
        </a>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <div id="main-content" className="flex min-h-screen  flex-col" role="main">
          {children}
        </div>
        <QuickLinksSection />
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
