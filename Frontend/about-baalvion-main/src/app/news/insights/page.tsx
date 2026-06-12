import type { Metadata } from "next";
import { NewsCategoryPage } from "@/components/news-category-page";

export const metadata: Metadata = {
  title: "Global Trade Insights | Baalvion News",
  description: "Research, industry trends, and global trade intelligence from the Baalvion Operating System (BOS) team.",
  alternates: { canonical: "https://about.baalvion.com/news/insights" },
  openGraph: {
    title: "Global Trade Insights | Baalvion News",
    description: "Research, industry trends, and global trade intelligence from the Baalvion Operating System (BOS) team.",
    url: "https://about.baalvion.com/news/insights",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://about.baalvion.com/api/og?title=Baalvion+Global+Trade+Insights&eyebrow=Baalvion+News", width: 1200, height: 630, alt: "Baalvion Global Trade Insights" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Trade Insights | Baalvion News",
    description: "Research, industry trends, and global trade intelligence from the Baalvion Operating System (BOS) team.",
    images: ["https://about.baalvion.com/api/og?title=Baalvion+Global+Trade+Insights&eyebrow=Baalvion+News"],
  },
};

export default function InsightsPage() {
  return (
    <NewsCategoryPage
      category="insights"
      title="Global Trade Insights"
      categoryLabel="Intelligence"
      categoryName="Insights"
    />
  );
}
