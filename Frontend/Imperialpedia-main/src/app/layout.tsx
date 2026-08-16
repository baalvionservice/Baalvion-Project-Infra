import React from "react";
import "./globals.css";
import { Metadata } from "next";
import { env } from "@/config/env";
import { Source_Serif_4 } from "next/font/google";
import { cn } from "@/lib/utils";
import RootLayoutClient from "@/components/common/RootLayoutClient";
import { Analytics } from "@/components/common/Analytics";
import UnifiedAnalytics from "@/components/common/UnifiedAnalytics";
import {
  GoogleTagManagerScript,
  GoogleTagManagerNoScript,
} from "@/components/common/GoogleTagManager";
import { getSiteAdsenseClient } from "@/services/data/cms-public";
import { structuredData } from "@/lib/seo/structuredData";

const CMS_SLUG =
  process.env.NEXT_PUBLIC_CMS_SITE_SLUG || "imperialpedia";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),

  icons: {
    icon: [
      { url: "/brand/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/brand/apple-icon.png",
  },

  title: {
    default: "Imperialpedia — The Financial Intelligence Network",
    template: "%s | Imperialpedia",
  },

  description:
    'Imperialpedia is a financial intelligence and reference platform: an encyclopedic knowledge graph of companies, countries, industries, and technologies alongside live market data and editorially reviewed articles.',
  keywords: [
    "financial intelligence",
    "market analysis",
    "investment research",
    "stock market",
    "economic indicators",
    "financial glossary",
    "investing",
    "personal finance",
    "Imperialpedia",
  ],

  authors: [
    {
      name: "Allen Krewzz",
      url: `${env.siteUrl}/authors/allen-krewzz`,
    },
    {
      name: "Tamanna Shaikh",
      url: `${env.siteUrl}/authors/tamanna-shaikh`,
    },
    {
      name: "Deepak Kuldeep",
      url: `${env.siteUrl}/authors/deepak-kuldeep`,
    },
  ],

  creator: "Imperialpedia",
  publisher: "Baalvion",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: env.siteUrl,
    siteName: "Imperialpedia",
    title: "Imperialpedia — The Financial Intelligence Network",
    description:
      'An encyclopedic knowledge graph of companies, countries, industries, and technologies, alongside live market data and editorially reviewed articles.',
    images: [
      {
        url: `${env.siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Imperialpedia — Financial Intelligence",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@imperialpedia",
    creator: "@imperialpedia",
    title: "Imperialpedia — The Financial Intelligence Network",
    description:
      'An encyclopedic knowledge graph of companies, countries, industries, and technologies, alongside live market data and editorially reviewed articles.',
    images: [`${env.siteUrl}/og-image.png`],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: env.siteUrl,
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

// Client-side layout content is now in RootLayoutClient

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
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // AdSense publisher ID is managed in the CMS admin panel
  // (Website → SEO → Monetization).
  //
  // The ID is resolved server-side and cached by getSiteAdsenseClient().
  // This keeps the AdSense configuration out of client-side JavaScript.
  const adsenseClient = await getSiteAdsenseClient();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(sourceSerif.variable)}
    >
      <head>
        {/* Google Consent Mode v2 -- must run BEFORE the GTM/GA loaders and the
            AdSense loader below, so no GA/ads cookie is set for a visitor who
            hasn't chosen yet. CookieConsentBanner updates this to 'granted' on
            accept; until then every visitor (EEA or not) defaults to denied,
            satisfying Google's EU User Consent Policy for AdSense/Analytics.
            This must be a literal <script> tag, not next/script's <Script>
            component -- per the same reasoning as the AdSense script below,
            next/script (any strategy, including beforeInteractive) doesn't
            emit a literal synchronously-executing tag in place; it registers
            the code in a self.__next_s.push([...]) bootstrap array that can
            run after later async scripts have already fetched and executed.
            Previously this lived in Analytics.tsx gated on NEXT_PUBLIC_GA_ID
            (and rendered as a next/script Script in <body>), so a visitor got
            zero consent-default protection whenever GA_ID was unset, and even
            when set, it landed after the AdSense/GA loaders in practice. */}
        <script
          id="consent-default"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                wait_for_update: 500,
              });
            `,
          }}
        />
        <GoogleTagManagerScript />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <meta name="theme-color" content="#ffffff" />

        {adsenseClient && (
          <>
            <meta name="google-adsense-account" content={adsenseClient} />
            {/* AdSense's site-verification check regex-matches the raw HTML for a
                literal <script async src="...adsbygoogle.js...crossorigin...">
                tag. next/script's <Script> component -- for every strategy,
                including beforeInteractive -- never emits that literal tag; it
                registers the URL in a self.__next_s.push([...]) bootstrap array
                instead, so the crawler never finds a match. A plain native
                <script> element (same as the ld+json tag below) renders as
                literal HTML text, which is what the crawler is regex-matching. */}
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
              crossOrigin="anonymous"
            />
          </>
        )}
      </head>

      <body className="font-ui bg-background text-foreground antialiased min-h-screen flex flex-col">
        <GoogleTagManagerNoScript />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData.organization()),
          }}
        />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-xl focus:font-bold focus:shadow-2xl transition-all"
        >
          Skip to main content
        </a>

        <RootLayoutClient>
          {children}
        </RootLayoutClient>

        <Analytics />

        <UnifiedAnalytics slug={CMS_SLUG} />
      </body>
    </html>
  );
}