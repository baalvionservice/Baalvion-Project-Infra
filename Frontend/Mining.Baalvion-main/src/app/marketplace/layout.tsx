import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Mineral Marketplace | Baalvion Mining Inc.",
  description:
    "Browse and source verified bulk minerals — iron ore, lithium, copper, coal, and more. Connect with 5,000+ verified industrial suppliers on Baalvion Mining Inc.",
  alternates: { canonical: "https://mining.baalvion.com/marketplace" },
  openGraph: {
    title: "Global Mineral Marketplace | Baalvion Mining Inc.",
    description:
      "Source bulk minerals from verified global producers. Iron ore, lithium, copper and more — with AI compliance and secure escrow.",
    url: "https://mining.baalvion.com/marketplace",
    siteName: "Baalvion Mining Inc.",
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
