import type { Metadata } from "next";

// Supplier profile detail. The page itself ('use client') renders Organization
// JSON-LD per supplier; this server layout supplies indexable, templated metadata.
export const metadata: Metadata = {
  title: "Verified Supplier Profile",
  description:
    "View a KYC-verified mineral supplier profile on Baalvion Mining Inc. — certifications, capabilities, product lines, and trade history.",
  openGraph: {
    title: "Verified Supplier Profile",
    description:
      "KYC-verified mineral supplier profile on the Baalvion Mining Inc. directory.",
    siteName: "Baalvion Mining Inc.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function SupplierProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
