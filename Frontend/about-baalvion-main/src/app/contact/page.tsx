import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import ContactPageServer from "@/components/contact-page-server";

export const metadata: Metadata = {
  title: "Contact Us | Baalvion Industries",
  description:
    "Initiate a strategic partnership or project briefing. Our global trade specialists are ready to architect your integration.",
  alternates: { canonical: "https://about.baalvion.com/contact" },
  openGraph: {
    title: "Contact Us | Baalvion Industries",
    description:
      "Initiate a strategic partnership or project briefing. Our global trade specialists are ready to architect your integration.",
    url: "https://about.baalvion.com/contact",
    siteName: "Baalvion Operating System (BOS)",
    images: [
      {
        url: "https://about.baalvion.com/api/og?title=Contact+Baalvion&eyebrow=Baalvion+Industries",
        width: 1200,
        height: 630,
        alt: "Contact Baalvion Industries",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Baalvion Industries",
    description:
      "Initiate a strategic partnership or project briefing. Our global trade specialists are ready to architect your integration.",
    images: ["https://about.baalvion.com/api/og?title=Contact+Baalvion&eyebrow=Baalvion+Industries"],
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <ContactPageServer />
      <Footer />
    </div>
  );
}
