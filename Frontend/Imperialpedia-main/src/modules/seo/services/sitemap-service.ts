import {
  articlesService,
  calculatorsService,
} from "@/services/data";
import { loadCountries } from "@/lib/data/loaders";
import { fetchAllTerms } from "@/lib/data/term-live";
import { reviewSlugs } from "@/lib/data/review-live";
import { getPublishedNews } from "@/services/data/cms-public";
import { newsArticleHref } from "@/lib/data/article-url";
import { ALL_TRACKED_SYMBOLS } from "@/lib/data/marketsLoader";
import { env } from "@/config/env";
import { logger } from "@/lib/errors/logger";
import { GLOSSARY_LIVE } from "@/config/glossary";
import { categoryHasLiveContent } from "@/components/pages/CategoryFeed";
import { REMOVED_ARTICLE_PATHS } from "@/lib/content/removed-article-paths";
import { MARKET_QUOTES_LIVE } from "@/config/market-quotes";
import stockIndexes from "@/data/indexes/indexes.json";
import stockLists from "@/data/stock-lists/stock-lists.json";

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
}

/** Max URLs per shard. Google's hard limit is 50,000 / 50MB — stay safely under. */
export const SHARD_SIZE = 45000;

/** Brief in-memory cache so index + shards are computed from one consistent snapshot. */
const CACHE_TTL_MS = 10 * 60 * 1000;
let entriesCache: { at: number; entries: SitemapEntry[] } | null = null;

