import type { Metadata } from "next";
import { NewsCategoryPage } from "@/components/news-category-page";

export const metadata: Metadata = {
  title: "Company News | Baalvion Updates",
  description: "Press releases, official announcements, and company updates from Baalvion Industries.",
  alternates: { canonical: "https://about.baalvion.com/news/updates" },
  openGraph: {
    title: "Company News | Baalvion Updates",
    description: "Press releases, official announcements, and company updates from Baalvion Industries.",
    url: "https://about.baalvion.com/news/updates",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://about.baalvion.com/api/og?title=Baalvion+Company+News&eyebrow=Baalvion+News", width: 1200, height: 630, alt: "Baalvion Company News" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Company News | Baalvion Updates",
    description: "Press releases, official announcements, and company updates from Baalvion Industries.",
    images: ["https://about.baalvion.com/api/og?title=Baalvion+Company+News&eyebrow=Baalvion+News"],
  },
};

export default function UpdatesPage() {
  return (
    <NewsCategoryPage
      category="updates"
      title="Company News"
      categoryLabel="Updates"
      categoryName="Company news"
    />
  );
}
