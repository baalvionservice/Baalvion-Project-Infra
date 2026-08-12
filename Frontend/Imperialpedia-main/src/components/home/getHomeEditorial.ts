import { getArticles } from "@/modules/content-engine/services/content-service";
import type { Article as ContentArticle } from "@/modules/content-engine/types/article";
import { getPublicCategoryBySlug } from "@/services/data/cms-public";
import { newsArticleHref } from "@/lib/data/article-url";
import type { Article as LandingArticle, TopicGroup } from "@/components/landing/investopedia/types";

const FETCH_LIMIT = 30;
const RELATED_PER_LEAD = 3;
const OTHER_TOP_STORIES_COUNT = 6;
const MAX_TOPIC_GROUPS = 4;
const ARTICLES_PER_TOPIC = 4;

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
    image: article.featuredImage,
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
  const { data: articles } = await getArticles(1, FETCH_LIMIT);
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
  for (const a of articles) {
    if (otherTopStoriesSource.length >= OTHER_TOP_STORIES_COUNT) break;
    if (used.has(a.slug)) continue;
    otherTopStoriesSource.push(a);
    used.add(a.slug);
  }

  const remaining = articles.filter((a) => !used.has(a.slug));

  const byCategory = new Map<string, ContentArticle[]>();
  for (const article of remaining) {
    const key = article.category || "General";
    const bucket = byCategory.get(key);
    if (bucket) bucket.push(article);
    else byCategory.set(key, [article]);
  }

  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, MAX_TOPIC_GROUPS);

  const topicGroups = await Promise.all(
    topCategories.map(async ([categoryName, categoryArticles]): Promise<TopicGroup> => {
      const categorySlug = categoryArticles[0]?.categorySlug;
      const category = categorySlug ? await getPublicCategoryBySlug(categorySlug) : null;
      return {
        title: categoryName,
        href: topicHref(categoryName, categorySlug),
        categoryImage: category?.imageUrl || undefined,
        articles: categoryArticles.slice(0, ARTICLES_PER_TOPIC).map(toLandingArticle),
      };
    }),
  );

  return {
    lead: toLandingArticle(leadSource),
    leadRelated: leadRelatedSource.map(toLandingArticle),
    secondaryLead: secondaryLeadSource ? toLandingArticle(secondaryLeadSource) : null,
    secondaryLeadRelated: secondaryLeadRelatedSource.map(toLandingArticle),
    otherTopStories: otherTopStoriesSource.map(toLandingArticle),
    topicGroups,
  };
}
