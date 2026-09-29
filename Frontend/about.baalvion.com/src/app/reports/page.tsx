
import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SubPageHero, SubPageContent } from "@/components/sub-page-hero";

export const metadata: Metadata = {
  title: "Platform Reports | Execution Metrics",
  description: "Transparent metrics on Baalvion Nexus performance and development.",
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
