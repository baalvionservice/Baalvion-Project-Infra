import { getAuthorByName, authorNameToSlug } from '@/data/authors';

/**
 * schema.org author node for an article byline.
 *
 * getAuthorByName only searches the bundled roster, so a contributor who
 * exists solely in the CMS resolved to null and the article was credited to
 * the Organization instead of to them — erasing exactly the authors worth
 * surfacing on YMYL legal content, the qualified CMS-managed ones.
 *
 * /author/{slug} serves bundled and CMS profiles alike (getMergedAuthorBySlug),
 * and authorNameToSlug is the same function that route resolves by, so a
 * byline with no bundled match still gets a real Person and a URL that loads.
 */
/**
 * House credits ("Law Elite Network Editorial Board", "Law Elite Editorial
 * Team") name the publication's desk, not a person, and no /author profile
 * exists for them. Emitting them as a Person with an /author/{slug} URL asserted
 * an individual and a page that does not exist. A bylined "DRAFT" placeholder is
 * likewise not an author. Both fall back to the publisher Organization.
 */
const HOUSE_BYLINE = /^(law elite(?: network)?\s+)?editorial\s+(board|team)$/i;
const PLACEHOLDER_BYLINE = /^draft\b/i;
/**
 * Bylines on bundled articles whose author identity is unresolved (no profile
 * in the roster or the CMS; /author/{slug} 404s). They stay credited by name
 * but get no profile URL in structured data, since that URL is dead. Remove a
 * name from this set once a real profile exists for it.
 */
const UNRESOLVED_BYLINES = new Set(['elena rostova', 'marcus vance', 'sarah jenkins', 'david thorne']);

export function isNonPersonByline(name: string | null | undefined): boolean {
  const n = (name || '').trim();
  return HOUSE_BYLINE.test(n) || PLACEHOLDER_BYLINE.test(n);
}

export function buildAuthorLd(bylineName: string | undefined, site: string) {
  if (!bylineName || isNonPersonByline(bylineName)) return { '@type': 'Organization', name: 'Law Elite Network' };
  if (UNRESOLVED_BYLINES.has(bylineName.trim().toLowerCase())) return { '@type': 'Person', name: bylineName.trim() };
  const matched = getAuthorByName(bylineName);
  const slug = matched?.slug ?? authorNameToSlug(bylineName);
  if (!slug) return { '@type': 'Organization', name: 'Law Elite Network' };
  return {
    '@type': 'Person',
    name: matched?.name ?? bylineName,
    url: `${site}/author/${slug}`,
    ...(matched?.title && { jobTitle: matched.title }),
    ...(matched && { worksFor: { '@type': 'Organization', name: 'Law Elite Network' } }),
  };
}
