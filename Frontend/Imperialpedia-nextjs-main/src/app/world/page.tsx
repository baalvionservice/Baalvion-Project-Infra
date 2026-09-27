import type { Metadata } from "next";
import WorldView from "@/components/world/WorldView";
import { getWorldDataLive } from "@/lib/data/worldFeed";
import { worldSeo } from "@/lib/data/worldRegions";

// Fully dynamic: rendered per-request so live markets/news and CMS content are
// always fresh (and work on Vercel against a public CMS).
export const dynamic = 'force-dynamic';

import { buildMetadata } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const seo = worldSeo("world");
  return buildMetadata({
    title: seo.title,
    description: seo.description,
    canonical: "/world",
    ogType: "website",
  });
}

export default async function WorldPage() {
  const data = await getWorldDataLive("world");
  return <WorldView data={data} />;
}
