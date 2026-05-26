
import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SubPageHero, SubPageContent } from "@/components/sub-page-hero";

export const metadata: Metadata = {
  title: "Investor Relations | Baalvion",
  description: "Strategic updates and shareholder communications.",
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
