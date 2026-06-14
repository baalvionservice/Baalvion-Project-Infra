import type { Metadata } from "next";

// Marketplace listing detail. The page itself ('use client') renders Product
// JSON-LD per item; this server layout supplies indexable, templated metadata.
export const metadata: Metadata = {
  title: "Mineral Listing",
  description:
    "View verified mineral listing details on Baalvion Mining Inc. — specifications, supplier credentials, and secure trade options.",
  openGraph: {
    title: "Mineral Listing",
    description:
      "Verified mineral listing on the Baalvion Mining Inc. global marketplace.",
    siteName: "Baalvion Mining Inc.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function MarketplaceProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
