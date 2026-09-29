import type { Metadata } from "next";
import { NewsCategoryPage } from "@/components/news-category-page";

export const metadata: Metadata = {
  title: "Finance & Compliance | Baalvion News",
  description: "Trade finance, regulatory compliance news, and capital markets intelligence from Baalvion Industries.",
  alternates: { canonical: "https://about.baalvion.com/news/finance" },
  openGraph: {
    title: "Finance & Compliance | Baalvion News",
    description: "Trade finance, regulatory compliance news, and capital markets intelligence from Baalvion Industries.",
    url: "https://about.baalvion.com/news/finance",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://about.baalvion.com/api/og?title=Baalvion+Finance+%26+Compliance+News&eyebrow=Baalvion+News", width: 1200, height: 630, alt: "Baalvion Finance & Compliance News" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance & Compliance | Baalvion News",
    description: "Trade finance, regulatory compliance news, and capital markets intelligence from Baalvion Industries.",
    images: ["https://about.baalvion.com/api/og?title=Baalvion+Finance+%26+Compliance+News&eyebrow=Baalvion+News"],
  },
};

export default function FinancePage() {
  return (
    <NewsCategoryPage
      category="finance"
      title="Finance & Compliance"
      categoryLabel="Capital"
      categoryName="Markets"
    />
  );
}
