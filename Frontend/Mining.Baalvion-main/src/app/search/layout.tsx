import type { Metadata } from "next";

// Internal search results — crawlable for link discovery but not indexed
// (avoids thin/duplicate result pages competing in the index).
export const metadata: Metadata = {
  title: "Search",
  description:
    "Search the Baalvion Mining Inc. marketplace, supplier directory, and knowledge base for minerals, suppliers, and trade insights.",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
