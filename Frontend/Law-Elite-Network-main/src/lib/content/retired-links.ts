/**
 * Root-flat guide URLs that no longer resolve to a page. Each 301s to `/` via
 * next.config.ts because its category was retired -- the guide is gone, not
 * moved, so there is no better destination than the homepage. A redirect fixes
 * where a click *lands*; it does nothing about the link still sitting in the
 * prose, which is how a reader ends up on the homepage wondering what happened.
 * Keep this in step with next.config.ts's redirects().
 */
const RETIRED_ROOT_SLUGS = new Set([
  'best-car-accident-lawyer',
  'what-does-a-car-accident-lawyer-do',
  'boating-accident-lawyer',
  'what-to-do-after-a-boating-accident',
  'boating-accident-statute-of-limitations',
  'boating-accident-liability-and-fault',
  'divorce-law-in-maryland',
  'how-divorce-works-in-the-us',
  'us-constitution-how-laws-are-made',
  'how-the-us-legal-system-works',
  'how-many-laws-are-there-in-the-us',
  'is-sharia-law-legal-in-the-united-states',
  'muslim-law-and-legal-practices-in-the-us',
  'weird-silly-crazy-laws-in-the-usa',
  'best-law-schools-in-the-usa',
  'law-enforcement-in-1900s-america',
]);

/** The four reference/newsroom sections retired alongside those guides. */
const RETIRED_SECTIONS = new Set(['news', 'case-law', 'legislation', 'law-changes', 'world', 'plans']);

/**
 * Practice areas retired in the AdSense-readiness pass, in both their current
 * and pre-rename slug forms (see CATEGORY_SLUG_RENAME). Listed explicitly
 * rather than inferred as "any segment that isn't a live category" -- that
 * shortcut would also match /author/..., /article/... and every policy page.
 */
const RETIRED_CATEGORY_SLUGS = new Set([
  'business', 'business-corporate',
  'criminal-law',
  'family-law', 'family-personal',
  'real-estate-law', 'property-real-estate',
  'tax-finance',
  'employment-law', 'employment-labor',
  'tech-ip', 'technology-ip',
  'disputes', 'dispute-resolution',
  'us-law-and-constitution',
  'religion-law-and-weird-laws',
  'legal-education-and-history',
  'boating-accidents',
  'car-accidents',
  'legal-guides',
  'immigration-law-visas',
]);

/**
 * True when an in-prose href points somewhere a reader can no longer usefully
 * go: a retired guide, a retired section, or a retired practice-area hub.
 * Off-site links, anchors and query strings are left alone.
 */
export function isRetiredHref(href: string): boolean {
  if (!href.startsWith('/')) return false;
  const path = href.split(/[?#]/)[0].replace(/\/+$/, '');
  if (!path) return false;
  const segments = path.slice(1).split('/');
  const [first] = segments;
  if (RETIRED_SECTIONS.has(first)) return true;
  if (segments.length === 1) return RETIRED_ROOT_SLUGS.has(first) || RETIRED_CATEGORY_SLUGS.has(first);
  // A /{category}/{slug} link is dead when its practice area was retired. The
  // legacy /law/{category}/... shim chains through the same rename map, so
  // check the segment after it too.
  if (first === 'law') return segments.length > 1 && RETIRED_CATEGORY_SLUGS.has(segments[1]);
  return RETIRED_CATEGORY_SLUGS.has(first);
}

/**
 * Unwraps anchors pointing at retired destinations, keeping their text. CMS
 * article bodies are the one surface nobody goes back to re-edit after a
 * retirement, so filtering at render is what actually stops a stale link from
 * outliving the page it points at -- five of them were live on
 * lawelitenetwork.com when this was written, every one landing on the homepage.
 *
 * Deliberately narrow: only `<a>` tags whose href is a same-origin retired
 * path, and only the tags -- the text stays, so the sentence still reads.
 */
export function unwrapRetiredLinks(html: string): string {
  if (!html) return html;
  return html.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
    (match, attrs: string, text: string) => {
      const href = /href\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1];
      return href && isRetiredHref(href) ? text : match;
    },
  );
}
