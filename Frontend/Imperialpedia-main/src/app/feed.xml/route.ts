import { listCmsContent, type CmsContent } from "@/services/data/cms-public";
import { env } from "@/config/env";

export const revalidate = 300;

const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function itemXml(item: CmsContent, baseUrl: string): string {
  const url = `${baseUrl}/financial-intelligence/${item.slug}`;
  const pubDate = item.publishedAt ? new Date(item.publishedAt).toUTCString() : new Date().toUTCString();
  return `  <item>
    <title>${esc(item.title)}</title>
    <link>${esc(url)}</link>
    <guid isPermaLink="true">${esc(url)}</guid>
    <pubDate>${pubDate}</pubDate>
    ${item.excerpt ? `<description>${esc(item.excerpt)}</description>` : ""}
    ${item.category?.name ? `<category>${esc(item.category.name)}</category>` : ""}
  </item>`;
}

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Imperialpedia</title>
  <link>${baseUrl}</link>
  <description>Personal finance, markets and business news from Imperialpedia.</description>
  <language>en-us</language>
  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${merged.map((item) => itemXml(item, baseUrl)).join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
