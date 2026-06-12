import type { Metadata } from "next";
import WorldView from "@/components/world/WorldView";
import { getWorldDataLive } from "@/lib/data/worldFeed";
import { worldSeo } from "@/lib/data/worldRegions";

// ISR: statically cached, regenerated every 2 minutes for fresh markets/news.
export const revalidate = 120;

export function generateMetadata(): Metadata {
  const seo = worldSeo("world");
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

export default async function WorldPage() {
  const data = await getWorldDataLive("world");
  return <WorldView data={data} />;
}
