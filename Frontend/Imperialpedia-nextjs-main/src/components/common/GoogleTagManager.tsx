import Script from "next/script";

/**
 * Google Tag Manager container, gated on NEXT_PUBLIC_GTM_ID (no ID → nothing
 * renders). Two parts per Google's install instructions:
 *  - GoogleTagManagerScript: head snippet, loaded via `beforeInteractive` so
 *    Next.js hoists it as high in <head> as possible, ahead of hydration.
 *  - GoogleTagManagerNoScript: <body> fallback iframe for no-JS clients.
 * Rendered once from the root layout (src/app/layout.tsx) so every page gets
 * exactly one GTM container.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GoogleTagManagerScript() {
  if (!GTM_ID) return null;
  return (
    <Script id="gtm-init" strategy="beforeInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
