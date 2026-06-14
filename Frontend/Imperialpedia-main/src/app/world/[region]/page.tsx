import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import WorldView from "@/components/world/WorldView";
import { getWorldDataLive } from "@/lib/data/worldFeed";
import { REGIONS, worldSeo } from "@/lib/data/worldRegions";

type Params = Promise<{ region: string }>;

// ISR: statically cached, regenerated every 2 minutes for fresh markets/news.
export const revalidate = 120;
// Only the known regions are valid; anything else 404s (no thin/duplicate pages).
export const dynamicParams = false;

/** Pre-render every region except "world" (that's the canonical /world page). */
export function generateStaticParams() {
  return REGIONS.filter((r) => r.id !== "world").map((r) => ({ region: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { region } = await params;
  const seo = worldSeo(region);
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      type: "website",
      siteName: "Imperialpedia",
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
  };
}

export default async function WorldRegionPage({ params }: { params: Params }) {
  const { region } = await params;
  // The "world" view lives at the canonical /world — keep one URL per region.
  if (region === "world") redirect("/world");
  if (!REGIONS.some((r) => r.id === region)) notFound();

  const data = await getWorldDataLive(region);
  return <WorldView data={data} />;
}
