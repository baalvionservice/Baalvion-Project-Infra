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
 * @fileOverview Service for generating and monitoring a comprehensive XML sitemap index.
 * Engineered to support the discovery of 1,000,000+ programmatic nodes.
 */

interface SitemapEntry {
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

export const sitemapService = {
  /**
   * Regenerates the main sitemap.xml index.
   */
  async regenerateSitemap(): Promise<string> {
    const start = Date.now();
    const baseUrl = env.siteUrl.endsWith("/")
      ? env.siteUrl.slice(0, -1)
      : env.siteUrl;
    const entries: SitemapEntry[] = [];

    try {
      // 1. Static Public Pages (every indexable, crawlable route)
      const corePages = ["", "/glossary", "/about","/advisor-reviews","/ai-analyst","/ai-analyst/asset-summary","/ai-analyst/automated-recap","/ai-analyst/bear-case","/ai-analyst/bull-case","/ai-analyst/catalyst-detection","/ai-analyst/compare","/ai-analyst/daily-briefing","/ai-analyst/earnings-summary","/ai-analyst/event-intelligence","/ai-analyst/macro-summary","/ai-analyst/model-performance","/ai-analyst/multi-compare","/ai-analyst/news-summary","/ai-analyst/risk-detection","/ai-analyst/scenario-modeling","/ai-analyst/sector-overview","/ai-analyst/social-sentiment","/ai-analyst/trend-explanation","/ai-analyst/weekly-digest","/app-reviews","/articles","/auto-loans","/bank-reviews","/banking","/banking-reviews","/bonds","/broker-reviews","/brokers","/budgeting","/budgeting-apps","/calendar","/cd-rates","/checking","/commodities","/community","/community/contests","/community/debates","/community/discussions","/community/leaderboard","/community/rankings","/community/reputation","/community/sentiment","/companies","/company-news","/contact","/countries","/creators","/creators/leaderboards","/creators/profile","/creators/trust","/credit","/credit-card-reviews","/credit-cards","/crypto","/cryptocurrency","/datasets","/debt","/earnings","/economy","/emergency-fund","/estate-planning","/etfs","/explore","/fed","/financial-calculators","/financial-tools","/fiscal-policy","/gdp","/global","/government","/imperialpedia-review-board","/income","/indicators","/industries","/inflation","/insurance","/insurance-reviews","/interest-rates","/investing","/knowledge-map","/latest","/learning-paths","/live-market-news","/loan-reviews","/loans","/market","/market-news","/monetary-policy","/money-market","/mortgages","/mutual-funds","/news","/options","/personal-finance","/planning","/politics","/pricing","/privacy-policy","/real-estate","/research-ai","/retirement","/reviews","/robo-advisors","/savings","/stocks","/student-loans","/tax-software","/taxes","/technologies","/terms-of-service","/topics","/transparency","/unemployment","/world"];
      corePages.forEach((path) => {
        entries.push({
          loc: `${baseUrl}${path}`,
          lastmod: new Date().toISOString().split("T")[0],
          changefreq: path === "" ? "daily" : "weekly",
          priority: path === "" ? 1.0 : 0.7,
        });
      });

      // 2. Fetch Dynamic Node IDs in Parallel
      const [articlesRes, glossaryRes, calcRes, catRes, tagRes] =
        await Promise.all([
          articlesService.getArticles(1, 1000),
          glossaryService.getTerms(1, 1000),
          calculatorsService.getCalculatorList(),
          getCategories(),
          getTags(),
        ]);

      // 3. Process Articles
      articlesRes.data.forEach((article) => {
        entries.push({
          loc: `${baseUrl}/articles/${article.slug}`,
          lastmod:
            article.publishedAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          changefreq: "weekly",
          priority: 0.8,
        });
      });

      // 4. Process Glossary Terms & A-Z Hubs
      glossaryRes.data.forEach((term) => {
        // Generate the letter for the new URL structure
        const firstChar = term.term.charAt(0).toLowerCase();
        const letter = /^[0-9]/.test(firstChar) ? "num" : firstChar;

        entries.push({
          loc: `${baseUrl}/terms/${letter}/${term.slug}`,
          lastmod: new Date().toISOString().split("T")[0],
          changefreq: "monthly",
          priority: 0.7,
        });
      });

      "abcdefghijklmnopqrstuvwxyz".split("").forEach((letter) => {
        entries.push({
          loc: `${baseUrl}/glossary/${letter}`,
          changefreq: "weekly",
          priority: 0.5,
        });
      });

      // 5. Process Calculators
      calcRes.data.forEach((calc) => {
        entries.push({
          loc: `${baseUrl}/financial-tools/${calc.slug}`,
          changefreq: "monthly",
          priority: 0.9,
        });
      });

      // 6. Process Taxonomy Hubs
      catRes.data.forEach((cat) => {
        entries.push({
          loc: `${baseUrl}/categories/${cat.slug}`,
          changefreq: "weekly",
          priority: 0.6,
        });
      });

      tagRes.data.forEach((tag) => {
        entries.push({
          loc: `${baseUrl}/tags/${tag.slug}`,
          changefreq: "weekly",
          priority: 0.6,
        });
      });

      // 7. Structured entities + review guides + news (live from imperialpedia-service / CMS).
      //    Resilient: a backend hiccup must not break the whole sitemap.
      try {
        const [companies, countries, industries, technologies, news] = await Promise.all([
          loadCompanies(),
          loadCountries(),
          loadIndustries(),
          loadTechnologies(),
          getPublishedNews(1000),
        ]);
        const pushEntities = (
          items: Array<{ slug?: string }>,
          prefix: string,
          priority = 0.7
        ) =>
          (items || []).forEach((e) => {
            if (e?.slug) entries.push({ loc: `${baseUrl}${prefix}/${e.slug}`, changefreq: "weekly", priority });
          });
        pushEntities(companies, "/companies", 0.8);
        pushEntities(countries, "/countries");
        pushEntities(industries, "/industries");
        pushEntities(technologies, "/technologies");
        // Review guides live at the root slug (e.g. /best-online-brokers)
        reviewSlugs.forEach((slug) =>
          entries.push({ loc: `${baseUrl}/${slug}`, changefreq: "weekly", priority: 0.8 })
        );
        // Published news also live at the root slug
        (news || []).forEach((n) => {
          if (n?.slug) entries.push({ loc: `${baseUrl}/${n.slug}`, lastmod: n.publishedAt?.split("T")[0], changefreq: "daily", priority: 0.8 });
        });
      } catch {
        /* backend unavailable — static + article/glossary entries still ship */
      }

      // Dedupe by URL (sections can overlap, e.g. a slug listed in two sources).
      const seenLoc = new Set<string>();
      const uniqueEntries = entries.filter((e) => (seenLoc.has(e.loc) ? false : (seenLoc.add(e.loc), true)));

      const xml = this.buildXml(uniqueEntries);
      const duration = Date.now() - start;

      logger.info(
        `Sitemap index regenerated in ${duration}ms. Nodes indexed: ${uniqueEntries.length}`
      );

      return xml;
    } catch (error) {
      logger.error("Failed to regenerate sitemap index", error);
      throw error;
    }
  },

  /**
   * Wraps entries in the standard sitemap XML structure.
   */
  buildXml(entries: SitemapEntry[]): string {
    const xmlEntries = entries
      .map(
        (entry) => `
  <url>
    <loc>${entry.loc}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ""}
    ${entry.priority ? `<priority>${entry.priority.toFixed(1)}</priority>` : ""}
  </url>`
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`.trim();
  },
};
