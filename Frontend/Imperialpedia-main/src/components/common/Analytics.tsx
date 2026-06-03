import Script from "next/script";

/**
 * Analytics & ad scripts, loaded only when their IDs are configured via env.
 *
 * Previously these were hardcoded placeholder IDs (`G-IMP-INDEX-42`,
 * `ca-pub-…`) injected as raw <script> tags inside the App Router <head>.
 * That produced CSP violations on every page (placeholder hosts are blocked)
 * and risked head-hydration mismatches. Gating on env means: no env → nothing
 * renders (clean console); real env → scripts load via next/script in <body>.
 *
 * Enable in production by setting:
 *   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 *   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export function Analytics() {
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
