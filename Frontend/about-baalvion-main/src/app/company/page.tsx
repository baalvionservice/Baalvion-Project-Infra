import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import CompanyPageServer from "@/components/company-page-server";

export const metadata: Metadata = {
  title: "What We Do | Baalvion Industries",
  description:
    "We are architecting the foundational layer for the next century of international commerce, bridging the gap between legacy systems and future automation.",
  alternates: { canonical: "https://about.baalvion.com/company" },
  openGraph: {
    title: "What We Do | Baalvion Industries",
    description:
      "We are architecting the foundational layer for the next century of international commerce, bridging the gap between legacy systems and future automation.",
    url: "https://about.baalvion.com/company",
    siteName: "Baalvion Operating System (BOS)",
    images: [
      {
        url: "https://picsum.photos/seed/baalvion-company/1200/630",
        width: 1200,
        height: 630,
        alt: "Baalvion Company Overview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "What We Do | Baalvion Industries",
    description:
      "We are architecting the foundational layer for the next century of international commerce, bridging the gap between legacy systems and future automation.",
    images: ["https://picsum.photos/seed/baalvion-company/1200/630"],
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <CompanyPageServer />
      <Footer />
    </div>
  );
}
