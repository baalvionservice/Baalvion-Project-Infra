import React from "react";
import "./globals.css";
import { Metadata } from "next";
import { env } from "@/config/env";
import { Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
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

const corinthian = localFont({
  src: "../fonts/Corinthian-Medium.ttf",
  variable: "--font-corinthian",
  display: "swap",
});

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
      className={cn(sourceSerif.variable, corinthian.variable)}
    >
      <head>
        {/* Google Consent Mode v2 -- must run BEFORE any ad/analytics script, so no
            GA/ads cookie is set for a visitor who hasn't chosen yet. CookieConsentBanner
            updates this to 'granted' on accept; until then every visitor (EEA or not)
            defaults to denied, satisfying Google's EU User Consent Policy.
            This must be a literal <script> tag, not next/script's <Script> component --
            next/script (any strategy, including beforeInteractive) doesn't emit a
            literal synchronously-executing tag in place; it registers the code in a
            self.__next_s.push([...]) bootstrap array that can run after later scripts
            have already fetched and executed.

            IMPORTANT: positioning this script earlier than other <head> children does
            NOT guarantee it runs first. React 19 hoists any <script async src="...">
            (and every <meta>/<link>) to <head> ahead of ordinary content regardless of
            JSX order -- confirmed live: this script was rendering dead last in the
            actual HTML despite being first in the JSX, because the AdSense loader
            below (async+src) and the meta/icon tags around it all get pulled into that
            hoisted batch first. And even fixing position wouldn't be a hard guarantee:
            `+ "`async`" + ` scripts have no cross-script execution-order guarantee at
            all -- that's what async means, in any browser, React or not.
            So instead of racing the AdSense loader against this script, this script
            NOW creates the AdSense loader itself (see below) -- same-script sequencing
            instead of a document-order bet.

            suppressHydrationWarning: AdSense's own adsbygoogle.js injects a
            managed show_ads_impl script into <head> as soon as it loads,
            which on a fast connection can land before React hydrates and
            shifts this node's position -- React then diffs this script
            against AdSense's injected one and logs a "tree hydrated but
            didn't match" error. The script's own content already ran
            correctly from the raw SSR HTML by the time hydration happens
            (hydration doesn't re-execute it), so the warning is cosmetic;
            confirmed the exact AdSense-injected node via a headless-browser
            console-error sweep. */}
        <script
          id="consent-default"
          suppressHydrationWarning
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
        {/* Google's AdSense "code snippet" site-verification method does a raw-HTML
            fetch looking for this exact literal tag -- it does not execute the page's
            JS, so the previous document.createElement-based loader (which satisfied
            the *consent-ordering* requirement above but never appears in server-
            rendered HTML) failed that check with "Couldn't verify your site". `defer`
            (not Google's own `async`) is what makes both requirements satisfiable by
            one tag: unlike async, defer is NOT part of React 19's async+src hoisting
            (see the removed comment above this used to carry) -- a deferred script
            keeps its authored document position and, per the HTML spec, always
            executes after every earlier synchronous script has already run, so this
            still loads strictly after the consent-default script above sets denied
            defaults. Confirm this ordering with a live view-source check after any
            future edit near here, the same way the original bug was found. */}
        {adsenseClient && (
          <script
            defer
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
        {adsenseClient && (
          <meta name="google-adsense-account" content={adsenseClient} />
        )}

        <GoogleTagManagerScript />

        {/* Google "Preferred Sources" widget loader (Top Stories / AI Overviews /
            AI Mode "add as preferred source" button) -- a plain native <script>
            tag, same reasoning as the AdSense loader above: next/script's
            <Script> component never emits a literal synchronously-parsed tag,
            it registers the URL in a bootstrap array instead, which is exactly
            the pattern already ruled out here for the AdSense verification
            script. See PreferredSourceButton for where the matching
            [google-add-preferred-source-btn] element renders. */}
        <script async src="https://news.google.com/swg/js/v1/publisher.js" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <meta name="theme-color" content="#ffffff" />
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

        <RootLayoutClient adsenseClient={adsenseClient}>
          {children}
        </RootLayoutClient>

        <Analytics />

        <UnifiedAnalytics slug={CMS_SLUG} />
      </body>
    </html>
  );
}