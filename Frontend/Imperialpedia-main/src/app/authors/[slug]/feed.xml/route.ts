import { NextRequest, NextResponse } from "next/server";
import { listCmsContent, resolveAuthor, type CmsContent } from "@/services/data/cms-public";
import { rssChannelXml } from "@/lib/rss";
import { env } from "@/config/env";

export const revalidate = 3600;

/** Per-author RSS feed — real articles attributed to this author (customFields.authorSlug), same source as /authors/[slug]'s own article list. 404s for an unknown author rather than returning an empty feed for a URL that was never valid. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await resolveAuthor(slug);
  if (!author) {
    return new NextResponse("Not found", { status: 404 });
  }

  const baseUrl = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const { items } = await listCmsContent({ contentType: "article", authorSlug: author.slug, limit: 30 }).catch(
    () => ({ items: [] as CmsContent[], total: 0 }),
  );
  const sorted = [...items].sort(
    (a, b) => Date.parse(b.publishedAt ?? b.updatedAt ?? "") - Date.parse(a.publishedAt ?? a.updatedAt ?? ""),
  );

  const feedUrl = `${baseUrl}/authors/${author.slug}/feed.xml`;
  const xml = rssChannelXml({
    title: `${author.name} – Imperialpedia`,
    link: `${baseUrl}/authors/${author.slug}`,
    selfLink: feedUrl,
    description: `Latest articles by ${author.name} on Imperialpedia.`,
    items: sorted,
    baseUrl,
  });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
