import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import NetworkDetailPageServer from "@/components/network-detail-page-server";
import { JsonLd } from "@/components/json-ld";
import { BASE_URL, breadcrumbSchema } from "@/lib/schema";
import { NETWORK_ENTRIES } from "@/lib/network";
import { getNetworkDetail } from "@/lib/network-detail";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return NETWORK_ENTRIES.filter((e) => getNetworkDetail(e.slug)).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = NETWORK_ENTRIES.find((e) => e.slug === slug);
  const detail = getNetworkDetail(slug);
  if (!entry || !detail) return {};

  const title = `${entry.name} | The Baalvion Network`;
  const description = detail.solution;
  const url = `${BASE_URL}/network/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Baalvion Operating System (BOS)",
      images: [{ url: `${BASE_URL}${entry.screenshot.src}`, width: entry.screenshot.width, height: entry.screenshot.height, alt: entry.screenshot.alt }],
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}${entry.screenshot.src}`],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = NETWORK_ENTRIES.find((e) => e.slug === slug);
  const detail = getNetworkDetail(slug);
  if (!entry || !detail) notFound();

  const schema = breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Network", url: "/network" },
    { name: entry.name, url: `/network/${slug}` },
  ]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <JsonLd data={schema} />
      <Navbar />
      <NetworkDetailPageServer entry={entry} detail={detail} />
      <Footer />
    </div>
  );
}
