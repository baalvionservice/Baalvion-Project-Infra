import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPseoPageBySlug, pseoPages, isValidPseoPage } from "@/lib/pseo-data";
import { PseoTemplate } from "@/components/pseo/PseoTemplate";

interface TradePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * @fileOverview Marketplace SEO Expansion Engine - Meta Logic.
 * Dynamically handles indexing rules and intent-based metadata generation
 * based on the Global Mining Keyword Map.
 */

export async function generateMetadata({ params }: TradePageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getPseoPageBySlug(slug);

  if (!data) return { title: 'Trade Corridor Not Found' };

  const isHighQuality = isValidPseoPage(data);
  const { productName, location, role, intent, industry, avgPurity, supplierCount, keywords } = data;

  // Intent-based Title Generation using Keyword Map
  let title = `Verified ${productName} ${role} in ${location}`;
  
  if (intent === 'BUY') title = `Where to Buy ${productName} in ${location} | Verified Wholesale`;
  if (intent === 'INDUSTRY') title = `${productName} for ${industry} | High-Grade ${avgPurity} Supply`;
  if (intent === 'QUARRY') title = `Direct ${productName} ${role} in ${location} | Verified Extraction`;
  if (intent === 'DIRECTORY') title = `Top ${productName} ${role} Directory in ${location} (${supplierCount}+ Listed)`;

  // Intent-based Description Generation
  const description = intent === 'BUY' 
    ? `Source high-grade ${productName} in ${location}. Connect with ${supplierCount} verified ${role.toLowerCase()} supplying ${avgPurity} material for ${industry} applications.`
    : `Browse the leading ${supplierCount} ${productName} ${role.toLowerCase()} in ${location}. Technical grade ${avgPurity} material available for global ${industry} export.`;

  return {
    title,
    description,
    keywords: keywords.join(', '),
    alternates: {
      canonical: `https://mining.baalvion.com/trade/${slug}`,
    },
    robots: {
      index: isHighQuality,
      follow: true,
      nocache: !isHighQuality,
    },
    openGraph: {
      title,
      description,
      images: ['https://mining.baalvion.com/images/og/og-default.svg'],
    }
  };
}

export async function generateStaticParams() {
  return pseoPages.map((p) => ({
    slug: p.slug,
  }));
}

export default async function PseoPage({ params }: TradePageProps) {
  const { slug } = await params;
  const data = getPseoPageBySlug(slug);

  if (!data) {
    notFound();
  }

  return <PseoTemplate data={data} />;
}
