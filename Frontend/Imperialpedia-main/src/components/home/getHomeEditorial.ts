import { articleArtDataUri } from "@baalvion/illustrations";
import { getArticles } from "@/modules/content-engine/services/content-service";
import { getArticlesByCategorySlug } from "@/modules/content-engine/services/category-service";
import type { Article as ContentArticle } from "@/modules/content-engine/types/article";
import { getPublicCategoryBySlug, getCategoryDirectory } from "@/services/data/cms-public";
import { newsArticleHref } from "@/lib/data/article-url";
import { isRemovedArticlePath } from "@/lib/content/removed-article-paths";
import type { Article as LandingArticle, TopicGroup } from "@/components/landing/investopedia/types";

// cms-service caps page size at 100 server-side regardless of what's
// requested (see getArticleCategoryMap's comment in cms-public.ts), so 100
// is the real ceiling for a single fetch, not an arbitrary choice. Raised
// from 30: at 30, the pool was ~90% Stocks (see MAX_PER_CATEGORY_IN_GENERIC_POOL
// above), leaving too few other-category articles for the diversity cap to
// have anything to draw from.
const FETCH_LIMIT = 100;
const RELATED_PER_LEAD = 3;
const OTHER_TOP_STORIES_COUNT = 6;
const MAX_TOPIC_GROUPS = 6;
const ARTICLES_PER_TOPIC = 4;
const LATEST_ARTICLES_COUNT = 4;
const PERSONAL_FINANCE_SECONDARY_COUNT = 4;
const PERSONAL_FINANCE_POPULAR_COUNT = 6;
const POPULAR_READS_COUNT = 8;
// The site has 50+ real categories, but a handful (Stocks especially)
// publish far more frequently than the rest — 83 of 477 published articles
// are Stocks, and Stocks made up 70 of the most recent 100. Without a cap,
// every recency-sorted generic slot (Other Top Stories, Latest Articles)
// fills entirely with one category and the other ~55 never get a look in.
const MAX_PER_CATEGORY_IN_GENERIC_POOL = 2;
// Minimum real depth a category needs to earn its own topic-section row —
// keeps a category with 2 articles from getting the same billing as one
// with 20, without hardcoding which categories "count."
const MIN_ARTICLES_FOR_TOPIC_GROUP = 4;

// "Personal Finance" gets its own richer spotlight section (lead + secondary
// cards + a "Popular" list) instead of a generic 4-card topic row, so it's
// pulled out of the generic topicGroups candidate pool below. "Imperialpedia
// Talks" is a video-teaser column (see ImperialpediaTalks.tsx) — excluded
// from the whole generic pool so a Talks piece never surfaces as a plain
// text lead/related/other-top-story link without its video treatment.
const PERSONAL_FINANCE_CATEGORY = "personal finance";
const TALKS_CATEGORY = "imperialpedia talks";

// Known real category names → their dedicated hub route, so a topic
// section's "More" link lands on a real page instead of a generic listing.
// Anything unmapped falls back to /<categorySlug> (the real per-category
// hub every published category already gets) and finally /financial-intelligence.
const CATEGORY_HREF_MAP: Record<string, string> = {
  investing: "/investing",
  economy: "/economy",
  "personal finance": "/personal-finance",
  markets: "/market-news",
  "market news": "/market-news",
};

function topicHref(categoryName: string, categorySlug?: string): string {
  const known = CATEGORY_HREF_MAP[categoryName.trim().toLowerCase()];
  if (known) return known;
  return categorySlug ? `/${categorySlug}` : "/financial-intelligence";
}

function toLandingArticle(article: ContentArticle): LandingArticle {
  return {
    title: article.title,
    href: newsArticleHref({
      slug: article.slug,
      publishedAt: article.publishedAt || article.updatedAt,
      contentType: article.contentType,
      categorySlug: article.categorySlug,
    }),
    category: article.category,
    dek: article.description || undefined,
    image:
      article.featuredImage ||
      articleArtDataUri({ title: article.title, category: article.category, seed: article.slug }),
    author: article.authorName,
  };
}

