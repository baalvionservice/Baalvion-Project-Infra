import { type CmsContent } from "@/services/data/cms-public";
import { articleUrl } from "@/lib/data/article-url";

export const escXml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function rssItemXml(item: CmsContent, baseUrl: string): string {
  // Articles canonically live under their real category (/<categorySlug>/<slug>);
  // news keeps the dated Imperialpedia-style URL — same split `newsArticleHref` uses.
  const path =
    item.contentType === "article"
      ? item.category?.slug
        ? `/${item.category.slug}/${item.slug}`
        : `/financial-intelligence/${item.slug}`
      : articleUrl(item.publishedAt ?? item.updatedAt ?? null, item.slug);
  const url = `${baseUrl}${path}`;
  const pubDate = item.publishedAt ? new Date(item.publishedAt).toUTCString() : new Date().toUTCString();
  return `  <item>
    <title>${escXml(item.title)}</title>
    <link>${escXml(url)}</link>
    <guid isPermaLink="true">${escXml(url)}</guid>
    <pubDate>${pubDate}</pubDate>
    ${item.excerpt ? `<description>${escXml(item.excerpt)}</description>` : ""}
    ${item.category?.name ? `<category>${escXml(item.category.name)}</category>` : ""}
  </item>`;
}

export function rssChannelXml(opts: {
  title: string;
  link: string;
  selfLink: string;
  description: string;
  items: CmsContent[];
  baseUrl: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escXml(opts.title)}</title>
  <link>${escXml(opts.link)}</link>
  <description>${escXml(opts.description)}</description>
  <language>en-us</language>
  <atom:link href="${escXml(opts.selfLink)}" rel="self" type="application/rss+xml" />
${opts.items.map((item) => rssItemXml(item, opts.baseUrl)).join("\n")}
</channel>
</rss>`;
}
