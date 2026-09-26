/**
 * @fileOverview Global LEN search — one index spanning every pillar
 * (Articles, People, Movies/TV/Music, Sports, Legal Cases/Courts, Topics)
 * instead of the article-only `/api/search` this replaces. Every result
 * carries a `type` so the UI can label it and filter by it, and a real
 * `url` so a result always links straight to that entity's actual page.
 *
 * Reuses `scoreArticle`'s tokenized/fuzzy scorer for every kind of result
 * (title + description stand in for title + summary) so relevance behaves
 * identically across pillars — no separate scoring rule per entity type.
 */

import { getAllArticles, type LawArticle } from '@/data/law-content';
import { cmsGetArticles } from '@/lib/cms';
import { scoreArticle } from '@/lib/search-score';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';
import { getMergedPeople } from '@/lib/people-server';
import { personCategoryLabel } from '@/types/person';
import { personUrl } from '@/lib/person-url';
import { getMergedEntertainmentEntities } from '@/lib/entertainment-server';
import { entertainmentTypeLabel } from '@/types/entertainment';
import { entertainmentUrl } from '@/lib/entertainment-url';
import { getMergedLegalCases, getMergedCourts } from '@/lib/legal-server';
import { legalCaseUrl, courtUrl } from '@/lib/legal-case-url';
import { getMergedSportsTeams, getMergedSportsCompetitions } from '@/lib/sports-server';
import { teamUrl, competitionUrl } from '@/lib/sports-url';
import { getMergedTopics } from '@/lib/topics-server';
import { topicUrl } from '@/lib/topic-url';
import { articleUrl } from '@/lib/article-url';

export const SEARCH_RESULT_TYPES = [
  { slug: 'article', label: 'Articles' },
  { slug: 'person', label: 'People' },
  { slug: 'movie', label: 'Movies' },
  { slug: 'tv-show', label: 'TV Shows' },
  { slug: 'streaming-show', label: 'Streaming' },
  { slug: 'music-release', label: 'Music' },
  { slug: 'album', label: 'Music' },
  { slug: 'song', label: 'Music' },
  { slug: 'award', label: 'Awards' },
  { slug: 'event', label: 'Events' },
  { slug: 'sports-team', label: 'Teams' },
  { slug: 'sports-competition', label: 'Competitions' },
  { slug: 'legal-case', label: 'Cases' },
  { slug: 'court', label: 'Courts' },
  { slug: 'topic', label: 'Topics' },
] as const;

export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number]['slug'];

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  /** Short human-readable context — category, court level, sport, etc. */
  subtitle?: string;
  url: string;
  score: number;
  views?: number;
}

// Same AdSense-readiness rule the article-only search already applied: never
// surface a retired category's article, even by relevance match.
const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
function isKeptCategoryArticle(a: { category?: { slug?: string } }): boolean {
  const rawSlug = a.category?.slug;
  return !rawSlug || currentSlugSet.has(toNewCategorySlug(rawSlug));
}

async function getSearchableArticles(): Promise<LawArticle[]> {
  const bundled = getAllArticles();
  const cms = await cmsGetArticles().catch(() => []);
  const bySlug = new Map<string, LawArticle>();
  bundled.forEach((a) => bySlug.set(a.slug, a));
  cms.forEach((c) => {
    bySlug.set(c.slug, {
      id: c.id,
      title: c.title,
      slug: c.slug,
      alphabet: c.alphabet,
      categoryId: c.category?.slug ?? '',
      subcategoryId: '',
      category: { id: c.category?.slug ?? '', name: c.category?.name ?? '', slug: c.category?.slug ?? '' },
      subcategory: { id: '', name: '', slug: '' },
      summary: c.excerpt ?? '',
      content: c.content,
      author: c.author ?? 'Law Elite Editorial',
      updatedAt: c.updatedAt ?? '',
      readingTime: Number(c.readingTime) || 0,
      views: c.views ?? 0,
      featured: !!c.featured,
      imageSeed: c.slug,
      featuredImage: c.featuredImage,
    });
  });
  return Array.from(bySlug.values()).filter(isKeptCategoryArticle);
}

