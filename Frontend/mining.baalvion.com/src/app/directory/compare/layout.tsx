import type { Metadata } from "next";

// Dynamic supplier comparison utility — crawlable but not indexed
// (transient, query-driven views with no stable canonical content).
export const metadata: Metadata = {
  title: "Compare Suppliers",
  description:
    "Compare KYC-verified mineral suppliers side by side on Baalvion Mining Inc. — certifications, capacity, and trade readiness.",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function DirectoryCompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
