import Script from 'next/script';

/**
 * Privacy-aware, env-gated analytics + webmaster verification for the IR site.
 * Nothing loads unless the corresponding environment variable is set, so local
 * and preview builds stay clean and no third-party script ships without a key.
 *
 *   NEXT_PUBLIC_GA4_ID            Google Analytics 4 measurement ID (G-XXXXXXX)
 *   NEXT_PUBLIC_CLARITY_ID        Microsoft Clarity project ID
 *   NEXT_PUBLIC_GSC_VERIFICATION  Google Search Console meta verification token
 *   NEXT_PUBLIC_BING_VERIFICATION Bing Webmaster Tools (msvalidate.01) token
 *
 * Render <Analytics /> in the root layout <body>. <SearchEngineVerification />
 * returns <meta> tags and is rendered from the layout too (Next hoists meta).
 */

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function Analytics() {
  return (
    <>
      {GA4_ID && (
        <>
          <Script
            id="ga4-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {CLARITY_ID && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      )}
    </>
  );
}
