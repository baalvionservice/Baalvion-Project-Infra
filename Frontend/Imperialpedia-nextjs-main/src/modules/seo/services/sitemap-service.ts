import { articlesService } from "@/services/data";
import { env } from "@/config/env";
import { logger } from "@/lib/errors/logger";
import { categoryHasLiveContent } from "@/components/pages/CategoryFeed";
import { REMOVED_ARTICLE_PATHS } from "@/lib/content/removed-article-paths";
import { isRetiredPath } from "@/lib/content/retired-paths";
import { isPathHiddenByAdsenseCleanup } from "@/config/adsense-cleanup";
import { getPublicAuthors } from "@/services/data/cms-public";

/**
 * @fileOverview Scalable XML sitemap system for 10k–1M+ URLs.
 *
 * Serves a sitemap **index** at /sitemap.xml that points to N sharded url-sets at
 * /sitemaps/{i}.xml, each holding at most SHARD_SIZE (< 50,000) URLs per the
 * sitemaps.org / Google standard. URLs are collected live from the CMS + entity
 * backends and cached briefly so the index and its shards stay consistent and
 * cheap to serve. Content changes propagate via route revalidation (hourly) and
 * the on-publish webhook at /api/revalidate (near-real-time).
 */

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  /**
   * The real, direct image URL (never a data: URI, never the /_next/image
   * proxy) for the Google Images sitemap extension. Pages render images
   * through /_next/image?url=...&w=...&q=..., a dynamically parameterized
   * URL Google's own docs call out as unreliable for image discovery —
   * this is the documented fix: point the image sitemap at the stable
   * origin file instead.
   */
  image?: { loc: string; title?: string };
}

/** Max URLs per shard. Google's hard limit is 50,000 / 50MB — stay safely under. */
export const SHARD_SIZE = 45000;

/** Brief in-memory cache so index + shards are computed from one consistent snapshot. */
const CACHE_TTL_MS = 10 * 60 * 1000;
let entriesCache: { at: number; entries: SitemapEntry[] } | null = null;

function baseUrl(): string {
  return env.siteUrl.endsWith("/") ? env.siteUrl.slice(0, -1) : env.siteUrl;
}

/**
 * The image sitemap extension needs a real, absolute, directly-fetchable
 * image URL — never the generated data: URI fallback (safeImageUrl's
 * last resort for a row with no uploaded artwork; meaningless in a sitemap,
 * since it isn't a URL Google can crawl at all).
 */
