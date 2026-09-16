import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import NetworkPageServer from "@/components/network-page-server";
import { JsonLd } from "@/components/json-ld";
import { BASE_URL, breadcrumbSchema, collectionSchema } from "@/lib/schema";
import { NETWORK_ENTRIES } from "@/lib/network";

const NETWORK_DESCRIPTION =
  "A real, verified registry of the Baalvion platform's properties — the corporate foundation, the operating platforms, and the independent brands built on top of it.";

export const metadata: Metadata = {
  title: "Network | Baalvion Properties & Platforms",
  description: NETWORK_DESCRIPTION,
  alternates: { canonical: "https://about.baalvion.com/network" },
  openGraph: {
    title: "Network | Baalvion Properties & Platforms",
    description: NETWORK_DESCRIPTION,
    url: "https://about.baalvion.com/network",
    siteName: "Baalvion Operating System (BOS)",
    images: [
      {
        url: "https://about.baalvion.com/api/og?title=The+Baalvion+Network&eyebrow=Baalvion+Industries",
        width: 1200,
        height: 630,
        alt: "The Baalvion Network",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Network | Baalvion Properties & Platforms",
    description: NETWORK_DESCRIPTION,
    images: ["https://about.baalvion.com/api/og?title=The+Baalvion+Network&eyebrow=Baalvion+Industries"],
  },
};

export default function Page() {
  const schema = [
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Network", url: "/network" },
    ]),
    collectionSchema({
      name: "The Baalvion Network",
      description: NETWORK_DESCRIPTION,
      url: `${BASE_URL}/network`,
      items: NETWORK_ENTRIES.map((entry) => ({ name: entry.name, url: entry.href })),
    }),
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <JsonLd data={schema} />
      <Navbar />
      <NetworkPageServer entries={NETWORK_ENTRIES} />
      <Footer />
    </div>
  );
}