export interface HomeEditorial {
  lead: LandingArticle;
  /** Same-category articles related to `lead` — omitted (not padded with unrelated ones) when there aren't any. */
  leadRelated: LandingArticle[];
  /** Second hero story, Investopedia-style two-up header — absent when the CMS has only one article. */
  secondaryLead: LandingArticle | null;
  secondaryLeadRelated: LandingArticle[];
  /** Headline-only list below the two leads, no images — Investopedia's "Other Top Stories". */
  otherTopStories: LandingArticle[];
  topicGroups: TopicGroup[];
  /** Next freshest articles not already used above — feeds the "Latest Articles" rail so it never repeats the lead/topic picks. */
  latestArticles: LandingArticle[];
  /** Dedicated "Personal Finance" spotlight (lead + secondary cards + a headline-only "Popular" list) — absent when the category has no published articles. */
  personalFinance: PersonalFinanceSpotlight | null;
  /** Headline-only "Popular Reads" rail — whatever's left after every section above has taken its picks, so it never repeats a headline already shown on the page. */
  popularReads: LandingArticle[];
}

export interface PersonalFinanceSpotlight {
  lead: LandingArticle;
  secondary: LandingArticle[];
  popular: LandingArticle[];
}

/**
 * Real, CMS-backed replacement for the old hardcoded LEAD_STORY/TOP_STORIES/
 * TOPIC_GROUPS mock content (see git history of `landing/investopedia/content.ts`)
 * — that file's own comment admitted it was a stand-in "until a CMS/API feed is
 * wired." Follows the same real-data pattern already proven by `LatestArticles.tsx`:
 * `getArticles()` already resolves each article's image to a real uploaded photo
 * when set, falling back to generated editorial art otherwise (see
 * `cmsContentToArticle` in `services/data/cms-public.ts`).
 *
 * Returns null when the CMS has no published articles yet, so the caller can
 * render nothing rather than fall back to fake content.
 */
