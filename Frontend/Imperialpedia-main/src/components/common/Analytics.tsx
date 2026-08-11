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
 *
 * Google Consent Mode v2's 'consent default: denied' call also lives in
 * app/layout.tsx's <head> now (not here) -- it must protect the AdSense
 * loader too, which renders unconditionally regardless of GA_ID, so it can't
 * be gated behind GA_ID the way these GA-only scripts are.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function Analytics() {
  if (!GA_ID) return null;
  return (
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
  );
}
