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
export function buildAuthorLd(bylineName: string | undefined, site: string) {
  if (!bylineName) return { '@type': 'Organization', name: 'Law Elite Network' };
  const matched = getAuthorByName(bylineName);
  const slug = matched?.slug ?? authorNameToSlug(bylineName);
  if (!slug) return { '@type': 'Organization', name: 'Law Elite Network' };
  return { '@type': 'Person', name: matched?.name ?? bylineName, url: `${site}/author/${slug}` };
}
