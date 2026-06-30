import Script from "next/script";

/**
 * Analytics & ad scripts, loaded only when their IDs are configured.
 *
 * Previously these were hardcoded placeholder IDs (`G-IMP-INDEX-42`,
 * `ca-pub-…`) injected as raw <script> tags inside the App Router <head>.
 * That produced CSP violations on every page (placeholder hosts are blocked)
 * and risked head-hydration mismatches. Gating on a real ID means: no ID →
 * nothing renders (clean console); real ID → scripts load via next/script.
 *
 * The AdSense client is resolved server-side from the CMS admin panel
 * (Website → SEO → Monetization, via getSiteAdsenseClient) and passed in as
 * `adsenseClient`; that resolver falls back to NEXT_PUBLIC_ADSENSE_CLIENT.
 * GA stays on env: NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

interface AnalyticsProps {
  /** Resolved AdSense publisher ID ("ca-pub-…"), or null/undefined to disable ads. */
  adsenseClient?: string | null;
}

export function Analytics({ adsenseClient }: AnalyticsProps) {
  const ADSENSE_CLIENT = adsenseClient;
  return (
    <>
      {GA_ID ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      ) : null}

      {ADSENSE_CLIENT ? (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
