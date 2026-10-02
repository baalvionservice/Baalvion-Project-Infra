/**
 * Website scoping for the console.
 *
 * A CMS member may work on the sites they were granted and nothing else. cms-service already
 * enforces this (the list is membership-scoped and loadCmsRole 403s the rest); this is the
 * console half, so a site that isn't theirs shows locked instead of opening onto a wall of errors.
 */

/** Same set cms-service treats as "all sites" (middleware/resolveWebsite.js PLATFORM_BYPASS_ROLES). */
const ALL_SITES_ROLES = ['super_admin', 'owner', 'admin'] as const;

/** Console routes shaped /cms/websites/<site>[/...] — the segment is a slug or an id. */
const SITE_PATH = /^\/cms\/websites\/([^/?#]+)/;

export const siteKeyOf = (pathname: string): string | null => {
  const match = SITE_PATH.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

/** True for principals who see every website, so no membership lookup is needed. */
export const seesAllSites = (roles: string[]): boolean =>
  roles.some((r) => (ALL_SITES_ROLES as readonly string[]).includes(r));

/**
 * `memberOf` is the set of slugs/ids the caller belongs to, or null while it is still loading.
 * Paths that aren't site-scoped are always allowed here; the route policy decides those.
 */
export function canOpenSitePath(
  pathname: string,
  roles: string[],
  memberOf: ReadonlySet<string> | null,
): boolean {
  const site = siteKeyOf(pathname);
  if (!site) return true;
  if (seesAllSites(roles)) return true;
  if (memberOf === null) return true; // not loaded yet — never flash a lock at a legitimate member
  return memberOf.has(site);
}
