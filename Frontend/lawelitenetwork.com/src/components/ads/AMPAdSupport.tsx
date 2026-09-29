/**
 * AMP (Accelerated Mobile Pages) AdSense support
 * Provides utilities for serving AMP-compliant ad units on mobile
 */

const ADSENSE_CLIENT_ID = 'ca-pub-8968452296456450';
const DEFAULT_SLOT_ID = '4123514154';

export interface AMPAdConfig {
  slotId?: string;
  width?: number;
  height?: number;
  layout?: 'responsive' | 'fixed' | 'fixed-height' | 'intrinsic' | 'fill';
  autoFormat?: 'rspv' | 'adpushup';
  responsive?: boolean;
}

/**
 * Generate AMP-compliant ad unit HTML
 *
 * @example
 * ```tsx
 * const ampHtml = generateAMPAdCode({
 *   slotId: '4123514154',
 *   width: 300,
 *   height: 250,
 * });
 * ```
 */
export function generateAMPAdCode(config: AMPAdConfig = {}): string {
  const {
    slotId = DEFAULT_SLOT_ID,
    width = 100,
    height = 320,
    layout = 'responsive',
    autoFormat = 'rspv',
    responsive = true,
  } = config;

  return `<amp-ad width="${width}" height="${height}"
     type="adsense"
     data-ad-client="${ADSENSE_CLIENT_ID}"
     data-ad-slot="${slotId}"
     ${autoFormat ? `data-auto-format="${autoFormat}"` : ''}
     ${responsive ? 'data-full-width=""' : ''}
     layout="${layout}">
  <div overflow=""></div>
</amp-ad>`;
}

/**
 * AMP-specific analytics for ad impressions
 * Use in AMP pages to track ad performance
 *
 * @example
 * ```tsx
 * <amp-analytics type="gtag" data-credentials="include">
 *   <script type="application/json">
 *     {JSON.stringify(getAMPAnalyticsConfig())}
 *   </script>
 * </amp-analytics>
 * ```
 */
export function getAMPAnalyticsConfig() {
  return {
    vars: {
      gtag_id: 'G-YOUR_GA_ID', // Replace with actual ID
      config: {
        'G-YOUR_GA_ID': {
          groups: 'default',
        },
      },
    },
    triggers: {
      adImpression: {
        on: 'render-start',
        request: 'pageview',
        visibilitySpec: {
          selector: 'amp-ad',
          visiblePercentageMin: 50,
          totalTimeMin: 1000,
        },
      },
    },
  };
}

/**
 * React component wrapper for AMP ad units (Server-side rendering only)
 * Use this in layouts that support AMP versions
 */
export function AMPAdSupport({
  isAMP,
  config,
}: {
  isAMP: boolean;
  config?: AMPAdConfig;
}) {
  if (!isAMP) return null;

  const ampCode = generateAMPAdCode(config);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: ampCode }}
      suppressHydrationWarning
    />
  );
}

/**
 * AMP HTML template for serving AMP versions
 * Use this when serving HTML directly from server
 *
 * @example
 * ```
 * const ampPage = getAMPHtmlTemplate({
 *   title: 'Article Title',
 *   content: '<p>Article content</p>',
 *   adSlots: ['4123514154'],
 * });
 * ```
 */
export function getAMPHtmlTemplate(options: {
  title: string;
  content: string;
  adSlots: string[];
  canonicalUrl: string;
}): string {
  const { title, content, adSlots, canonicalUrl } = options;

  const adUnits = adSlots
    .map((slot) =>
      generateAMPAdCode({
        slotId: slot,
        width: 100,
        height: 320,
        layout: 'responsive',
      })
    )
    .join('\n');

  return `<!DOCTYPE html>
<html ⚡ lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <title>${title}</title>
    <link rel="canonical" href="${canonicalUrl}">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:100,100italic,300,300italic,400,400italic,500,500italic,700,700italic,900,900italic">
    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 both;animation:-amp-start 8s steps(1,end) 0s 1 both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
    <noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-ad" src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"></script>
    <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
</head>
<body>
    <article>
        <h1>${title}</h1>
        ${content}
        ${adUnits}
    </article>
</body>
</html>`;
}

/**
 * Check if current request is for AMP version
 * @internal
 */
export function isAMPRequest(pathname: string): boolean {
  return pathname.includes('/amp/') || pathname.endsWith('.amp');
}
