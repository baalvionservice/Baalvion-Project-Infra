import { isInviteGated } from "./invite-gate";

/**
 * The one list of route prefixes that must never be indexed.
 *
 * robots.ts and sitemap.ts both read it. They previously kept separate hand-maintained lists and
 * drifted: the sitemap invited crawlers to index 11 routes robots.txt was blocking (/dashboard,
 * /capital-ops, /onboarding, /governance/my-voting, the phase portals), four of which were not
 * even real routes. Asking a crawler to index a page you also forbid is not a neutral mistake —
 * it wastes crawl budget and makes the directives untrustworthy.
 *
 * Anything gated by auth, or that only ever renders a login wall to a crawler, belongs here.
 */
export const GATED_PREFIXES = [
  "/admin",
  "/api",
  "/auth",
  "/dashboard",
  "/capital-ops",
  "/strategic-operator",
  "/onboarding",
  "/phase2",
  "/phase3",
  "/review",
  "/governance/my-voting",
  "/invest/deals",
  "/invest/my-business",
] as const;

/** True when a path is behind a gate and must be kept out of the sitemap and robots. */
export const isGatedPath = (path: string): boolean =>
  GATED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

/**
 * Invitation-gated investor routes and the founder-side routes that must stay indexable inside
 * them. `isInviteGated` is the same predicate the middleware enforces, imported rather than
 * restated so a route cannot end up gated but still advertised in the sitemap.
 */
export const INVITE_GATED_PREFIXES = ["/invest", "/onboarding"] as const;
export const INVITE_OPEN_PATHS = ["/invest/list-your-business", "/onboarding/business"] as const;

/** Everything that must stay out of the sitemap and out of the index, for either reason. */
export const isNoIndexPath = (path: string): boolean => isGatedPath(path) || isInviteGated(path);
