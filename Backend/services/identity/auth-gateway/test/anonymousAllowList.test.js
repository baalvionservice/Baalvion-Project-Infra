'use strict';
/**
 * The anonymous allow-list.
 *
 * Two things are checked here, and the second is the one that will actually catch a
 * mistake a year from now: that the list matches only what it says it matches, and that
 * every path on it is served upstream by a route which resolves its own viewer. A path
 * added here whose backend route demands authentication would be a gateway that waves a
 * visitor through to a 401 — and, far worse, the same edit made in the other order (adding
 * an authenticated route under a path shape already on this list) would publish it.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { isAnonymousAllowed, PUBLIC_PATHS } = require('../middleware/anonymousAllowList');

/**
 * Where each allow-listed prefix is actually served, and what "this route demands a session"
 * looks like in that service's own vocabulary.
 *
 * `demandsAuth` is the list of middleware whose presence on a GET route disqualifies it from
 * the allow-list. `mustMention` is the tripwire: if a service stops using these names the
 * check above would pass vacuously, so it is asserted separately.
 */
const svcPath = (...p) => path.join(__dirname, '..', '..', '..', ...p);
const SERVICES = [
  {
    prefix: '/canwemarry/v1',
    routeFile: svcPath('ecosystem', 'canwemarry-service', 'routes', 'v1.js'),
    demandsAuth: ['requireAuth', 'requireStaff', 'requireAdmin', 'requirePermission', 'requireVerified'],
    mustMention: ['requireAuth', 'optionalAuth', 'requireStaff', 'requireAdmin'],
  },
  {
    prefix: '/insiders/v1',
    routeFile: svcPath('ecosystem', 'insiders-service', 'routes', 'v1.js'),
    demandsAuth: ['authMiddleware', 'requireRole', 'requireAuth', 'requireAdmin'],
    mustMention: ['authMiddleware', 'requireRole', 'optionalAuth'],
  },
];

test('public reads are allowed without a session', () => {
  for (const p of ['/canwemarry/v1/cases', '/canwemarry/v1/resources', '/canwemarry/v1/me']) {
    assert.equal(isAnonymousAllowed('GET', p), true, p);
  }
  assert.equal(isAnonymousAllowed('GET', '/canwemarry/v1/cases/7f3a1c2e-0000-4000-8000-00000000abcd'), true);
  assert.equal(isAnonymousAllowed('GET', '/canwemarry/v1/invitations/example-invite-token'), true);
});

test('a query string cannot smuggle a different path past the match', () => {
  assert.equal(isAnonymousAllowed('GET', '/canwemarry/v1/cases?page=2'), true);
  assert.equal(isAnonymousAllowed('GET', '/canwemarry/v1/admin/users?x=/canwemarry/v1/cases'), false);
});

test('nothing that changes state is ever anonymous', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    assert.equal(isAnonymousAllowed(method, '/canwemarry/v1/cases'), false, method);
  }
});

test('the private surface stays private', () => {
  const mustNeverBePublic = [
    '/canwemarry/v1/admin/users',
    '/canwemarry/v1/admin/audit',
    '/canwemarry/v1/moderation/reports',
    '/canwemarry/v1/me/notifications',
    '/canwemarry/v1/me/profile',
    '/canwemarry/v1/me/reports',
    '/canwemarry/v1/me/invitations',
    '/canwemarry/v1/cases/some-id/participants',
    '/canwemarry/v1/cases/some-id/supporters',
    '/canwemarry/v1/cases/some-id/invitations',
  ];
  for (const p of mustNeverBePublic) assert.equal(isAnonymousAllowed('GET', p), false, p);
});

test('a :param matches one segment and cannot reach deeper', () => {
  // Without this, `/cases/:id` would also match `/cases/<id>/participants`.
  assert.equal(isAnonymousAllowed('GET', '/canwemarry/v1/cases/abc/participants'), false);
  assert.equal(isAnonymousAllowed('GET', '/canwemarry/v1/profiles/handle/secrets'), false);
});

test('the list is exact, never a prefix', () => {
  assert.equal(isAnonymousAllowed('GET', '/canwemarry/v1/casesX'), false);
  assert.equal(isAnonymousAllowed('GET', '/canwemarry/v1'), false);
  assert.equal(isAnonymousAllowed('GET', '/canwemarry'), false);
  // Another service must not inherit CanWeMarry's list.
  assert.equal(isAnonymousAllowed('GET', '/insiders/v1/cases'), false);
});

test('no allow-listed path is served upstream by a route that demands a session', () => {
  // The invariant that makes the list safe, read from each service's own route table so the
  // two cannot drift apart silently.
  //
  // The rule is the absence of a hard gate, not the presence of `optionalAuth`: the
  // invitation preview carries no auth middleware at all — the token in the URL is the
  // proof, and somebody who was sent a link must be able to see what it is before deciding
  // whether to make an account. What must never appear is requireAuth and its stricter kin.
  //
  // Guard names are per-service on purpose. Insiders gates with `authMiddleware`/`requireRole`
  // and knows nothing of `requireAuth`; checking it against CanWeMarry's vocabulary would pass
  // on every path while proving nothing.
  for (const svc of SERVICES) {
    const source = fs.readFileSync(svc.routeFile, 'utf8');

    // Each `router.get('<path>', <chain>);` — the chain read whole, not just its first entry.
    const routes = new Map();
    const re = /router\.get\(\s*'([^']+)'\s*,([\s\S]*?)\);/g;
    let m;
    while ((m = re.exec(source)) !== null) routes.set(m[1], m[2]);
    assert.ok(routes.size > 5, `route table did not parse for ${svc.prefix} — the check would pass vacuously`);

    for (const listed of PUBLIC_PATHS.filter((x) => x.startsWith(`${svc.prefix}/`))) {
      const upstream = listed.slice(svc.prefix.length);
      const chain = routes.get(upstream);
      assert.ok(chain !== undefined, `allow-listed path has no GET route upstream: ${upstream}`);
      for (const guard of svc.demandsAuth) {
        assert.ok(
          !new RegExp(`\\b${guard}\\b`).test(chain),
          `allow-listed path ${upstream} is mounted with ${guard} — it is not public`,
        );
      }
    }
  }
});

test('every allow-listed path belongs to a service the invariant actually checks', () => {
  // Without this, adding a path under a brand-new prefix would skip the check above entirely
  // and publish it unexamined.
  for (const listed of PUBLIC_PATHS) {
    assert.ok(
      SERVICES.some((svc) => listed.startsWith(`${svc.prefix}/`)),
      `allow-listed path is under no known service prefix: ${listed}`,
    );
  }
});

test('the guard names the invariant checks for are the ones each service actually uses', () => {
  // If a route file were refactored to gate with a differently-named middleware, the check
  // above would silently pass on every path. This fails first, and loudly.
  for (const svc of SERVICES) {
    const source = fs.readFileSync(svc.routeFile, 'utf8');
    for (const guard of svc.mustMention) {
      assert.ok(source.includes(guard), `${svc.prefix} route table no longer mentions ${guard}`);
    }
  }
});
