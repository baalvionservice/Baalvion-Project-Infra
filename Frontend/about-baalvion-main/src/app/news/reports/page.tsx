import type { Metadata } from "next";
import { NewsCategoryPage } from "@/components/news-category-page";

export const metadata: Metadata = {
  title: "Featured Reports | Baalvion News",
  description: "Strategic reports, metrics, and in-depth analysis on global trade infrastructure from Baalvion Industries.",
  alternates: { canonical: "https://about.baalvion.com/news/reports" },
  openGraph: {
    title: "Featured Reports | Baalvion News",
    description: "Strategic reports, metrics, and in-depth analysis on global trade infrastructure from Baalvion Industries.",
    url: "https://about.baalvion.com/news/reports",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://about.baalvion.com/api/og?title=Baalvion+Featured+Reports&eyebrow=Baalvion+News", width: 1200, height: 630, alt: "Baalvion Featured Reports" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Featured Reports | Baalvion News",
    description: "Strategic reports, metrics, and in-depth analysis on global trade infrastructure from Baalvion Industries.",
    images: ["https://about.baalvion.com/api/og?title=Baalvion+Featured+Reports&eyebrow=Baalvion+News"],
  },
};

export default function ReportsPage() {
  return (
    <NewsCategoryPage
      category="reports"
      title="Featured Reports"
      categoryLabel="Metrics"
      categoryName="Strategic"
    />
  );
}
