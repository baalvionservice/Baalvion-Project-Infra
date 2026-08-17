"use client";

import { createContext, useContext } from "react";

/**
 * The real AdSense publisher ID, resolved server-side once in app/layout.tsx
 * via getSiteAdsenseClient() (CMS-managed, Website → SEO → Monetization —
 * see services/data/cms-public.ts) and threaded down through RootLayoutClient.
 *
 * AdSenseUnit previously read process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID
 * directly — a different, never-configured env var name than the one
 * layout.tsx actually resolves (NEXT_PUBLIC_ADSENSE_CLIENT / CMS config).
 * That mismatch meant every <AdSenseUnit> silently rendered null: the
 * adsbygoogle.js loader and site-verification meta tag were live and
 * correct, but not a single <ins class="adsbygoogle"> ad unit ever actually
 * rendered — confirmed on the live site (zero matches for
 * `class="adsbygoogle"` in the served HTML). Real ad requests never fired,
 * which is also the most likely reason Google's "Advertising consent
 * signals" status never activated: there was nothing for Google to observe.
 */
const AdSenseClientContext = createContext<string | null>(null);

export function AdSenseClientProvider({
  clientId,
  children,
}: {
  clientId: string | null;
  children: React.ReactNode;
}) {
  return <AdSenseClientContext.Provider value={clientId}>{children}</AdSenseClientContext.Provider>;
}

export function useAdSenseClientId(): string | null {
  return useContext(AdSenseClientContext);
}
