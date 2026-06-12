import React from "react";
import "./globals.css";
import { Metadata } from "next";
import { env } from "@/config/env";
import { Source_Serif_4 } from "next/font/google";
import { cn } from "@/lib/utils";
import RootLayoutClient from "@/components/common/RootLayoutClient";
import { Analytics } from "@/components/common/Analytics";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  icons: { icon: 'data:,' },
  title: {
    default: 'Imperialpedia — The Financial Intelligence Network',
    template: '%s | Imperialpedia',
  },
  description:
    'Imperialpedia is the definitive financial intelligence platform. Expert analysis, live market data, AI-driven insights, and a global community of investors and analysts.',
  keywords: [
    'financial intelligence',
    'market analysis',
    'investment research',
    'stock market',
    'AI analyst',
    'economic indicators',
    'financial glossary',
    'investing',
    'personal finance',
    'Imperialpedia',
  ],
  authors: [{ name: 'Imperialpedia Editorial Team', url: env.siteUrl }],
  creator: 'Imperialpedia',
  publisher: 'Baalvion',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: env.siteUrl,
    siteName: 'Imperialpedia',
    title: 'Imperialpedia — The Financial Intelligence Network',
    description:
      'Expert financial analysis, live market data, AI-driven insights, and a global investor community.',
    images: [
      {
        url: `${env.siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Imperialpedia — Financial Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@imperialpedia',
    creator: '@imperialpedia',
    title: 'Imperialpedia — The Financial Intelligence Network',
    description:
      'Expert financial analysis, live market data, AI-driven insights, and a global investor community.',
    images: [`${env.siteUrl}/og-image.png`],
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
    canonical: env.siteUrl,
  },
};

// (Client-side layout content is now in RootLayoutClient)

// Investopedia-style typography: a readable transitional serif for editorial
// headlines, paired with a neutral Helvetica/Arial system sans for body + UI
// (the body/UI stack lives in globals.css + tailwind.config — no webfont needed,
// matching Investopedia's native Helvetica Neue / Arial rendering).
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-headline",
  display: "swap",
});

/**
 * Root Layout for Imperialpedia.
 * Optimized for institutional performance and accessibility.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(sourceSerif.variable)}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#ffffff" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>

      <body className="font-ui bg-background text-foreground antialiased min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Imperialpedia',
              url: env.siteUrl,
              logo: `${env.siteUrl}/logo.png`,
              description:
                'The definitive financial intelligence platform offering expert analysis, live market data, and AI-driven insights.',
              contactPoint: {
                '@type': 'ContactPoint',
                email: env.supportEmail,
                contactType: 'customer support',
              },
              sameAs: ['https://twitter.com/imperialpedia'],
            }),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-xl focus:font-bold focus:shadow-2xl transition-all"
        >
          Skip to main content
        </a>

        <RootLayoutClient>{children}</RootLayoutClient>
        <Analytics />
      </body>
    </html>
  );
}
