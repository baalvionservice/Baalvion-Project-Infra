import Script from "next/script";

/**
 * Analytics scripts, loaded only when NEXT_PUBLIC_GA_ID is configured.
 *
 * Previously these were hardcoded placeholder IDs (`G-IMP-INDEX-42`,
 * `ca-pub-…`) injected as raw <script> tags inside the App Router <head>.
 * That produced CSP violations on every page (placeholder hosts are blocked)
 * and risked head-hydration mismatches. Gating on a real ID means: no ID →
 * nothing renders (clean console); real ID → scripts load via next/script.
 *
 * The AdSense loader script now lives directly in app/layout.tsx's <head> --
 * see AdsenseScript there -- not here, per Google's site-verification
 * requirement that the code sit "between the <head> and </head> tags."
 * GA stays on env: NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function Analytics() {
  return (
    <>
      {GA_ID ? (
        <>
          {/* Google Consent Mode v2 -- must be pushed to dataLayer BEFORE gtag('js', ...)
              and gtag('config', ...) run, so GA/ads never set cookies for a visitor who
              hasn't accepted. CookieConsentBanner updates these to 'granted' on accept;
              until then every visitor (EEA or not) defaults to denied, satisfying Google's
              EU User Consent Policy requirement for AdSense/Analytics. */}
          <Script id="consent-default" strategy="beforeInteractive">
            {`
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
            `}
          </Script>
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
    </>
  );
}
