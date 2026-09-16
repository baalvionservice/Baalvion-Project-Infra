import type { Metadata, Viewport } from "next";
import { RootHtml, sharedMetadata, sharedViewport } from "@/app/_shell/root-html";

export const viewport: Viewport = sharedViewport;
export const metadata: Metadata = sharedMetadata;

/**
 * Root layout for the handful of routes that sit outside a country: `/` (which
 * bounces to /us), the SSO callback, and the 404/error boundaries.
 *
 * These have no country segment to read a locale from, so they get the neutral
 * default. That is not a downgrade — the old shared root layout resolved the
 * locale from a middleware header that is only ever set for storefront paths,
 * so these routes already rendered as en/ltr. What changed is that they no
 * longer drag a dynamic API into every other route's render (see
 * ../[country]/layout.tsx).
 */
export default function EntryRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootHtml lang="en" dir="ltr" welcomeOffer={null}>
      {children}
    </RootHtml>
  );
}
