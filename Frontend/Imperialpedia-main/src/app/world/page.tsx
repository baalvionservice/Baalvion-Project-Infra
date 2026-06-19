import type { Metadata } from "next";
import WorldView from "@/components/world/WorldView";
import { getWorldDataLive } from "@/lib/data/worldFeed";
import { worldSeo } from "@/lib/data/worldRegions";

// Fully dynamic: rendered per-request so live markets/news and CMS content are
// always fresh (and work on Vercel against a public CMS).
export const dynamic = 'force-dynamic';

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
