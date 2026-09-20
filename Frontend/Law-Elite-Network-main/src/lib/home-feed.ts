import { getTaggedArticleIndex } from '@/lib/entity-articles';
import { getMergedPeople } from '@/lib/people-server';
import { getAllTopics } from '@/data/topics';
import { CMS_ONLY_CATEGORIES } from '@/lib/cms-only-categories';
import type { Person } from '@/types/person';
import type { Topic } from '@/data/topics';

type Article = any;

const ENTERTAINMENT_CATEGORY_SLUGS = Object.values(CMS_ONLY_CATEGORIES)
  .filter((c) => c.pillar === 'entertainment')
  .map((c) => c.slug);
const LEGAL_CATEGORY_SLUGS = Object.values(CMS_ONLY_CATEGORIES)
  .filter((c) => (c.pillar ?? 'legal') === 'legal')
  .map((c) => c.slug);

const BREAKING_WINDOW_MS = 24 * 60 * 60 * 1000;

const time = (a: Article) => Date.parse(a?.updatedAt || a?.publishedAt || '') || 0;
const newestFirst = (a: Article, b: Article) => time(b) - time(a);
const catSlug = (a: Article) => String(a?.category?.slug ?? a?.categorySlug ?? '');

export interface TrendingPerson {
  person: Person;
  articleCount: number;
}

export interface HomeFeed {
  breaking: Article[];
  latest: Article[];
  trending: Article[];
  celebrity: Article[];
  entertainment: Article[];
  sports: Article[];
  legal: Article[];
  featuredPeople: Person[];
  trendingPeople: TrendingPerson[];
  popularTopics: { topic: Topic; articleCount: number }[];
}

/**
 * Every homepage section is a rule over the live article pool and the entity
 * tags computed from it, so a newly published article lands in the right
 * places on its own. No section is padded: a rule with nothing to show
 * returns an empty list and the component renders nothing.
 *
 * Rules:
 *  - breaking: published within the last 24h. Empty most days, on purpose.
 *  - trending: most-viewed, real view counts only (zero-view articles excluded).
 *  - celebrity / entertainment / legal: by the category's pillar.
 *  - sports: no sports category exists, so an article counts when it names a
 *    team, a competition, or an athlete.
 *  - trending people / popular topics: ranked by how many published articles
 *    name them.
 *  - each article appears once per section; the section builders below also
 *    skip anything already shown higher on the page (`used`).
 */
export async function getHomeFeed(pool: Article[]): Promise<HomeFeed> {
  const [index, people] = await Promise.all([getTaggedArticleIndex(), getMergedPeople()]);
  const peopleBySlug = new Map(people.map((p) => [p.slug, p]));
  const poolSlugs = new Set(pool.map((a) => a.slug));

  const sorted = [...pool].filter((a) => a?.slug).sort(newestFirst);
  const used = new Set<string>();
  const take = (list: Article[], limit: number) => {
    const out: Article[] = [];
    for (const a of list) {
      if (out.length >= limit) break;
      if (used.has(a.slug)) continue;
      used.add(a.slug);
      out.push(a);
    }
    return out;
  };

  const now = Date.now();
  const breaking = take(sorted.filter((a) => time(a) && now - time(a) <= BREAKING_WINDOW_MS), 3);
  const latest = take(sorted, 8);

  const trending = take(
    [...sorted].filter((a) => (a.views || 0) > 0).sort((a, b) => (b.views || 0) - (a.views || 0)),
    5,
  );

  const celebrity = take(sorted.filter((a) => catSlug(a) === 'celebrity-news'), 4);
  const entertainment = take(
    sorted.filter((a) => ENTERTAINMENT_CATEGORY_SLUGS.includes(catSlug(a)) && catSlug(a) !== 'celebrity-news'),
    4,
  );
  const legal = take(sorted.filter((a) => LEGAL_CATEGORY_SLUGS.includes(catSlug(a))), 4);

  const isSportsTag = (e: { entityType: string; slug: string }) =>
    e.entityType === 'sports-team' ||
    e.entityType === 'sports-competition' ||
    (e.entityType === 'person' && peopleBySlug.get(e.slug)?.category === 'athletes');
  const sportsSlugs = new Set(
    index.filter(({ article, entities }) => poolSlugs.has(article.slug) && entities.some(isSportsTag)).map(({ article }) => article.slug),
  );
  const sports = take(sorted.filter((a) => sportsSlugs.has(a.slug)), 4);

  const personCounts = new Map<string, number>();
  const topicCounts = new Map<string, number>();
  index.forEach(({ article, entities }) => {
    if (!poolSlugs.has(article.slug)) return;
    entities.forEach((e) => {
      if (e.entityType === 'person') personCounts.set(e.slug, (personCounts.get(e.slug) || 0) + 1);
      if (e.entityType === 'topic') topicCounts.set(e.slug, (topicCounts.get(e.slug) || 0) + 1);
    });
  });

  const trendingPeople: TrendingPerson[] = [...personCounts.entries()]
    .filter(([slug]) => peopleBySlug.has(slug))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([slug, articleCount]) => ({ person: peopleBySlug.get(slug)!, articleCount }));

  const trendingSlugs = new Set(trendingPeople.map((t) => t.person.slug));
  const featuredPeople = people
    .filter((p) => !trendingSlugs.has(p.slug) && (p.featured || p.verification?.verified))
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .slice(0, 6);

  const popularTopics = getAllTopics()
    .map((topic) => ({ topic, articleCount: topicCounts.get(topic.slug) || 0 }))
    .filter((t) => t.articleCount > 0)
    .sort((a, b) => b.articleCount - a.articleCount || a.topic.name.localeCompare(b.topic.name))
    .slice(0, 12);

  return { breaking, latest, trending, celebrity, entertainment, sports, legal, featuredPeople, trendingPeople, popularTopics };
}
