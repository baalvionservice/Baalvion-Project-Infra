
import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SubPageHero, SubPageContent } from "@/components/sub-page-hero";

export const metadata: Metadata = {
  title: "Leadership & Founders | Baalvion",
  description: "Meet the visionaries and founders architecting the next century of global trade infrastructure at Baalvion Industries.",
  alternates: { canonical: "https://about.baalvion.com/leadership" },
  openGraph: {
    title: "Leadership & Founders | Baalvion",
    description: "Meet the visionaries and founders architecting the next century of global trade infrastructure at Baalvion Industries.",
    url: "https://about.baalvion.com/leadership",
    siteName: "Baalvion Operating System (BOS)",
    images: [{ url: "https://picsum.photos/seed/baalvion-leadership/1200/630", width: 1200, height: 630, alt: "Baalvion Leadership & Founders" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leadership & Founders | Baalvion",
    description: "Meet the visionaries and founders architecting the next century of global trade infrastructure at Baalvion Industries.",
    images: ["https://picsum.photos/seed/baalvion-leadership/1200/630"],
  },
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
