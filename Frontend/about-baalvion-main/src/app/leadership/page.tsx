
import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SubPageHero, SubPageContent } from "@/components/sub-page-hero";

export const metadata: Metadata = {
  title: "Leadership & Founders | Baalvion",
  description: "Meet the visionaries behind the Baalvion Nexus.",
};

export default function LeadershipPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <SubPageHero category="Vision" title="Leadership & Founders" />
        <SubPageContent />
      </main>
      <Footer />
    </div>
  );
}
