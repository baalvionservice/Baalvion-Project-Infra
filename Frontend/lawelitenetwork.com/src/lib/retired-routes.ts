// Sections that were retired from the site. Requests answer 410 Gone (see
// middleware.ts) so Google drops the URLs instead of treating a redirect to the
// homepage as a soft 404. Remove an entry here when its section is restored.

export const RETIRED_EXACT_PATHS: ReadonlySet<string> = new Set([
  '/best-car-accident-lawyer',
  '/best-law-schools-in-the-usa',
  '/boating-accident-lawyer',
  '/boating-accident-liability-and-fault',
  '/boating-accident-statute-of-limitations',
  '/case-law',
  '/courts',
  '/cruise-ship-passenger-vessel-accidents',
  '/divorce-law-in-maryland',
  '/how-divorce-works-in-the-us',
  '/how-many-laws-are-there-in-the-us',
  '/how-the-us-legal-system-works',
  '/is-sharia-law-legal-in-the-united-states',
  '/law-changes',
  '/law-enforcement-in-1900s-america',
  '/legal',
  '/legislation',
  '/maritime-offshore-injury-law',
  '/muslim-law-and-legal-practices-in-the-us',
  '/personal-injury-lawyer',
  '/plans',
  '/tv',
  '/us-constitution-how-laws-are-made',
  '/weird-silly-crazy-laws-in-the-usa',
  '/what-does-a-car-accident-lawyer-do',
  '/what-to-do-after-a-boating-accident',
  '/world',
]);

export const RETIRED_PREFIXES: readonly string[] = [
  '/cases',
  '/galleries',
  '/podcasts',
  '/videos',
  '/boating-accidents',
  '/business',
  '/car-accidents',
  '/celebrity-news',
  '/countries',
  '/criminal-law',
  '/disputes',
  '/employment-law',
  '/entertainment',
  '/family-law',
  '/fashion',
  '/interviews',
  '/legal',
  '/legal-education-and-history',
  '/movies',
  '/music',
  '/people',
  '/real-estate-law',
  '/religion-law-and-weird-laws',
  '/sports',
  '/streaming',
  '/tax-finance',
  '/tech-ip',
  '/television',
  '/topics',
  '/us-law-and-constitution',
];

export function isRetiredPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (RETIRED_EXACT_PATHS.has(path)) return true;
  return RETIRED_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}
