import Script from "next/script";

/**
 * Google tag (gtag.js), gated on NEXT_PUBLIC_GA_ID (no ID → nothing renders).
 * Rendered once from the root layout (src/app/layout.tsx) so every page gets
 * exactly one Google tag.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
