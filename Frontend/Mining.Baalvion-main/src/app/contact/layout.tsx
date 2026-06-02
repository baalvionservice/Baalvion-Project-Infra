import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Baalvion Mining Inc.",
  description:
    "Reach out to Baalvion Mining Inc. for trade inquiries, compliance questions, logistics support, or partnership opportunities. Headquartered in Mumbai, India.",
  alternates: { canonical: "https://mining.baalvion.com/contact" },
  openGraph: {
    title: "Contact Us | Baalvion Mining Inc.",
    description:
      "Connect with the Baalvion Mining Inc. team for trade, compliance, logistics, or partnership inquiries.",
    url: "https://mining.baalvion.com/contact",
    siteName: "Baalvion Mining Inc.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