export async function getHomeEditorial(): Promise<HomeEditorial | null> {
  const { data: fetchedArticles } = await getArticles(1, FETCH_LIMIT);
  const articles = fetchedArticles.filter(
    (a) => (a.category || "").trim().toLowerCase() !== TALKS_CATEGORY && !isRemovedArticlePath(a),
  );
  if (articles.length === 0) return null;

  const used = new Set<string>();
  const take = (from: ContentArticle[]) => from.find((a) => !used.has(a.slug));
  const takeRelated = (category: string | undefined, count: number, pool: ContentArticle[]) => {
    if (!category) return [] as ContentArticle[];
    const picked: ContentArticle[] = [];
    for (const a of pool) {
      if (picked.length >= count) break;
      if (used.has(a.slug) || a.category !== category) continue;
      picked.push(a);
      used.add(a.slug);
    }
    return picked;
  };

  const leadSource = take(articles);
  if (!leadSource) return null;
  used.add(leadSource.slug);

  const leadRelatedSource = takeRelated(leadSource.category, RELATED_PER_LEAD, articles);

  const secondaryLeadSource = take(articles);
  if (secondaryLeadSource) used.add(secondaryLeadSource.slug);

  const secondaryLeadRelatedSource = secondaryLeadSource
    ? takeRelated(secondaryLeadSource.category, RELATED_PER_LEAD, articles)
    : [];

  const otherTopStoriesSource: ContentArticle[] = [];
  const otherTopStoriesCategoryCounts = new Map<string, number>();
  for (const a of articles) {
    if (otherTopStoriesSource.length >= OTHER_TOP_STORIES_COUNT) break;
    if (used.has(a.slug)) continue;
    const key = a.category || "General";
    const countSoFar = otherTopStoriesCategoryCounts.get(key) || 0;
    if (countSoFar >= MAX_PER_CATEGORY_IN_GENERIC_POOL) continue;
    otherTopStoriesSource.push(a);
    otherTopStoriesCategoryCounts.set(key, countSoFar + 1);
    used.add(a.slug);
  }

  // Topic sections are picked from the real, full category directory (every
  // published article, not just the 30 most recent) so a category that
  // simply hasn't published this week still gets a fair shot at a row —
  // see getCategoryDirectory's own comment for why the narrow recency pool
  // alone can't answer "what does this site actually cover."
  const directory = await getCategoryDirectory();
  const topicCategorySlugs = directory
    .filter((c) => c.articleCount >= MIN_ARTICLES_FOR_TOPIC_GROUP)
    .filter((c) => c.name.trim().toLowerCase() !== PERSONAL_FINANCE_CATEGORY)
    .filter((c) => c.name.trim().toLowerCase() !== TALKS_CATEGORY)
    .slice(0, MAX_TOPIC_GROUPS);

  const topicGroupResults = await Promise.all(
    topicCategorySlugs.map(async (entry): Promise<TopicGroup | null> => {
      const [{ data: categoryArticles }, category] = await Promise.all([
        getArticlesByCategorySlug(entry.slug),
        getPublicCategoryBySlug(entry.slug),
      ]);
      const groupArticles = categoryArticles
        .filter((a) => !used.has(a.slug) && !isRemovedArticlePath(a))
        .slice(0, ARTICLES_PER_TOPIC);
      if (groupArticles.length === 0) return null;
      for (const a of groupArticles) used.add(a.slug);
      return {
        title: entry.name,
        href: topicHref(entry.name, entry.slug),
        categoryImage: category?.imageUrl || undefined,
        articles: groupArticles.map(toLandingArticle),
      };
    }),
  );
  const topicGroups = topicGroupResults.filter((g): g is TopicGroup => g !== null);

  // Dedicated Personal Finance spotlight — fetched separately (up to 100 real
  // published pieces via getArticlesByCategory) rather than sliced from the
  // 30-article generic pool, so the section reflects the category's real
  // depth instead of whatever happened to be recent across every category.
  const { data: personalFinanceArticles } = await getArticlesByCategorySlug("personal-finance");
  const pfCandidates = personalFinanceArticles.filter((a) => !used.has(a.slug) && !isRemovedArticlePath(a));
  const pfLeadSource = pfCandidates[0];
  let personalFinance: PersonalFinanceSpotlight | null = null;
  if (pfLeadSource) {
    used.add(pfLeadSource.slug);
    const pfSecondarySource = pfCandidates
      .slice(1)
      .filter((a) => !used.has(a.slug))
      .slice(0, PERSONAL_FINANCE_SECONDARY_COUNT);
    for (const a of pfSecondarySource) used.add(a.slug);
    const pfPopularSource = pfCandidates
      .filter((a) => !used.has(a.slug))
      .slice(0, PERSONAL_FINANCE_POPULAR_COUNT);
    for (const a of pfPopularSource) used.add(a.slug);
    personalFinance = {
      lead: toLandingArticle(pfLeadSource),
      secondary: pfSecondarySource.map(toLandingArticle),
      popular: pfPopularSource.map(toLandingArticle),
    };
  }

  const latestArticlesSource: ContentArticle[] = [];
  const latestArticlesCategoryCounts = new Map<string, number>();
  for (const a of articles) {
    if (latestArticlesSource.length >= LATEST_ARTICLES_COUNT) break;
    if (used.has(a.slug)) continue;
    const key = a.category || "General";
    const countSoFar = latestArticlesCategoryCounts.get(key) || 0;
    if (countSoFar >= MAX_PER_CATEGORY_IN_GENERIC_POOL) continue;
    latestArticlesSource.push(a);
    latestArticlesCategoryCounts.set(key, countSoFar + 1);
    used.add(a.slug);
  }

  const popularReadsSource = articles.filter((a) => !used.has(a.slug)).slice(0, POPULAR_READS_COUNT);

  return {
    lead: toLandingArticle(leadSource),
    leadRelated: leadRelatedSource.map(toLandingArticle),
    secondaryLead: secondaryLeadSource ? toLandingArticle(secondaryLeadSource) : null,
    secondaryLeadRelated: secondaryLeadRelatedSource.map(toLandingArticle),
    otherTopStories: otherTopStoriesSource.map(toLandingArticle),
    topicGroups,
    latestArticles: latestArticlesSource.map(toLandingArticle),
    personalFinance,
    popularReads: popularReadsSource.map(toLandingArticle),
  };
}
