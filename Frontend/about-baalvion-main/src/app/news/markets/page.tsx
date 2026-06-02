import type { Metadata } from "next";
import { NewsCategoryPage } from "@/components/news-category-page";

export const metadata: Metadata = {
  title: "International Markets | Baalvion News",
  description: "Global expansion, international trade routes, and market growth news from Baalvion Industries.",
  alternates: { canonical: "https://about.baalvion.com/news/markets" },
  openGraph: {
    title: "International Markets | Baalvion News",
    description: "Global expansion, international trade routes, and market growth news from Baalvion Industries.",
    url: "https://about.baalvion.com/news/markets",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://picsum.photos/seed/baalvion-news-markets/1200/630", width: 1200, height: 630, alt: "Baalvion International Markets News" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "International Markets | Baalvion News",
    description: "Global expansion, international trade routes, and market growth news from Baalvion Industries.",
    images: ["https://picsum.photos/seed/baalvion-news-markets/1200/630"],
  },
};

export default function MarketsPage() {
  return (
    <NewsCategoryPage
      category="markets"
      title="International Markets"
      categoryLabel="Growth"
      categoryName="Global expansion"
    />
  );
}
