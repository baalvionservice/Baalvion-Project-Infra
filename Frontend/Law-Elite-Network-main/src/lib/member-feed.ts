import { getTaggedArticleIndex } from '@/lib/entity-articles';
import { buildEntityRegistry } from '@/lib/entity-registry';
import { personUrl } from '@/lib/person-url';
import { entertainmentUrl } from '@/lib/entertainment-url';
import { legalCaseUrl, courtUrl } from '@/lib/legal-case-url';
import { teamUrl, competitionUrl } from '@/lib/sports-url';
import { countryUrl } from '@/lib/country-url';
import { topicUrl } from '@/lib/topic-url';
import { ENTITY_TYPES, type EntityReference, type EntityType } from '@/types/entity-tagging';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,199}$/;
export const MAX_QUERY_ITEMS = 100;

/** Parses "person:tom-hanks,topic:olympics". Anything malformed is dropped, not guessed at. */
export function parseEntityQuery(raw: string | null): EntityReference[] {
  if (!raw) return [];
  const out: EntityReference[] = [];
  for (const part of raw.split(',').slice(0, MAX_QUERY_ITEMS)) {
    const i = part.indexOf(':');
    const entityType = part.slice(0, i) as EntityType;
    const slug = part.slice(i + 1);
    if (i > 0 && (ENTITY_TYPES as readonly string[]).includes(entityType) && SLUG_RE.test(slug)) {
      out.push({ entityType, slug });
    }
  }
  return out;
}

export const isValidSlug = (s: string) => SLUG_RE.test(s);

// The client never needs the article body, and it is the bulk of the payload.
function slim(article: any) {
  const { content, ...rest } = article;
  return rest;
}

const time = (a: any) => Date.parse(a?.updatedAt || a?.publishedAt || '') || 0;

/**
 * Personalised feed: every published article that names at least one followed
 * entity, newest first, each with the followed entities that matched (so the
 * UI can say why it is there). Direct mentions only -- a feed should never
 * surface something the member did not ask for.
 */
export async function getFeedForEntities(follows: EntityReference[], limit = 30) {
  if (follows.length === 0) return [];
  const wanted = new Set(follows.map((f) => `${f.entityType}:${f.slug}`));
  const index = await getTaggedArticleIndex();
  return index
    .map(({ article, entities }) => ({
      article,
      matched: entities.filter((e) => wanted.has(`${e.entityType}:${e.slug}`)),
    }))
    .filter((r) => r.matched.length > 0 && r.article?.slug)
    .sort((a, b) => time(b.article) - time(a.article))
    .slice(0, limit)
    .map((r) => ({ article: slim(r.article), matched: r.matched }));
}

export async function getArticlesBySlugs(slugs: string[]) {
  const wanted = new Set(slugs.filter(isValidSlug).slice(0, MAX_QUERY_ITEMS));
  const index = await getTaggedArticleIndex();
  return index.filter(({ article }) => wanted.has(article?.slug)).map(({ article }) => slim(article));
}

const ENTITY_LABEL: Record<EntityType, string> = {
  person: 'Person',
  entertainment: 'Entertainment',
  'legal-case': 'Legal case',
  court: 'Court',
  'sports-team': 'Team',
  'sports-competition': 'Competition',
  country: 'Country',
  topic: 'Topic',
};

function entityUrl(type: EntityType, slug: string): string {
  switch (type) {
    case 'person': return personUrl(slug);
    case 'entertainment': return entertainmentUrl(slug);
    case 'legal-case': return legalCaseUrl(slug);
    case 'court': return courtUrl(slug);
    case 'sports-team': return teamUrl(slug);
    case 'sports-competition': return competitionUrl(slug);
    case 'country': return countryUrl(slug);
    case 'topic': return topicUrl(slug);
  }
}

/** Name + link for each followed entity, so the UI never shows a raw slug. Entities that no longer exist are omitted. */
export function describeEntities(refs: EntityReference[]) {
  const names = new Map(buildEntityRegistry().map((e) => [`${e.entityType}:${e.slug}`, e.names[0]]));
  return refs.flatMap((r) => {
    const name = names.get(`${r.entityType}:${r.slug}`);
    return name ? [{ ...r, name, kind: ENTITY_LABEL[r.entityType], url: entityUrl(r.entityType, r.slug) }] : [];
  });
}
