import type { Metadata } from "next";
import { NewsCategoryPage } from "@/components/news-category-page";

export const metadata: Metadata = {
  title: "Sustainability & ESG | Baalvion News",
  description: "Green initiatives, ESG reports, and sustainability governance news from Baalvion Industries.",
  alternates: { canonical: "https://about.baalvion.com/news/sustainability" },
  openGraph: {
    title: "Sustainability & ESG | Baalvion News",
    description: "Green initiatives, ESG reports, and sustainability governance news from Baalvion Industries.",
    url: "https://about.baalvion.com/news/sustainability",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://picsum.photos/seed/baalvion-news-sustainability/1200/630", width: 1200, height: 630, alt: "Baalvion Sustainability & ESG News" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sustainability & ESG | Baalvion News",
    description: "Green initiatives, ESG reports, and sustainability governance news from Baalvion Industries.",
    images: ["https://picsum.photos/seed/baalvion-news-sustainability/1200/630"],
  },
};

export default function SustainabilityPage() {
  return (
    <NewsCategoryPage
      category="sustainability"
      title="Sustainability & ESG"
      categoryLabel="Impact"
      categoryName="Governance"
    />
  );
}
