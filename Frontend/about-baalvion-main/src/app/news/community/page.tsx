import type { Metadata } from "next";
import { NewsCategoryPage } from "@/components/news-category-page";

export const metadata: Metadata = {
  title: "Community & Partnerships | Baalvion News",
  description: "Collaborations, ecosystem partnerships, and network updates from Baalvion Industries.",
  alternates: { canonical: "https://about.baalvion.com/news/community" },
  openGraph: {
    title: "Community & Partnerships | Baalvion News",
    description: "Collaborations, ecosystem partnerships, and network updates from Baalvion Industries.",
    url: "https://about.baalvion.com/news/community",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://about.baalvion.com/api/og?title=Baalvion+Community+%26+Partnerships+News&eyebrow=Baalvion+News", width: 1200, height: 630, alt: "Baalvion Community & Partnerships News" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community & Partnerships | Baalvion News",
    description: "Collaborations, ecosystem partnerships, and network updates from Baalvion Industries.",
    images: ["https://about.baalvion.com/api/og?title=Baalvion+Community+%26+Partnerships+News&eyebrow=Baalvion+News"],
  },
};

export default function CommunityPage() {
  return (
    <NewsCategoryPage
      category="community"
      title="Community & Partnerships"
      categoryLabel="Ecosystem"
      categoryName="Nexus"
    />
  );
}
