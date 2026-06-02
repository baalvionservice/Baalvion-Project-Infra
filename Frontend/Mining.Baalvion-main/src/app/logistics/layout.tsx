import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Logistics Network | Baalvion Mining Inc.",
  description:
    "Real-time vessel and fleet tracking for cross-border bulk mineral shipments. Sea, rail, and land freight solutions for industrial mineral exporters.",
  alternates: { canonical: "https://mining.baalvion.com/logistics" },
  openGraph: {
    title: "Global Logistics Network | Baalvion Mining Inc.",
    description:
      "Integrated logistics for bulk mineral shipments — real-time tracking across sea, rail, and land for verified exporters.",
    url: "https://mining.baalvion.com/logistics",
    siteName: "Baalvion Mining Inc.",
  },
};

export default function LogisticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
