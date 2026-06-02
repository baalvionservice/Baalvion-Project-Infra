import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import EcosystemPageServer from "@/components/ecosystem-page-server";
import { getEcosystemItems } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Ecosystem | Baalvion Operating System Architecture",
  description:
    "A standardized blueprint of the Baalvion Operating System (BOS), architected for transparency, scalability, and modular integration across global markets.",
  alternates: { canonical: "https://about.baalvion.com/ecosystem" },
  openGraph: {
    title: "Ecosystem | Baalvion Operating System Architecture",
    description:
      "A standardized blueprint of the Baalvion Operating System (BOS), architected for transparency, scalability, and modular integration across global markets.",
    url: "https://about.baalvion.com/ecosystem",
    siteName: "Baalvion Operating System (BOS)",
    images: [
      {
        url: "https://picsum.photos/seed/baalvion-ecosystem/1200/630",
        width: 1200,
        height: 630,
        alt: "Baalvion Operating System Ecosystem",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ecosystem | Baalvion Operating System Architecture",
    description:
      "A standardized blueprint of the Baalvion Operating System (BOS), architected for transparency, scalability, and modular integration across global markets.",
    images: ["https://picsum.photos/seed/baalvion-ecosystem/1200/630"],
  },
};

export default async function Page() {
  // Fetch ecosystem data on the server for SEO optimization
  const items = await getEcosystemItems();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <EcosystemPageServer items={items} />
      <Footer />
    </div>
  );
}
