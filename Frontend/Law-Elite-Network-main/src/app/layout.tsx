
import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/i18n/I18nProvider';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/navbar';
import NotificationToastListener from '@/components/notifications/NotificationToastListener';
import { AIChatAssistantWrapper } from '@/components/ai/AIChatAssistantWrapper';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Suppress any favicon (no icon logo in the browser tab). `data:,` is an empty
  // resource, so the browser renders no icon and stops requesting /favicon.ico.
  icons: { icon: 'data:,' },
  title: {
    default: 'Law Elite Network | Global Legal Intelligence',
    template: '%s | Law Elite Network',
  },
  description:
    "The world's most distinguished legal knowledge and practitioner discovery platform. Find expert lawyers, manage cases, and access legal intelligence.",
  keywords: [
    'legal intelligence',
    'lawyer search',
    'legal consultation',
    'law firm directory',
    'legal advice',
    'attorney finder',
    'case management',
    'Law Elite Network',
  ],
  authors: [{ name: 'Law Elite Network', url: SITE_URL }],
  creator: 'Law Elite Network',
  publisher: 'Baalvion',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Law Elite Network',
    title: 'Law Elite Network | Global Legal Intelligence',
    description:
      "The world's most distinguished legal knowledge and practitioner discovery platform.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Law Elite Network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lawelitenetwork',
    creator: '@lawelitenetwork',
    title: 'Law Elite Network | Global Legal Intelligence',
    description:
      "The world's most distinguished legal knowledge and practitioner discovery platform.",
    images: [`${SITE_URL}/og-image.png`],
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
  alternates: {
    canonical: SITE_URL,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: 'Law Elite Network',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "The world's most distinguished legal knowledge and practitioner discovery platform.",
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: `${SITE_URL}/contact-us`,
  },
  sameAs: ['https://twitter.com/lawelitenetwork'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#1e3a5f" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="font-body antialiased selection:bg-blue-100 selection:text-blue-900 bg-white text-slate-900 overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-blue-700 focus:text-white focus:rounded-xl focus:font-bold focus:shadow-2xl"
        >
          Skip to main content
        </a>

        <AuthProvider>
          <I18nProvider>
            <div className="flex flex-col min-h-screen relative">
              <Navbar />

              <main id="main-content" className="flex-1">
                {children}
              </main>

              <Suspense fallback={null}>
                <AIChatAssistantWrapper />
              </Suspense>

              <NotificationToastListener />
              <ImpersonationBanner />
            </div>
            <Toaster />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
