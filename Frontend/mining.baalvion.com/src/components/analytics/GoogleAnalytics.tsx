
"use client"

import Script from 'next/script';

/**
 * @fileOverview Google Analytics 4 Tracking Component.
 * Optimized for Next.js to load without blocking the main thread by using lazyOnload.
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Do not load gtag unless a real measurement ID is configured. This prevents
  // requests to an invalid property (the previous placeholder 'G-XXXXXXXXXX')
  // and avoids loading analytics scripts that have no destination.
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    return null;
  }

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
