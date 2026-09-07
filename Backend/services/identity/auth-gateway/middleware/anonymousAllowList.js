'use strict';
/**
 * The short list of upstream endpoints a visitor may reach WITHOUT a session.
 *
 * Why this exists: /api is otherwise session-only, which is right for every product whose
 * data belongs to an account. CanWeMarry has a genuinely public front half — a case its
 * author chose to publish, the resource directory, the shape of a shared invitation — and
 * with no way through the gateway, the web app had to hold a second route to the backend
 * for anonymous reads. Two doors into one service is the thing worth removing here.
 *
 * WHAT THIS IS NOT: it is not authorization. Being on this list means only "do not demand
 * a session before proxying"; the backend still decides what an anonymous caller may see,
 * and every one of these paths is served there by a route that resolves its own viewer and
 * applies the visibility rules. If that backend gate were removed, this list would not save
 * anything — which is exactly why it stays this short and this explicit.
 *
 * THREE RULES, and each of them is enforced below rather than merely intended:
 *   1. Reads only. GET and HEAD; nothing that changes state is ever anonymous.
 *   2. Exact paths, never prefixes. `/canwemarry/*` would have quietly published the
 *      moderation queue and the admin routes the day either was added.
 *   3. A session, when one IS present, is still verified in full. This does not switch
 *      authentication off; it makes it optional, so a signed-in reader gets their own view
 *      of the same URL rather than the anonymous one.
 */

/** `:param` matches one path segment; nothing matches a `/`, so no pattern can span depth. */
function compile(pattern) {
  const source = pattern
    .split('/')
    .map((segment) => (segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return new RegExp(`^${source}$`);
}

/**
 * CanWeMarry's public reads.
 *
 * Every entry corresponds to a route mounted with `optionalAuth` in the service's own route
 * table — that is the invariant, and it is what makes each of these safe to reach without a
 * session. A route that requires authentication must never appear here; the test suite
 * checks the two lists against each other so adding one without the other fails CI.
 */
const PUBLIC_PATHS = [
  // Who am I — answers `authenticated: false` for a visitor. The app shell asks on every
  // load precisely because it does not yet know, and a 401 made that ordinary question
  // look like a fault in the logs.
  '/canwemarry/v1/me',

  // Cases. The service returns only what its visibility rules allow an anonymous reader:
  // published, non-private cases, in summary form.
  '/canwemarry/v1/cases',
  '/canwemarry/v1/cases/reference/:reference',
  '/canwemarry/v1/cases/:id',
  '/canwemarry/v1/cases/:id/updates',
  // Related material for a case. Re-reads the case under the caller's own rule first, so
  // it answers 404 for anything they may not see, and it never says why an item was chosen.
  '/canwemarry/v1/cases/:id/related',

  // Communities, discussion and reactions — the readable public square.
  '/canwemarry/v1/communities',
  '/canwemarry/v1/communities/slug/:slug',
  '/canwemarry/v1/communities/:id',
  '/canwemarry/v1/posts',
  '/canwemarry/v1/posts/:id',
  '/canwemarry/v1/comments',
  '/canwemarry/v1/reactions/:targetType/:targetId',

  // The resource directory: written by the platform, meant to be findable by someone who
  // is not ready to make an account. That is the whole point of it.
  '/canwemarry/v1/resources',
  '/canwemarry/v1/resources/:slug',

  // A member's public profile page.
  '/canwemarry/v1/profiles/:handle',

  // Invitation preview. Token-gated by design — somebody who was sent a link must be able
  // to see what they were invited to before deciding whether to make an account. It returns
  // the relation and the status, never the case or the person who sent it.
  '/canwemarry/v1/invitations/:token',
];

const SAFE_METHODS = new Set(['GET', 'HEAD']);
const COMPILED = PUBLIC_PATHS.map(compile);

/**
 * May this request proceed without a session?
 *
 * `url` is the path as mounted at /api — the query string is dropped before matching, so a
 * crafted `?` cannot smuggle a different path past the comparison.
 */
function isAnonymousAllowed(method, url) {
  if (!SAFE_METHODS.has(String(method || '').toUpperCase())) return false;
  const path = String(url || '').split('?')[0].split('#')[0];
  return COMPILED.some((re) => re.test(path));
}

module.exports = { isAnonymousAllowed, PUBLIC_PATHS };
