import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verified Supplier Directory | Baalvion Mining Inc.",
  description:
    "Discover and compare Tier 3 KYC-verified mineral suppliers and mining companies worldwide. Browse the Baalvion Mining Inc. supplier directory.",
  alternates: { canonical: "https://mining.baalvion.com/directory" },
  openGraph: {
    title: "Verified Supplier Directory | Baalvion Mining Inc.",
    description:
      "Browse KYC-verified mining companies and mineral suppliers. Sourcing made secure on Baalvion Mining Inc.",
    url: "https://mining.baalvion.com/directory",
    siteName: "Baalvion Mining Inc.",
  },
};

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
