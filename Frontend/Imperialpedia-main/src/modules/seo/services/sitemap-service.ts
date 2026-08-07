import {
  articlesService,
  calculatorsService,
} from "@/services/data";
import { loadCompanies, loadCountries, loadTechnologies } from "@/lib/data/loaders";
import { fetchAllTerms } from "@/lib/data/term-live";
import { reviewSlugs } from "@/lib/data/review-live";
import { getPublishedNews } from "@/services/data/cms-public";
import { articleUrl } from "@/lib/data/article-url";
import { ALL_TRACKED_SYMBOLS } from "@/lib/data/marketsLoader";
import { env } from "@/config/env";
import { logger } from "@/lib/errors/logger";
import { GLOSSARY_LIVE } from "@/config/glossary";

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
    // "/taxes", "/insurance", "/government", "/politics", "/income", "/news",
    // "/latest" removed from this static list — those 7 currently have zero
    // published content (empty CategoryFeed/news hubs, ~40KB of template chrome
    // and nothing else), exactly the thin/low-value pattern AdSense flags. They're
    // submitted conditionally below, once real content actually exists for them —
    // same noindex-until-real-content treatment as each page's own generateMetadata
    // (see CategoryFeed.tsx's categoryHasLiveContent).
    const corePages = ["", "/about","/app-reviews","/financial-intelligence","/auto-loans","/banking","/banking-reviews","/bonds","/brokers","/budgeting","/budgeting-apps","/calendar","/cd-rates","/checking","/commodities","/companies","/contact","/countries","/credit","/credit-cards","/crypto","/cryptocurrency","/debt","/earnings","/economy","/emergency-fund","/etfs","/explore","/fed","/financial-calculators","/financial-tools","/financial-tools/compound-interest","/financial-tools/inflation","/financial-tools/investment","/financial-tools/loan","/fiscal-policy","/gdp","/global","/indicators","/inflation","/interest-rates","/investing","/knowledge-map","/live-market-news","/loan-reviews","/loans","/market-news","/monetary-policy","/money-market","/mortgages","/mutual-funds","/options","/personal-finance","/planning","/privacy-policy","/real-estate","/retirement","/reviews","/savings","/stocks","/student-loans","/tax-software","/technologies","/terms-of-service","/transparency","/unemployment","/world","/world/us","/world/europe","/world/asia","/world/china","/world/emerging"];
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

    articles.forEach((article) => {
      const path = article.categorySlug ? `/${article.categorySlug}/${article.slug}` : `/financial-intelligence/${article.slug}`;
      entries.push({
        loc: `${base}${path}`,
        lastmod: article.publishedAt?.split("T")[0] || today,
        changefreq: "weekly",
        priority: 0.8,
      });
    });

    // Topic hubs that are empty right now (see the corePages comment above) —
    // submit the hub itself only once it actually has a published article, so
    // Google is never handed an empty CategoryFeed page. Derived from the same
    // `articles` list just walked above, so this needs no extra fetch and picks
    // up new content the moment it's published — no code change or redeploy.
    const categorySlugsWithArticles = new Set(articles.map((a) => a.categorySlug).filter(Boolean));
    (["taxes", "insurance", "government", "politics", "income"] as const).forEach((slug) => {
      if (categorySlugsWithArticles.has(slug)) {
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

    // 3. Structured entities + review guides + published news.
    const [companies, countries, technologies, news] = await Promise.all([
      safe(loadCompanies(), []),
      safe(loadCountries(), []),
      safe(loadTechnologies(), []),
      safe(getPublishedNews(1000), []),
    ]);
    const pushEntities = (items: Array<{ slug?: string }>, prefix: string, priority = 0.7) =>
      (items || []).forEach((e) => {
        if (e?.slug) entries.push({ loc: `${base}${prefix}/${e.slug}`, changefreq: "weekly", priority });
      });
    pushEntities(companies, "/companies", 0.8);
    pushEntities(countries, "/countries");
    pushEntities(technologies, "/technologies");

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
    // Excluded: regional composite placeholders (CHINA, EM) and Treasury
    // yield series with no individual quote source (only DGS10 has a Yahoo
    // fallback via ^TNX in worldFeed.ts's CANONICAL_SYMBOL_MAP — DGS2/DGS30/
    // DGS3MO have neither an imperialpedia-service row nor a Yahoo mapping)
    // — verified live as the only 6 real, reproducible 404s in a 386-URL
    // sitemap crawl. They stay in MARKET_GROUPS/ALL_TRACKED_SYMBOLS for the
    // breakdown-panel and pre-render use cases; only sitemap submission
    // (i.e., what Google is told to index) excludes them.
    const QUOTE_PAGE_UNSUPPORTED = new Set(["CHINA", "EM", "DGS2", "DGS30", "DGS3MO"]);
    ALL_TRACKED_SYMBOLS.filter((symbol) => !QUOTE_PAGE_UNSUPPORTED.has(symbol)).forEach((symbol) => {
      entries.push({ loc: `${base}/markets/quote/${symbol}`, changefreq: "hourly", priority: 0.7 });
    });
    (reviewSlugs || []).forEach((slug) =>
      entries.push({ loc: `${base}/${slug}`, changefreq: "weekly", priority: 0.8 }),
    );
    (news || []).forEach((n) => {
      // Canonical is the dated /YYYY/MM/DD/slug path (see article-url.ts) — the
      // bare-slug path used here previously just 301s there, so Google was being
      // pointed at a URL that immediately redirects instead of the real one.
      if (n?.slug) entries.push({ loc: `${base}${articleUrl(n.publishedAt, n.slug)}`, lastmod: n.publishedAt?.split("T")[0], changefreq: "daily", priority: 0.8 });
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
