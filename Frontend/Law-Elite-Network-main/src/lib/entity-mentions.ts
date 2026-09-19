import { buildEntityRegistry } from '@/lib/entity-registry';
import type { EntityReference } from '@/types/entity-tagging';

// Names shorter than this false-positive too easily on ordinary words
// ("Halo" the song vs. a halo effect, a court/team with a generic-sounding
// short name) -- a deliberate precision guard, not a completeness one.
const MIN_NAME_LENGTH = 4;

// A short, single-word name ("Halo") is exactly as likely to be an ordinary
// English word used lowercase as it is the entity -- multi-word names
// ("Forrest Gump", "Los Angeles Lakers") don't have this problem, a random
// sentence essentially never contains that exact phrase by coincidence.
// Below this length/word-count, require the source text to actually
// capitalize it the way a title/proper-noun reference would, instead of
// matching indiscriminately case-insensitively.
const CASE_SENSITIVE_MAX_LENGTH = 6;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isAmbiguousShortName(name: string): boolean {
  return !name.includes(' ') && name.length <= CASE_SENSITIVE_MAX_LENGTH;
}

/**
 * Case-insensitive, whole-word/phrase match of every registry entity's
 * name(s) against a block of text. This is the whole automatic-tagging
 * mechanism: no editor picks entities by hand, an article's connections are
 * whatever it actually names. One entity can match many articles and one
 * article can match many entities -- that many-to-many-ness is just the
 * natural result of running this over the full registry, not special-cased.
 */
export function detectEntitiesInText(text: string, registry: ReturnType<typeof buildEntityRegistry> = buildEntityRegistry()): EntityReference[] {
  if (!text) return [];
  const found = new Map<string, EntityReference>();

  for (const entry of registry) {
    const matchable = entry.names.filter((n) => n && n.length >= MIN_NAME_LENGTH);
    const hit = matchable.some((name) => {
      const flags = isAmbiguousShortName(name) ? '' : 'i';
      return new RegExp(`\\b${escapeRegExp(name)}\\b`, flags).test(text);
    });
    if (hit) {
      found.set(`${entry.entityType}:${entry.slug}`, { entityType: entry.entityType, slug: entry.slug });
    }
  }

  return Array.from(found.values());
}

/** Strips HTML before matching -- an article's `content` is rendered HTML, and tag soup ("<p>Tom</p><p>Hanks</p>") would otherwise defeat whole-phrase matching. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}

/** Every entity a given article connects to -- title/excerpt/summary carry the most reliable signal, so they're included unstripped alongside the (HTML) body. */
export function getArticleEntities(
  article: { title?: string; excerpt?: string; summary?: string; content?: string },
  registry?: ReturnType<typeof buildEntityRegistry>,
): EntityReference[] {
  const text = [article.title, article.excerpt, article.summary, stripHtml(article.content || '')]
    .filter(Boolean)
    .join('\n\n');
  return detectEntitiesInText(text, registry);
}
