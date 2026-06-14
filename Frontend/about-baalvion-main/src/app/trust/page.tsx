import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import TrustPageServer from "@/components/trust-page-server";

export const metadata: Metadata = {
  title: "Trust & Security | Baalvion Operating System",
  description:
    "Security, transparency, and international law are at the core of the Baalvion Operating System (BOS) infrastructure. We architect for the highest global standards.",
  alternates: { canonical: "https://about.baalvion.com/trust" },
  openGraph: {
    title: "Trust & Security | Baalvion Operating System",
    description:
      "Security, transparency, and international law are at the core of the Baalvion Operating System (BOS) infrastructure. We architect for the highest global standards.",
    url: "https://about.baalvion.com/trust",
    siteName: "Baalvion Operating System (BOS)",
    images: [
      {
        url: "https://about.baalvion.com/api/og?title=Trust+%26+Security&eyebrow=Baalvion+Industries",
        width: 1200,
        height: 630,
        alt: "Baalvion Trust & Security",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trust & Security | Baalvion Operating System",
    description:
      "Security, transparency, and international law are at the core of the Baalvion Operating System (BOS) infrastructure. We architect for the highest global standards.",
    images: ["https://about.baalvion.com/api/og?title=Trust+%26+Security&eyebrow=Baalvion+Industries"],
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <TrustPageServer />
      <Footer />
    </div>
  );
}
