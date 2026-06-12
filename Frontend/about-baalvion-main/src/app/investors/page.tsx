
import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SubPageHero, SubPageContent } from "@/components/sub-page-hero";

export const metadata: Metadata = {
  title: "Investor Relations | Baalvion",
  description: "Strategic updates and shareholder communications from Baalvion Industries, the global trade infrastructure platform.",
  alternates: { canonical: "https://about.baalvion.com/investors" },
  openGraph: {
    title: "Investor Relations | Baalvion",
    description: "Strategic updates and shareholder communications from Baalvion Industries, the global trade infrastructure platform.",
    url: "https://about.baalvion.com/investors",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://about.baalvion.com/api/og?title=Baalvion+Investor+Relations&eyebrow=Baalvion+Industries", width: 1200, height: 630, alt: "Baalvion Investor Relations" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Investor Relations | Baalvion",
    description: "Strategic updates and shareholder communications from Baalvion Industries, the global trade infrastructure platform.",
    images: ["https://about.baalvion.com/api/og?title=Baalvion+Investor+Relations&eyebrow=Baalvion+Industries"],
  },
};

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <SubPageHero category="Governance" title="Investor Letters" />
        <SubPageContent />
      </main>
      <Footer />
    </div>
  );
}
