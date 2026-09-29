import { cmsGetArticles, cmsGetNews, type CmsArticle } from "@/lib/cms";
import { articleUrl } from "@/lib/article-url";

// Raised off the 5-minute clock: /api/revalidate's revalidateTag() refreshes
// this on publish, so the window is only the no-webhook safety net.
export const revalidate = 86400;

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://lawelitenetwork.com";

const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function itemXml(item: CmsArticle): string {
  const url = `${SITE}${articleUrl(item)}`;
  const pubDate = item.updatedAt ? new Date(item.updatedAt).toUTCString() : new Date().toUTCString();
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
  const [articles, news] = await Promise.all([
    cmsGetArticles().catch(() => [] as CmsArticle[]),
    cmsGetNews(20).catch(() => [] as CmsArticle[]),
  ]);

  const merged = [...articles, ...news]
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .slice(0, 30);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Law Elite Network</title>
  <link>${SITE}</link>
  <description>Legal guides, practice-area analysis and legal news from Law Elite Network.</description>
  <language>en-us</language>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
${merged.map((item) => itemXml(item)).join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
