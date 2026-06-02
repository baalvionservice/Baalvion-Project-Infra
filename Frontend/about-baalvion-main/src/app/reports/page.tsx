
import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SubPageHero, SubPageContent } from "@/components/sub-page-hero";

export const metadata: Metadata = {
  title: "Platform Reports | Execution Metrics | Baalvion",
  description: "Transparent execution metrics, system performance data, and development progress reports from the Baalvion Operating System (BOS).",
  alternates: { canonical: "https://about.baalvion.com/reports" },
  openGraph: {
    title: "Platform Reports | Execution Metrics | Baalvion",
    description: "Transparent execution metrics, system performance data, and development progress reports from the Baalvion Operating System (BOS).",
    url: "https://about.baalvion.com/reports",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://picsum.photos/seed/baalvion-platform-reports/1200/630", width: 1200, height: 630, alt: "Baalvion Platform Reports" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform Reports | Execution Metrics | Baalvion",
    description: "Transparent execution metrics, system performance data, and development progress reports from the Baalvion Operating System (BOS).",
    images: ["https://picsum.photos/seed/baalvion-platform-reports/1200/630"],
  },
};

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <SubPageHero category="Transparency" title="Platform Reports" />
        <SubPageContent />
      </main>
      <Footer />
    </div>
  );
}
