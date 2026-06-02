import type { Metadata } from "next";
import { NewsCategoryPage } from "@/components/news-category-page";

export const metadata: Metadata = {
  title: "Featured Reports | Baalvion News",
  description: "Major project highlights and strategic reports from the Baalvion Operating System (BOS).",
  alternates: { canonical: "https://about.baalvion.com/news/reports" },
  openGraph: {
    title: "Featured Reports | Baalvion News",
    description: "Major project highlights and strategic reports from the Baalvion Operating System (BOS).",
    url: "https://about.baalvion.com/news/reports",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://picsum.photos/seed/baalvion-news-reports/1200/630", width: 1200, height: 630, alt: "Baalvion Featured Reports" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Featured Reports | Baalvion News",
    description: "Major project highlights and strategic reports from the Baalvion Operating System (BOS).",
    images: ["https://picsum.photos/seed/baalvion-news-reports/1200/630"],
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
