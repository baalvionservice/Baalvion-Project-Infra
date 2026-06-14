import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search | Baalvion News",
  description: "Search strategic intelligence, news, and projects across the Baalvion Nexus.",
  alternates: { canonical: "https://about.baalvion.com/news/search" },
  // Search-results pages are thin/duplicate content — keep them out of the index
  // while still allowing crawlers to follow links to canonical content.
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
