'use strict';
/**
 * CMS access-control tests. Run: npm test (node --test "test/**\/*.test.js")
 *
 * Covers the access rules changed on 2026-09-05:
 *   • Writers (cms_author) publish on the sites they are granted; contributors still cannot.
 *   • One person can be granted several sites in a single action.
 *   • requireCmsRole gates on the caller's level for THAT website.
 *
 * These are the pure-logic halves. Membership scoping of the website LIST is exercised
 * against a live database in the service's integration suite, not here.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TRANSITIONS } = require('../service/workflowService');
const { requireCmsRole, CMS_ROLE_LEVEL } = require('../middleware/cmsAccess');
const { grantAccessSchema, addMemberSchema } = require('../validators/websiteSchemas');

const runGuard = (guard, cmsLevel) => {
  let err = null;
  guard({ cmsLevel }, {}, (e) => { err = e || null; });
  return err;
};
const allows = (guard, cmsLevel) => runGuard(guard, cmsLevel) === null;

// ── who may publish ──────────────────────────────────────────────────────────
test('publish is available from the Writer tier', () => {
  assert.equal(TRANSITIONS.publish.requiredLevel, CMS_ROLE_LEVEL.cms_author);
});

test('a Writer can publish, schedule and unpublish', () => {
  for (const action of ['publish', 'schedule', 'unpublish']) {
    assert.ok(
      CMS_ROLE_LEVEL.cms_author >= TRANSITIONS[action].requiredLevel,
      `cms_author should be able to ${action}`,
    );
  }
});

test('unpublish sits at the SAME level as publish', () => {
  // Whoever can put a page up must be able to take it down without chasing an editor.
  assert.equal(TRANSITIONS.unpublish.requiredLevel, TRANSITIONS.publish.requiredLevel);
});

test('a Contributor still cannot publish — that tier stays draft-for-review', () => {
  assert.ok(CMS_ROLE_LEVEL.cms_contributor < TRANSITIONS.publish.requiredLevel);
  assert.ok(CMS_ROLE_LEVEL.cms_contributor >= TRANSITIONS.submit_for_review.requiredLevel,
    'a contributor must still be able to submit for review');
});

test('archive stays above publish — destructive actions keep the higher bar', () => {
  assert.ok(TRANSITIONS.archive.requiredLevel > TRANSITIONS.publish.requiredLevel);
});

test('every transition names a level that maps to a real CMS role', () => {
  const levels = new Set(Object.values(CMS_ROLE_LEVEL));
  for (const [action, def] of Object.entries(TRANSITIONS)) {
    assert.ok(levels.has(def.requiredLevel), `${action} requires an unmapped level ${def.requiredLevel}`);
  }
});

// ── requireCmsRole ───────────────────────────────────────────────────────────
test('requireCmsRole admits a caller at or above the required level', () => {
  const guard = requireCmsRole('cms_editor');
  assert.equal(allows(guard, CMS_ROLE_LEVEL.cms_editor), true);
  assert.equal(allows(guard, CMS_ROLE_LEVEL.cms_admin), true);
  assert.equal(allows(guard, CMS_ROLE_LEVEL.cms_author), false);
});

test('requireCmsRole refuses when no CMS role was resolved', () => {
  // loadCmsRole must have run first; an unresolved level is a refusal, never a pass.
  const err = runGuard(requireCmsRole('cms_viewer'), undefined);
  assert.ok(err, 'an unverified caller must be refused');
  assert.equal(err.statusCode ?? err.status, 403);
});

test('requireCmsRole refuses level 0 (a non-member)', () => {
  assert.equal(allows(requireCmsRole('cms_viewer'), 0), false);
});

// ── multi-site grants ────────────────────────────────────────────────────────
const SITE_A = '2a387ef1-cafe-4f8c-aa80-23c32e0e79a2';
const SITE_B = '0fd4ebf5-9570-4b9a-806b-e41dbc391cb1';

test('one person can be granted several websites at once', () => {
  const r = grantAccessSchema.safeParse({
    email: 'writer@example.com', role: 'cms_author', websiteIds: [SITE_A, SITE_B],
  });
  assert.equal(r.success, true);
  assert.equal(r.data.websiteIds.length, 2);
});

test('a grant defaults to Writer when no role is given', () => {
  const r = grantAccessSchema.safeParse({ email: 'w@example.com', websiteIds: [SITE_A] });
  assert.equal(r.success, true);
  assert.equal(r.data.role, 'cms_author');
});

test('a grant must name at least one website', () => {
  assert.equal(grantAccessSchema.safeParse({ email: 'w@example.com', websiteIds: [] }).success, false);
});

test('a grant must identify the person', () => {
  assert.equal(grantAccessSchema.safeParse({ websiteIds: [SITE_A] }).success, false);
});

test('a grant accepts a userId instead of an email', () => {
  assert.equal(grantAccessSchema.safeParse({ userId: 16, websiteIds: [SITE_A] }).success, true);
});

test('a grant rejects a website id that is not a uuid', () => {
  assert.equal(grantAccessSchema.safeParse({ email: 'w@example.com', websiteIds: ['not-a-uuid'] }).success, false);
});

test('a grant rejects an unknown role', () => {
  assert.equal(
    grantAccessSchema.safeParse({ email: 'w@example.com', role: 'cms_god', websiteIds: [SITE_A] }).success,
    false,
  );
});

test('a bulk grant is bounded so one request cannot fan out without limit', () => {
  const many = Array.from({ length: 51 }, () => SITE_A);
  assert.equal(grantAccessSchema.safeParse({ email: 'w@example.com', websiteIds: many }).success, false);
});

// ── grant expiry (time-boxed access) ─────────────────────────────────────────
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString();

test('a grant may carry a future expiry', () => {
    const r = grantAccessSchema.safeParse({ email: 'w@example.com', websiteIds: [SITE_A], expiresAt: inDays(30) });
    assert.equal(r.success, true);
});

test('a grant without an expiry is still valid — a standing grant stays the default', () => {
    const r = grantAccessSchema.safeParse({ email: 'w@example.com', websiteIds: [SITE_A] });
    assert.equal(r.success, true);
    assert.equal(r.data.expiresAt, undefined);
});

test('an expiry in the PAST is rejected — access dead on arrival reads as a silent failure', () => {
    assert.equal(
        grantAccessSchema.safeParse({ email: 'w@example.com', websiteIds: [SITE_A], expiresAt: inDays(-1) }).success,
        false,
    );
});

test('an absurdly distant expiry is rejected so a typo cannot outlive review', () => {
    assert.equal(
        grantAccessSchema.safeParse({ email: 'w@example.com', websiteIds: [SITE_A], expiresAt: '2999-01-01T00:00:00Z' }).success,
        false,
    );
});

test('an expiry that is not a datetime is rejected', () => {
    assert.equal(
        grantAccessSchema.safeParse({ email: 'w@example.com', websiteIds: [SITE_A], expiresAt: 'next tuesday' }).success,
        false,
    );
});

test('addMemberSchema accepts the same expiry rules as a bulk grant', () => {
    assert.equal(addMemberSchema.safeParse({ email: 'w@example.com', expiresAt: inDays(7) }).success, true);
    assert.equal(addMemberSchema.safeParse({ email: 'w@example.com', expiresAt: inDays(-7) }).success, false);
});
