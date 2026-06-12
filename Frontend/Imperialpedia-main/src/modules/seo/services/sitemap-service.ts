import {
  articlesService,
  glossaryService,
  calculatorsService,
} from "@/services/data";
import { getTags } from "@/modules/content-engine/services/tag-service";
import { getCategories } from "@/modules/content-engine/services/category-service";
import { loadCompanies, loadCountries, loadIndustries, loadTechnologies } from "@/lib/data/loaders";
import { reviewSlugs } from "@/lib/data/review-live";
import { getPublishedNews } from "@/services/data/cms-public";
import { env } from "@/config/env";
import { logger } from "@/lib/errors/logger";

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
    const corePages = ["", "/glossary", "/about","/advisor-reviews","/ai-analyst","/ai-analyst/asset-summary","/ai-analyst/automated-recap","/ai-analyst/bear-case","/ai-analyst/bull-case","/ai-analyst/catalyst-detection","/ai-analyst/compare","/ai-analyst/daily-briefing","/ai-analyst/earnings-summary","/ai-analyst/event-intelligence","/ai-analyst/macro-summary","/ai-analyst/model-performance","/ai-analyst/multi-compare","/ai-analyst/news-summary","/ai-analyst/risk-detection","/ai-analyst/scenario-modeling","/ai-analyst/sector-overview","/ai-analyst/social-sentiment","/ai-analyst/trend-explanation","/ai-analyst/weekly-digest","/app-reviews","/articles","/auto-loans","/bank-reviews","/banking","/banking-reviews","/bonds","/broker-reviews","/brokers","/budgeting","/budgeting-apps","/calendar","/cd-rates","/checking","/commodities","/community","/community/contests","/community/debates","/community/discussions","/community/leaderboard","/community/rankings","/community/reputation","/community/sentiment","/companies","/company-news","/contact","/countries","/creators","/creators/leaderboards","/creators/profile","/creators/trust","/credit","/credit-card-reviews","/credit-cards","/crypto","/cryptocurrency","/datasets","/debt","/earnings","/economy","/emergency-fund","/estate-planning","/etfs","/explore","/fed","/financial-calculators","/financial-tools","/fiscal-policy","/gdp","/global","/government","/imperialpedia-review-board","/income","/indicators","/industries","/inflation","/insurance","/insurance-reviews","/interest-rates","/investing","/knowledge-map","/latest","/learning-paths","/live-market-news","/loan-reviews","/loans","/market","/market-news","/monetary-policy","/money-market","/mortgages","/mutual-funds","/news","/options","/personal-finance","/planning","/politics","/pricing","/privacy-policy","/real-estate","/research-ai","/retirement","/reviews","/robo-advisors","/savings","/stocks","/student-loans","/tax-software","/taxes","/technologies","/terms","/terms-of-service","/topics","/transparency","/unemployment","/world","/world/us","/world/europe","/world/asia","/world/china","/world/emerging"];
    corePages.forEach((path) => {
      entries.push({
        loc: `${base}${path}`,
        lastmod: today,
        changefreq: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.7,
      });
    });

    // A–Z dictionary hubs (Investopedia-style listing pages).
    ["num", ..."abcdefghijklmnopqrstuvwxyz".split("")].forEach((l) => {
      entries.push({ loc: `${base}/terms-beginning-with-${l}`, changefreq: "weekly", priority: 0.5 });
    });

    // 2. Dynamic node IDs in parallel (each resilient to backend hiccups).
    const safe = async <T>(p: Promise<T>, fb: T): Promise<T> => {
      try { return await p; } catch { return fb; }
    };
    const listSafe = async <T>(p: Promise<{ data: T[] }>): Promise<T[]> => {
      try { return (await p).data ?? []; } catch { return []; }
    };
    const [articles, glossary, calcs, cats, tags] = await Promise.all([
      listSafe(articlesService.getArticles(1, 1000)),
      listSafe(glossaryService.getTerms(1, 1000)),
      listSafe(calculatorsService.getCalculatorList()),
      listSafe(getCategories()),
      listSafe(getTags()),
    ]);

    articles.forEach((article) => {
      entries.push({
        loc: `${base}/articles/${article.slug}`,
        lastmod: article.publishedAt?.split("T")[0] || today,
        changefreq: "weekly",
        priority: 0.8,
      });
    });

    glossary.forEach((term) => {
      const firstChar = term.term.charAt(0).toLowerCase();
      const letter = /^[0-9]/.test(firstChar) ? "num" : firstChar;
      entries.push({
        loc: `${base}/terms/${letter}/${term.slug}`,
        lastmod: today,
        changefreq: "monthly",
        priority: 0.7,
      });
    });

    calcs.forEach((calc) => {
      entries.push({ loc: `${base}/financial-tools/${calc.slug}`, changefreq: "monthly", priority: 0.9 });
    });

    cats.forEach((cat) => {
      entries.push({ loc: `${base}/categories/${cat.slug}`, changefreq: "weekly", priority: 0.6 });
    });

    tags.forEach((tag) => {
      entries.push({ loc: `${base}/tags/${tag.slug}`, changefreq: "weekly", priority: 0.6 });
    });

    // 3. Structured entities + review guides + published news.
    const [companies, countries, industries, technologies, news] = await Promise.all([
      safe(loadCompanies(), []),
      safe(loadCountries(), []),
      safe(loadIndustries(), []),
      safe(loadTechnologies(), []),
      safe(getPublishedNews(1000), []),
    ]);
    const pushEntities = (items: Array<{ slug?: string }>, prefix: string, priority = 0.7) =>
      (items || []).forEach((e) => {
        if (e?.slug) entries.push({ loc: `${base}${prefix}/${e.slug}`, changefreq: "weekly", priority });
      });
    pushEntities(companies, "/companies", 0.8);
    pushEntities(countries, "/countries");
    pushEntities(industries, "/industries");
    pushEntities(technologies, "/technologies");
    (reviewSlugs || []).forEach((slug) =>
      entries.push({ loc: `${base}/${slug}`, changefreq: "weekly", priority: 0.8 }),
    );
    (news || []).forEach((n) => {
      if (n?.slug) entries.push({ loc: `${base}/${n.slug}`, lastmod: n.publishedAt?.split("T")[0], changefreq: "daily", priority: 0.8 });
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
