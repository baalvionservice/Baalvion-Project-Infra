import type { Metadata } from "next";
import { NewsCategoryPage } from "@/components/news-category-page";

export const metadata: Metadata = {
  title: "Technology & AI | Baalvion News",
  description: "Platform updates, AI scoring advancements, and technology innovation news from Baalvion Industries.",
  alternates: { canonical: "https://about.baalvion.com/news/tech" },
  openGraph: {
    title: "Technology & AI | Baalvion News",
    description: "Platform updates, AI scoring advancements, and technology innovation news from Baalvion Industries.",
    url: "https://about.baalvion.com/news/tech",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://about.baalvion.com/api/og?title=Baalvion+Technology+%26+AI+News&eyebrow=Baalvion+News", width: 1200, height: 630, alt: "Baalvion Technology & AI News" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Technology & AI | Baalvion News",
    description: "Platform updates, AI scoring advancements, and technology innovation news from Baalvion Industries.",
    images: ["https://about.baalvion.com/api/og?title=Baalvion+Technology+%26+AI+News&eyebrow=Baalvion+News"],
  },
};

export default function TechPage() {
  return (
    <NewsCategoryPage
      category="tech"
      title="Technology & AI"
      categoryLabel="Innovation"
      categoryName="Innovation"
    />
  );
}
