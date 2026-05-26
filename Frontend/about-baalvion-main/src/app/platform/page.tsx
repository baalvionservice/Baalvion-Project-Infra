import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import PlatformPageServer from "@/components/platform-page-server";
import { getPageBySlug } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Platform | Baalvion Operating System Core Architecture",
  description:
    "Architecting the foundational layer for global trade with enterprise-grade reliability and modular scalability.",
  openGraph: {
    title: "Platform | Baalvion Operating System Core Architecture",
    description:
      "Architecting the foundational layer for global trade with enterprise-grade reliability and modular scalability.",
    url: "https://about.baalvion.com/platform",
    siteName: "Baalvion Operating System (BOS)",
    images: [
      {
        url: "https://picsum.photos/seed/baalvion-platform/1200/630",
        width: 1200,
        height: 630,
        alt: "Baalvion Operating System Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform | Baalvion Operating System Core Architecture",
    description:
      "Architecting the foundational layer for global trade with enterprise-grade reliability and modular scalability.",
    images: ["https://picsum.photos/seed/baalvion-platform/1200/630"],
  },
};

export default async function Page() {
  // Fetch platform page data on the server for SEO optimization
  const pageData = await getPageBySlug("platform");

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <PlatformPageServer pageData={pageData} />
      <Footer />
    </div>
  );
}
