import { getTaggedArticleIndex } from '@/lib/entity-articles';
import { getMergedPeople } from '@/lib/people-server';
import { getMergedLegalCases, getMergedCourts } from '@/lib/legal-server';
import { getMergedEntertainmentEntities } from '@/lib/entertainment-server';
import { getMergedSportsTeams, getMergedSportsCompetitions } from '@/lib/sports-server';
import { getMergedTopics } from '@/lib/topics-server';
import { buildEntityRegistry } from '@/lib/entity-registry';
import { describeEntities } from '@/lib/member-feed';
import { articleUrl } from '@/lib/article-url';
import { buildRelations } from '@/lib/editorial/relations';
import { gramsOf, type Catalog } from '@/lib/editorial/analyze';

const TTL_MS = 5 * 60 * 1000;
let cached: { at: number; value: Promise<Catalog> } | null = null;

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ');

async function build(): Promise<Catalog> {
  const [people, cases, courts, entertainment, teams, competitions, topics] = await Promise.all([getMergedPeople(), getMergedLegalCases(), getMergedCourts(), getMergedEntertainmentEntities(), getMergedSportsTeams(), getMergedSportsCompetitions(), getMergedTopics()]);
  const registry = buildEntityRegistry(people, { cases, courts }, entertainment, { teams, competitions }, topics);
  const described = new Map(describeEntities(registry.map((r) => ({ entityType: r.entityType, slug: r.slug })), registry).map((d) => [`${d.entityType}:${d.slug}`, d]));

  const entities = registry.flatMap((r) => {
    const d = described.get(`${r.entityType}:${r.slug}`);
    return d ? [{ ref: { entityType: r.entityType, slug: r.slug }, label: d.name, names: r.names, kind: d.kind, url: d.url }] : [];
  });

  const index = await getTaggedArticleIndex();
  const grams = new Map<string, string>();
  const articles = index
    .filter(({ article }) => article?.slug && article?.title)
    .map(({ article, entities: refs }) => {
      const text = [article.title, (article as { excerpt?: string }).excerpt, article.summary, stripHtml(article.content || '')].filter(Boolean).join(' ');
      for (const g of gramsOf(text)) if (!grams.has(g)) grams.set(g, article.slug);
      return { slug: article.slug as string, title: article.title as string, url: articleUrl(article), entities: refs };
    });

  return { entities, articles, relations: buildRelations(people, cases, entertainment, competitions), grams };
}

/** The site catalog the analysis runs against. Rebuilt every few minutes, so a newly published article becomes linkable quickly. */
export function getEditorialCatalog(): Promise<Catalog> {
  if (!cached || Date.now() - cached.at > TTL_MS) {
    const value = build();
    cached = { at: Date.now(), value };
    value.catch(() => { cached = null; });
  }
  return cached.value;
}
