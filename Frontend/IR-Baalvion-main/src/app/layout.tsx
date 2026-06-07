
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
  icons: { icon: 'data:,' },
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

// Render every route dynamically (no static caching) so content edited in the
// central CMS console (admin-platform → /cms/websites/ir.baalvion.com) and other
// live backends is always reflected on the next request. This route-segment config
// cascades from the root layout to every page under app/.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'FinancialService'],
    '@id': `${AppConfig.baseUrl}/#organization`,
    name: 'Baalvion',
    alternateName: 'Baalvion Industries Pvt Ltd',
    url: AppConfig.baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: 'https://baalvion.com/logo.png',
    },
    description: 'The global operating system for B2B trade infrastructure. Institutional-grade investment and infrastructure management.',
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
    sameAs: [
      'https://www.linkedin.com/company/baalvion',
      'https://twitter.com/baalvion',
    ],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${AppConfig.baseUrl}/#website`,
    url: AppConfig.baseUrl,
    name: 'Baalvion Investor Relations',
    publisher: { '@id': `${AppConfig.baseUrl}/#organization` },
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
          id="structured-data-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Script
          id="structured-data-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
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
