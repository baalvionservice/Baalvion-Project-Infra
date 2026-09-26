import { listCmsContent, type CmsContent } from "@/services/data/cms-public";
import { rssChannelXml } from "@/lib/rss";
import { env } from "@/config/env";

// The RSS feed's own window. It reads through cms-public, so /api/revalidate's
// revalidateTag() already refreshes it the moment anything is published — this
// is only the no-webhook safety net, and a reader polling it every 5 minutes
// was regenerating the whole feed each time.
export const revalidate = 3600;

/** Latest published articles + news, merged and sorted, as a standard RSS 2.0 feed. */
export async function GET() {
  const baseUrl = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");

  const [articles, news] = await Promise.all([
    listCmsContent({ contentType: "article", limit: 20 }).catch(() => ({ items: [] as CmsContent[], total: 0 })),
    listCmsContent({ contentType: "news", limit: 20 }).catch(() => ({ items: [] as CmsContent[], total: 0 })),
  ]);

  const merged = [...articles.items, ...news.items]
    .sort((a, b) => Date.parse(b.publishedAt ?? b.updatedAt ?? "") - Date.parse(a.publishedAt ?? a.updatedAt ?? ""))
    .slice(0, 30);

  const xml = rssChannelXml({
    title: "Imperialpedia",
    link: baseUrl,
    selfLink: `${baseUrl}/feed.xml`,
    description: "Personal finance, markets and business news from Imperialpedia.",
    items: merged,
    baseUrl,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
