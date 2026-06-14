import type { Metadata } from "next";

// Guide detail. The page itself ('use client') renders TechArticle JSON-LD per
// guide; this server layout supplies indexable, templated metadata.
export const metadata: Metadata = {
  title: "Trade Guide",
  description:
    "In-depth mineral trade, compliance, and logistics guides from Baalvion Mining Inc. — practical guidance for exporters and industrial buyers.",
  openGraph: {
    title: "Trade Guide",
    description:
      "Practical mineral trade and compliance guidance from Baalvion Mining Inc.",
    siteName: "Baalvion Mining Inc.",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function GuideDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
