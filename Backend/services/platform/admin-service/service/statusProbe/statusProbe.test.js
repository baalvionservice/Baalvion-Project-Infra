'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// Unit tests: no database, no network. The database-backed behaviour (incident open/resolve
// thresholds against real Postgres) is exercised separately; what is asserted here is the
// decision logic that determines whether a person gets woken up.
const { severityFor } = require('./state');
const { classifyBody, identityMismatch } = require('./probes');

const site = (over = {}) => ({ id: 'ctm', name: 'CTM', rails: ['razorpay'], ...over });
const noRails = (over = {}) => ({ id: 'law', name: 'Law', rails: [], ...over });
const siteMap = new Map([['ctm', site()], ['law', noRails()]]);

const target = (over = {}) => ({ id: 'x', kind: 'service', name: 'svc', siteIds: ['ctm'], tier: 'tier-2', ...over });

// ── Severity ─────────────────────────────────────────────────────────────────
test('a payment-taking property down is critical', () => {
    assert.equal(severityFor(target({ kind: 'website' }), 'down', siteMap), 'critical');
    assert.equal(severityFor(target({ kind: 'auth' }), 'down', siteMap), 'critical');
    assert.equal(severityFor(target({ kind: 'money' }), 'down', siteMap), 'critical');
});

test('a property that takes no money is a warning, not a page', () => {
    assert.equal(severityFor(target({ kind: 'website', siteIds: ['law'] }), 'down', siteMap), 'warning');
    assert.equal(severityFor(target({ kind: 'auth', siteIds: ['law'] }), 'down', siteMap), 'warning');
});

test('tier-0 is critical regardless of which property it backs', () => {
    assert.equal(severityFor(target({ tier: 'tier-0', siteIds: ['law'] }), 'down', siteMap), 'critical');
    assert.equal(severityFor(target({ tier: 'tier-0', siteIds: [] }), 'down', siteMap), 'critical');
});

test('a datastore is always critical — everything sits on it', () => {
    assert.equal(severityFor(target({ kind: 'datastore', siteIds: [] }), 'down', siteMap), 'critical');
});

test('degraded is a warning even on a payment site — it is slow, not gone', () => {
    assert.equal(severityFor(target({ kind: 'website' }), 'degraded', siteMap), 'warning');
});

// ── Service identity ─────────────────────────────────────────────────────────
test('a port answered by a different service is a mismatch', () => {
    assert.equal(identityMismatch('inventory-service', 'cms-service'), true);
});

test('a service naming itself correctly is not a mismatch', () => {
    assert.equal(identityMismatch('cms-service', 'cms-service'), false);
});

test('a service that does not self-identify cannot be judged', () => {
    // Reporting a mismatch here would mark every service without a `service` field degraded.
    assert.equal(identityMismatch('cms-service', undefined), false);
});

test('known pm2 aliases are not mismatches', () => {
    assert.equal(identityMismatch('proxy-platform', 'proxy-service'), false);
    assert.equal(identityMismatch('realtime-telemetry', 'realtime-platform'), false);
});

// ── Website body classification ──────────────────────────────────────────────
test('a Next.js error shell served with a 200 counts as down', () => {
    const r = classifyBody(200, 'Application error: a client-side exception has occurred', 400, null);
    assert.equal(r.status, 'down');
    assert.match(r.reason, /application error/i);
});

test('an implausibly small 200 is degraded, not healthy', () => {
    const r = classifyBody(200, 'ok', 900, null);
    assert.equal(r.status, 'degraded');
});

test('a certificate expiring inside two weeks is surfaced before it fires', () => {
    const r = classifyBody(200, 'x'.repeat(2000), 400, 9);
    assert.equal(r.status, 'degraded');
    assert.match(r.reason, /9 day/);
});

test('a healthy page with a long-lived certificate is up', () => {
    const r = classifyBody(200, 'x'.repeat(2000), 400, 75);
    assert.equal(r.status, 'up');
    assert.equal(r.reason, undefined);
});

test('a non-2xx is down and says which code', () => {
    const r = classifyBody(503, 'x'.repeat(2000), 400, 75);
    assert.equal(r.status, 'down');
    assert.match(r.reason, /503/);
});

test('every degraded verdict states a cause', () => {
    // A degraded pill with no reason is unactionable, which is the failure mode this page exists
    // to avoid — so the invariant is asserted rather than left to review.
    for (const args of [[200, 'ok', 900, null], [200, 'x'.repeat(2000), 400, 3], [200, 'x'.repeat(2000), 9000, 75]]) {
        const r = classifyBody(...args);
        if (r.status === 'degraded' || r.status === 'down') assert.ok(r.reason, `no reason for ${JSON.stringify(args)}`);
    }
});
