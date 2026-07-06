'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 13 (Trust Score Engine)
 * standalone verification harness. jest is broken repo-wide, so this exercises the
 * real HTTP surface + DB via supertest.
 *
 *   node tests/trust-score.verify.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.GATEWAY_SIGNING_SECRET = process.env.GATEWAY_SIGNING_SECRET || 'test-gateway-secret';
process.env.RATE_LIMIT_DISABLED = 'true';

const assert = require('assert');
const crypto = require('crypto');
const request = require('supertest');
const db = require('../models');
const app = require('../index');

let pass = 0;
let fail = 0;
const failures = [];
async function t(name, fn) {
    try { await fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}

function gatewayHeaders({ userId, orgId, roles }) {
    const secret = process.env.GATEWAY_SIGNING_SECRET;
    const sig = crypto.createHmac('sha256', secret).update(`${userId}.${orgId}.${roles.join(',')}`).digest('hex');
    return { 'x-user-id': userId, 'x-org-id': orgId, 'x-roles': JSON.stringify(roles), 'x-gateway-signature': sig };
}

(async () => {
    const tenantId = `T-VERIFY-${Date.now()}`;
    const buyerHeaders = gatewayHeaders({ userId: 'u-1', orgId: tenantId, roles: ['buyer'] });
    let org;

    await t('setup: create org', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Trust Score Verify Co', type: 'seller', status: 'active' });
    });

    await t('GET /v1/trust_scores before computation returns 404', async () => {
        const res = await request(app).get(`/v1/trust_scores?org_id=${org.id}`).set(buyerHeaders);
        assert.strictEqual(res.status, 404, JSON.stringify(res.body));
    });

    await t('POST /v1/trust_scores/compute scores an unverified org low, with a neutral feedback default', async () => {
        const res = await request(app).post('/v1/trust_scores/compute').set(buyerHeaders).send({ org_id: org.id });
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.data.score < 50, `expected a low score, got ${res.body.data.score}`);
        assert.strictEqual(res.body.data.breakdown.feedback, 70); // no ReputationSummary yet → neutral default
        assert.strictEqual(res.body.data.breakdown.identity, 0);
    });

    await t('trust_score checklist category is approved once computed (the number, not a workflow decision)', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const trustScore = res.body.data.checklist.find((i) => i.category === 'trust_score');
        assert.strictEqual(trustScore.status, 'approved');
    });

    await t('approving identity/company/bank/compliance/documents raises the score on recompute', async () => {
        await db.VerificationChecklistItem.update({ status: 'approved' }, { where: { org_id: org.id, category: ['identity', 'company', 'bank', 'compliance', 'documents'] } });
        const res = await request(app).post('/v1/trust_scores/compute').set(buyerHeaders).send({ org_id: org.id });
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.data.score > 60, `expected a higher score, got ${res.body.data.score}`);
        assert.strictEqual(res.body.data.breakdown.identity, 100);
    });

    await t('history endpoint shows both runs with exactly one current', async () => {
        const res = await request(app).get(`/v1/trust_scores/history?org_id=${org.id}`).set(buyerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.length, 2);
        assert.strictEqual(res.body.data.filter((r) => r.is_current).length, 1);
    });

    await t('teardown', async () => {
        await db.TrustScore.destroy({ where: { org_id: org.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