/**
 * Builds every searchable item across every pillar, unscored. Cheap enough
 * to run per-request today (bundled arrays + one CMS fetch) — the same
 * assumption every other `*-server.ts` merge layer in this codebase makes
 * until a real CMS table exists for these entities.
 */
async function buildSearchCorpus(): Promise<Array<{ item: Omit<SearchResultItem, 'score'>; title: string; description: string; views: number }>> {
  const corpus: Array<{ item: Omit<SearchResultItem, 'score'>; title: string; description: string; views: number }> = [];

  const articles = await getSearchableArticles();
  articles.forEach((a) => {
    corpus.push({
      item: { id: `article:${a.slug}`, type: 'article', title: a.title, subtitle: a.category?.name, url: articleUrl(a) },
      title: a.title,
      description: a.summary || '',
      views: a.views || 0,
    });
  });

  (await getMergedPeople()).forEach((p) => {
    corpus.push({
      item: { id: `person:${p.slug}`, type: 'person', title: p.displayName || p.fullName, subtitle: personCategoryLabel(p.category), url: personUrl(p.slug) },
      title: p.displayName || p.fullName,
      description: p.biography || '',
      views: 0,
    });
  });

  (await getMergedEntertainmentEntities()).forEach((e) => {
    corpus.push({
      item: { id: `entertainment:${e.slug}`, type: e.type, title: e.title, subtitle: entertainmentTypeLabel(e.type), url: entertainmentUrl(e.slug) },
      title: e.title,
      description: e.description || '',
      views: 0,
    });
  });

  (await getMergedLegalCases()).forEach((c) => {
    corpus.push({
      item: { id: `legal-case:${c.slug}`, type: 'legal-case', title: c.caseName, subtitle: 'Legal Case', url: legalCaseUrl(c.slug) },
      title: c.caseName,
      description: c.summary || '',
      views: 0,
    });
  });

  (await getMergedCourts()).forEach((c) => {
    corpus.push({
      item: { id: `court:${c.slug}`, type: 'court', title: c.name, subtitle: c.level, url: courtUrl(c.slug) },
      title: c.name,
      description: c.description || '',
      views: 0,
    });
  });

  (await getMergedSportsTeams()).forEach((t) => {
    corpus.push({
      item: { id: `sports-team:${t.slug}`, type: 'sports-team', title: t.name, subtitle: t.sport, url: teamUrl(t.slug) },
      title: t.name,
      description: t.description || '',
      views: 0,
    });
  });

  (await getMergedSportsCompetitions()).forEach((c) => {
    corpus.push({
      item: { id: `sports-competition:${c.slug}`, type: 'sports-competition', title: c.name, subtitle: c.sport, url: competitionUrl(c.slug) },
      title: c.name,
      description: c.description || '',
      views: 0,
    });
  });

  (await getMergedTopics()).forEach((t) => {
    corpus.push({
      item: { id: `topic:${t.slug}`, type: 'topic', title: t.name, subtitle: 'Topic', url: topicUrl(t.slug) },
      title: t.name,
      description: '',
      views: 0,
    });
  });

  return corpus;
}

/** Every query token must match somewhere across every entity type -- same AND semantics as scoreArticle, just reused generically. */
export async function searchAll(query: string, opts: { limit?: number; types?: SearchResultType[] } = {}): Promise<SearchResultItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const { limit = 50, types } = opts;
  const typeSet = types && types.length > 0 ? new Set(types) : null;

  const corpus = await buildSearchCorpus();
  const results: SearchResultItem[] = [];
  for (const entry of corpus) {
    if (typeSet && !typeSet.has(entry.item.type)) continue;
    const score = scoreArticle(entry.title, entry.description, entry.views, q);
    if (score > 0) results.push({ ...entry.item, score, views: entry.views });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