function baseUrl(): string {
  return env.siteUrl.endsWith("/") ? env.siteUrl.slice(0, -1) : env.siteUrl;
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
    // "/creators", "/creators/leaderboards", "/creators/trust" removed entirely
    // (routes deleted) — the Creators feature was pulled from the site.
    // "/terms", "/topics", "/learning-paths" removed — glossary/topic-discovery
    // surface is offline pending AdSense approval, see src/config/glossary.ts.
    // Every CategoryFeed-backed topic hub (taxes, bonds, crypto, debt, ...) is
    // also removed from this static list: each one individually noindexes itself
    // via its own generateMetadata + categoryHasLiveContent (empty hubs read to
    // Google as exactly the thin/low-value content pattern that blocks AdSense
    // approval), and submitting a noindexed URL in the sitemap is a contradiction
    // Search Console flags. All of them are submitted conditionally below instead,
    // by that same categoryHasLiveContent check, once real content exists.
    // "/countries" hub is also removed — the hub page (and every ?query= variant of
    // it) was permanently killed in the 2026-08 SEO cleanup pass, see REMOVED_PATHS in
    // middleware.ts. Individual country pages (e.g. /countries/japan) are unaffected
    // and still submitted below via pushEntities.
    // "/companies" and "/technologies" (hub + every individual [slug] detail page)
    // were removed site-wide and are not submitted at all.
    // "/knowledge-map" removed — the Knowledge Graph page only ever produced real
    // connections through companies/industries/technologies, all three of which were
    // removed site-wide; without them it was countries with zero edges (not a graph)
    // while still linking out to those dead entity types. Retired entirely rather than
    // patched (see middleware.ts REMOVED_PATHS and knowledge-graph-service.ts removal).
    // "/explore" removed (2026-08-27) for the same reason — a country-discovery entry
    // point built around /countries and /technologies, both already gone. Route deleted
    // and permanently 410'd (see middleware.ts REMOVED_PATHS); submitting it here would
    // contradict that.
    // 2026-09-03: banking/bonds/commodities/credit/economy/etfs/investing/
    // mutual-funds/options/personal-finance removed — retired pending AdSense
    // review (see the redirect block in next.config.ts and Navbar.tsx), so
    // submitting them here would list URLs that now just 301 to /. Restore
    // once each category's articles are republished.
    const corePages = [
      "",
      "/about",
      "/financial-intelligence",
      "/budgeting",
      "/contact",
      "/financial-tools",
      "/financial-tools/compound-interest",
      "/financial-tools/inflation",
      "/financial-tools/investment",
      "/financial-tools/loan",
      "/market-news",
      "/privacy-policy",
      "/reviews",
      "/stocks",
      "/terms-of-service",
      "/transparency",
      "/world",
      "/world/us",
      "/world/europe",
      "/world/asia",
      "/world/china",
      "/world/emerging",
    ];
    corePages.forEach((path) => {
      entries.push({
        loc: `${base}${path}`,
        lastmod: today,
        changefreq: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.7,
      });
    });

    // 2a. Real glossary terms (static-fallback live set — same source that powers the
    // `/terms/[letter]/[slug]` pages) drive both the A–Z hub inclusion below and the
    // individual term entries further down, so the sitemap never submits a hub or a
    // term URL that doesn't actually resolve.
    const glossaryTerms = GLOSSARY_LIVE
      ? await (async () => {
          try {
            return await fetchAllTerms();
          } catch {
            return [];
          }
        })()
      : [];
    const letterOf = (title: string) => {
      const first = title.charAt(0).toLowerCase();
      return /^[0-9]/.test(first) ? "num" : first;
    };
    const lettersWithTerms = new Set(glossaryTerms.map((t) => letterOf(t.title)));

    // A–Z dictionary hubs (Investopedia-style listing pages). Only letters with at
    // least one real glossary entry are submitted so empty hubs aren't indexed.
    // Skipped entirely while the glossary is offline (see GLOSSARY_LIVE above).
    ["num", ..."abcdefghijklmnopqrstuvwxyz".split("")].forEach((l) => {
      if (!lettersWithTerms.has(l)) return;
      entries.push({ loc: `${base}/terms-beginning-with-${l}`, changefreq: "weekly", priority: 0.5 });
    });

    // 2. Dynamic node IDs in parallel (each resilient to backend hiccups).
    const safe = async <T>(p: Promise<T>, fb: T): Promise<T> => {
      try { return await p; } catch { return fb; }
    };
    const listSafe = async <T>(p: Promise<{ data: T[] }>): Promise<T[]> => {
      try { return (await p).data ?? []; } catch { return []; }
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
    const [articles, calcs] = await Promise.all([
      listAllPages(articlesService.getArticles),
      listSafe(calculatorsService.getCalculatorList()),
    ]);

    // Thin/duplicate articles permanently killed in the 2026-08 SEO cleanup pass (see
    // REMOVED_PATHS in middleware.ts) — excluded here too so a still-published CMS row
    // for one of these slugs never gets submitted to a URL that now 410s. Shared with
    // getHomeEditorial.ts (see removed-article-paths.ts) so neither surface can drift
    // out of sync with the other.
    articles.forEach((article) => {
      const path = article.categorySlug ? `/${article.categorySlug}/${article.slug}` : `/financial-intelligence/${article.slug}`;
      if (REMOVED_ARTICLE_PATHS.has(path)) return;
      entries.push({
        loc: `${base}${path}`,
        lastmod: article.publishedAt?.split("T")[0] || today,
        changefreq: "weekly",
        priority: 0.8,
      });
    });

    // Every CategoryFeed-backed topic hub — submit the hub itself only once it
    // actually has a published article, so Google is never handed an empty
    // CategoryFeed page (~40KB of template chrome and nothing else). Checked via
    // the exact same `categoryHasLiveContent` each hub's own generateMetadata
    // uses to decide noindex, so the sitemap and each page's own robots meta can
    // never disagree with each other. Picks up new content the moment it's
    // published in the CMS — no code change or redeploy.
    // "bonds", "commodities", "etfs", "mutual-funds", and "options" removed —
    // each is now a flagship dedicated hub (BondsHub/ETFsHub/MutualFundsHub/
    // OptionsHub/CommoditiesHub) with substantial unique keyTakeaways/sections
    // content from topic-config.ts, the same as banking/budgeting/credit/
    // investing/stocks, so they're submitted unconditionally via corePages
    // above instead of gated behind live CMS content.
    const TOPIC_HUB_SLUGS = [
      "advanced-budgeting", "app-reviews", "auto-loans", "banking-reviews",
      "brokers", "budget-rules", "budgeting-apps", "budgeting-basics", "calendar",
      "cd-rates", "checking", "credit-cards", "crypto",
      "cryptocurrency", "debt", "earnings", "emergency-fund",
      "family-budget", "fed", "financial-calculators", "financial-independence",
      // "income", "insurance", and "taxes" removed — none has a live route
      // (all permanently 410 in middleware.ts REMOVED_PATHS), so checking
      // categoryHasLiveContent for them could submit URLs to the sitemap that
      // 410 the moment Google fetches them.
      "fiscal-policy", "gdp", "global", "government", "indicators",
      "inflation", "interest-rates", "live-market-news",
      "loan-reviews", "loans", "monetary-policy", "money-management",
      "money-market", "monthly-budget", "mortgages",
      "planning", "politics", "portfolio", "real-estate", "retirement",
      "saving-money", "savings", "student-budget", "student-loans",
      "tax-software", "unemployment",
    ] as const;
    const topicHubResults = await Promise.all(
      TOPIC_HUB_SLUGS.map(async (slug) => ({ slug, hasContent: await safe(categoryHasLiveContent(slug), false) })),
    );
    topicHubResults.forEach(({ slug, hasContent }) => {
      if (hasContent) {
        entries.push({ loc: `${base}/${slug}`, lastmod: today, changefreq: "weekly", priority: 0.7 });
      }
    });

    // Real glossary terms — matches the actual `/terms/[letter]/[slug]` pages 1:1
    // (previously sourced from a small hardcoded mock glossary that didn't match the
    // real term set, which meant submitted URLs could 404).
    glossaryTerms.forEach((term) => {
      entries.push({
        loc: `${base}/terms/${letterOf(term.title)}/${term.slug}`,
        lastmod: today,
        changefreq: "monthly",
        priority: 0.7,
      });
    });

    calcs.forEach((calc) => {
      entries.push({ loc: `${base}/financial-tools/${calc.slug}`, changefreq: "monthly", priority: 0.9 });
    });

    // Hand-curated index/stock-list guides (data/indexes, data/stock-lists) —
    // small, real editorial sets, not auto-generated per-symbol pages.
    stockIndexes.forEach((idx) => {
      entries.push({ loc: `${base}/stocks/indexes/${idx.slug}`, changefreq: "monthly", priority: 0.7 });
    });
    stockLists.forEach((list) => {
      entries.push({ loc: `${base}/stocks/lists/${list.slug}`, changefreq: "monthly", priority: 0.7 });
    });

    // 3. Structured entities + review guides + published news.
    const [countries, news] = await Promise.all([
      safe(loadCountries(), []),
      safe(getPublishedNews(1000), []),
    ]);
    // 3 country entity pages permanently killed in the 2026-08 SEO cleanup pass
    // (REMOVED_PATHS in middleware.ts) — pushEntities is keyed by slug alone so
    // these need their own exclusion. Companies and technologies aren't submitted
    // at all: both routes (hub + every individual [slug] page) were removed
    // site-wide, not just a handful of slugs.
    const REMOVED_COUNTRY_SLUGS = new Set(["united-states", "taiwan", "south-korea"]);
    const pushEntities = (items: Array<{ slug?: string }>, prefix: string, priority = 0.7, exclude?: Set<string>) =>
      (items || []).forEach((e) => {
        if (e?.slug && !exclude?.has(e.slug)) entries.push({ loc: `${base}${prefix}/${e.slug}`, changefreq: "weekly", priority });
      });
    pushEntities(countries, "/countries", 0.7, REMOVED_COUNTRY_SLUGS);

    // "/news" and "/latest" are the same empty-hub case as the topic pages
    // above, just keyed on published `news` content instead of a category —
    // submit them only once at least one news item is actually published.
    if (news.length > 0) {
      entries.push({ loc: `${base}/news`, lastmod: today, changefreq: "daily", priority: 0.7 });
      entries.push({ loc: `${base}/latest`, lastmod: today, changefreq: "daily", priority: 0.7 });
    }

    // Market quote pages — every symbol this site actually renders a
    // `/markets/quote/[symbol]` page for (same tracked list the markets
    // breakdown panels and quote page itself use), so these financial entity
    // pages are discoverable rather than relying on internal links alone.
    // Excluded: DGS2 (2-year Treasury yield) has no individual quote source —
    // not an imperialpedia-service row, not a Yahoo ticker under any name
    // (verified live 2026-08-26). Redirects to /bonds instead (next.config.ts).
    // Every other tracked symbol, including the regional composites (CHINA, EM,
    // APAC → real ETF proxies FXI/EEM/VPL) and the other two yield tenors
    // (DGS30 → ^TYX, DGS3MO → ^IRX), now has real Yahoo-backed data — see
    // marketsLoader.ts's CANONICAL_TO_YAHOO.
    // Held back from the sitemap entirely while MARKET_QUOTES_LIVE is false
    // (pending AdSense approval — see config/market-quotes.ts): each page's
    // own generateMetadata also self-noindexes via the same flag, so this is
    // belt-and-suspenders, not a contradiction of what's actually indexable.
    if (MARKET_QUOTES_LIVE) {
      const QUOTE_PAGE_UNSUPPORTED = new Set(["DGS2"]);
      ALL_TRACKED_SYMBOLS.filter((symbol) => !QUOTE_PAGE_UNSUPPORTED.has(symbol)).forEach((symbol) => {
        entries.push({ loc: `${base}/markets/quote/${symbol}`, changefreq: "hourly", priority: 0.7 });
      });
    }
    (reviewSlugs || []).forEach((slug) =>
      entries.push({ loc: `${base}/${slug}`, changefreq: "weekly", priority: 0.8 }),
    );
    (news || []).forEach((n) => {
      // Canonical is the dated /YYYY/MM/DD/slug path, or the nested
      // /world/<region>/<country>/... permalink for world-tagged news (see
      // newsArticleHref in article-url.ts) — the bare-slug path used here
      // previously just 301s there, so Google was being pointed at a URL
      // that immediately redirects instead of the real one. Submitting the
      // flat path for a world-tagged article was the same problem one hop
      // shorter: that page self-redirects to the nested one too.
      if (n?.slug) entries.push({ loc: `${base}${newsArticleHref(n)}`, lastmod: n.publishedAt?.split("T")[0], changefreq: "daily", priority: 0.8 });
    });

    // Dedupe by URL.
    const seen = new Set<string>();
    const unique = entries.filter((e) => (seen.has(e.loc) ? false : (seen.add(e.loc), true)));
    logger.info(`Sitemap collected ${unique.length} URLs in ${Date.now() - start}ms`);
    return unique;
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
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""}${entry.changefreq ? `\n    <changefreq>${entry.changefreq}</changefreq>` : ""}${entry.priority != null ? `\n    <priority>${entry.priority.toFixed(1)}</priority>` : ""}
  </url>`,
      )
      .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>`;
  },

  /** Back-compat: full flat urlset (unused by the sharded routes). */
  async regenerateSitemap(): Promise<string> {
    return this.buildXml(await this.getEntries());
  },
};