function articleImage(url: string | undefined | null, title: string | undefined): { loc: string; title?: string } | undefined {
  if (!url || url.startsWith("data:")) return undefined;
  return { loc: url, title: title || undefined };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const sitemapService = {
  /**
   * Collect every public, indexable URL from static routes + live backends.
   * Deduped by loc. Cached for CACHE_TTL_MS so a burst of shard requests does
   * not refetch the backends per shard.
   */
  async collectEntries(): Promise<SitemapEntry[]> {
    const start = Date.now();
    const base = baseUrl();
    const today = new Date().toISOString().split("T")[0];
    const entries: SitemapEntry[] = [];

    // 1. Static public pages (every indexable, crawlable route).
    // 2026-09-25: deliberately trimmed to exactly what's required — core
    // static pages, author profiles, the 3 live category hubs (plus /stocks
    // below), and the published articles themselves. Everything else
    // (financial-tools calculators, prompts, glossary terms, world/news
    // pages, countries, market quotes, stock reference guides, every other
    // topic hub) is intentionally left out of the sitemap by request, not
    // just gated behind a not-yet-live flag — see git history on this file
    // for the fuller per-section reasoning if any of it needs to come back.
    const corePages = [
      "",
      "/about",
      "/authors",
      "/contact",
      "/privacy-policy",
      "/stocks",
      "/terms-of-service",
      "/transparency",
    ];
    corePages.forEach((path) => {
      entries.push({
        loc: `${base}${path}`,
        lastmod: today,
        changefreq: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.7,
      });
    });

    // 2. Dynamic node IDs in parallel (each resilient to backend hiccups).
    const safe = async <T>(p: Promise<T>, fb: T): Promise<T> => {
      try { return await p; } catch { return fb; }
    };
    // The requested `limit` is a ceiling, not a guarantee — cms-service caps page
    // size at 100 server-side regardless of what's asked for, so a single
    // `getPage(1, 1000)` call silently truncates to the first 100 items and drops
    // the rest from the sitemap. Walk `pagination.totalPages` to collect everything.
    const listAllPages = async <T>(
      getPage: (page: number, limit: number) => Promise<{ data: T[]; pagination?: { totalPages: number } }>,
    ): Promise<T[]> => {
      try {
        const first = await getPage(1, 1000);
        const items = [...(first.data ?? [])];
        const totalPages = first.pagination?.totalPages ?? 1;
        for (let page = 2; page <= totalPages; page++) {
          try {
            items.push(...((await getPage(page, 1000)).data ?? []));
          } catch {
            break;
          }
        }
        return items;
      } catch {
        return [];
      }
    };
    const cmsArticles = await listAllPages(articlesService.getArticles);

    // Live CMS only — no merge with staticArticleList()'s 478-article backup
    // catalog. That catalog exists purely as an offline/CMS-down fallback for
    // page rendering; submitting it to the sitemap meant every article ever
    // unpublished from the CMS (e.g. the September 2026 Stocks/Budgeting trim
    // to a curated 10 each) stayed listed forever, since nothing in the static
    // snapshot ever shrinks. A sitemap is a crawl invitation, not a historical
    // archive — pre-AdSense-resubmission, it must reflect exactly what's live.
    const articles = cmsArticles;

    // Thin/duplicate articles permanently killed in the 2026-08 SEO cleanup pass (see
    // REMOVED_PATHS in middleware.ts) — excluded here too so a still-published CMS row
    // for one of these slugs never gets submitted to a URL that now 410s. Shared with
    // getHomeEditorial.ts (see removed-article-paths.ts) so neither surface can drift
    // out of sync with the other.
    articles.forEach((article) => {
      const path = article.categorySlug ? `/${article.categorySlug}/${article.slug}` : `/financial-intelligence/${article.slug}`;
      if (REMOVED_ARTICLE_PATHS.has(path)) return;
      // Same stale-category guard as the news loop below: an article's stored
      // CMS category can point at a since-retired slug even though the page
      // itself still renders fine under its real category elsewhere.
      if (isRetiredPath(path)) return;
      entries.push({
        loc: `${base}${path}`,
        lastmod: article.publishedAt?.split("T")[0] || today,
        changefreq: "weekly",
        priority: 0.8,
        image: articleImage(article.featuredImage, article.title),
      });
    });

    // The 3 category hubs (besides /stocks, already in corePages) that the
    // 46 live articles actually live under. Submitted only once each actually
    // has a published article — checked via the same `categoryHasLiveContent`
    // each hub's own generateMetadata uses to decide noindex, so the sitemap
    // and each page's own robots meta can never disagree with each other.
    const LIVE_CATEGORY_HUB_SLUGS = ["creator-economy", "budgeting-basics", "fraud-protection"] as const;
    const liveCategoryHubSlugs = LIVE_CATEGORY_HUB_SLUGS.filter((slug) => !isRetiredPath(`/${slug}`));
    const categoryHubResults = await Promise.all(
      liveCategoryHubSlugs.map(async (slug) => ({ slug, hasContent: await safe(categoryHasLiveContent(slug), false) })),
    );
    categoryHubResults.forEach(({ slug, hasContent }) => {
      if (hasContent) {
        entries.push({ loc: `${base}/${slug}`, lastmod: today, changefreq: "weekly", priority: 0.7 });
      }
    });

    // 3. Author profiles. /authors and every /authors/{slug} page renders and
    // is crawlable, and the footer links the index from every page — the
    // masthead is the expertise signal reviewers look for on a finance site.
    const authors = await safe(getPublicAuthors(), []);
    authors.forEach((author) => {
      if (author?.slug) {
        entries.push({ loc: `${base}/authors/${author.slug}`, changefreq: "monthly", priority: 0.6 });
      }
    });

    // Dedupe by URL and filter out paths hidden by AdSense cleanup mode
    const seen = new Set<string>();
    const unique = entries.filter((e) => (seen.has(e.loc) ? false : (seen.add(e.loc), true)));
    const filtered = unique.filter((e) => !isPathHiddenByAdsenseCleanup(e.loc));
    logger.info(`Sitemap collected ${filtered.length} URLs in ${Date.now() - start}ms`);
    return filtered;
  },

  /** Cached entry snapshot shared by the index and all shards. */
  async getEntries(): Promise<SitemapEntry[]> {
    const now = Date.now();
    if (entriesCache && now - entriesCache.at < CACHE_TTL_MS) return entriesCache.entries;
    const entries = await this.collectEntries();
    entriesCache = { at: now, entries };
    return entries;
  },

  /** Force the next index/shard request to recompute (called by /api/revalidate). */
  invalidate(): void {
    entriesCache = null;
  },

  /** Number of shards for the current URL count. */
  async shardCount(): Promise<number> {
    const entries = await this.getEntries();
    return Math.max(1, Math.ceil(entries.length / SHARD_SIZE));
  },

  /** Build the <sitemapindex> pointing at /sitemaps/{i}.xml. */
  async buildIndex(): Promise<string> {
    const base = baseUrl();
    const n = await this.shardCount();
    const lastmod = new Date().toISOString();
    const items = Array.from({ length: n }, (_, i) =>
      `  <sitemap>\n    <loc>${escapeXml(`${base}/sitemaps/${i}.xml`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
    ).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>`;
  },

  /** Build the <urlset> for shard `n` (0-based), or null if out of range. */
  async buildShard(n: number): Promise<string | null> {
    const entries = await this.getEntries();
    const start = n * SHARD_SIZE;
    if (n < 0 || start >= entries.length) return null;
    return this.buildXml(entries.slice(start, start + SHARD_SIZE));
  },

  /** Wrap entries in a standard sitemap <urlset>. */
  buildXml(entries: SitemapEntry[]): string {
    const xmlEntries = entries
      .map(
        (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""}${entry.changefreq ? `\n    <changefreq>${entry.changefreq}</changefreq>` : ""}${entry.priority != null ? `\n    <priority>${entry.priority.toFixed(1)}</priority>` : ""}${entry.image ? `\n    <image:image>\n      <image:loc>${escapeXml(entry.image.loc)}</image:loc>${entry.image.title ? `\n      <image:title>${escapeXml(entry.image.title)}</image:title>` : ""}\n    </image:image>` : ""}
  </url>`,
      )
      .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${xmlEntries}\n</urlset>`;
  },

  /** Back-compat: full flat urlset (unused by the sharded routes). */
  async regenerateSitemap(): Promise<string> {
    return this.buildXml(await this.getEntries());
  },
};
