'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 20 (Verified Badge +
 * Phase 1 Integration) standalone verification harness. jest is broken repo-wide,
 * so this exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/verified-badge-integration.verify.js
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

    await t('setup: create org, seed a 5-star rating so feedback is strong', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, code: `BADGE-${Date.now()}`, name: 'Badge Verify Co', type: 'seller', status: 'active', country: 'IN' });
        await request(app).post('/v1/reputation/ratings').set(buyerHeaders).send({ ratee_org_id: org.id, role: 'seller', rating_value: 5 });
    });

    await t('GET /v1/organizations/:id exposes the additive verification summary, badge false pre-verification', async () => {
        const res = await request(app).get(`/v1/organizations/${org.id}`).set(buyerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.name, 'Badge Verify Co'); // existing fields untouched
        assert.strictEqual(res.body.data.verified_badge, false);
        assert.ok('verification' in res.body.data);
    });

    await t('approving every checklist category + computing a strong trust score flips the badge', async () => {
        const nonRiskTrust = db.VerificationChecklistItem.CATEGORIES.filter((c) => c !== 'risk' && c !== 'trust_score');
        await db.VerificationChecklistItem.bulkCreate(
            nonRiskTrust.map((category) => ({ tenant_id: tenantId, org_id: org.id, category, status: 'approved', item_count: 1, approved_count: 1 })),
            { updateOnDuplicate: ['status', 'item_count', 'approved_count'] },
        );
        await request(app).post('/v1/risk_assessments/compute').set(buyerHeaders).send({ org_id: org.id });
        // risk category itself needs to be 'approved' too (low/medium risk_level maps to approved) — recompute drives that.
        const scoreRes = await request(app).post('/v1/trust_scores/compute').set(buyerHeaders).send({ org_id: org.id });
        assert.ok(scoreRes.body.data.score >= 60, `expected trust score >= 60, got ${scoreRes.body.data.score}`);

        const org2 = await db.Organization.findByPk(org.id);
        assert.strictEqual(org2.verified_badge, true, 'expected the badge to flip true');
        assert.ok(org2.badge_issued_at);
    });

    await t('GET /v1/organizations/:id now reflects the badge + trust score + reputation', async () => {
        const res = await request(app).get(`/v1/organizations/${org.id}`).set(buyerHeaders);
        assert.strictEqual(res.body.data.verified_badge, true);
        assert.ok(res.body.data.verification.trust_score >= 60);
        assert.ok(['low', 'medium'].includes(res.body.data.verification.risk_level));
        const sellerRep = res.body.data.verification.reputation.find((r) => r.role === 'seller');
        assert.strictEqual(sellerRep.avg_rating, 5);
    });

    await t('an open critical fraud signal revokes the badge on next recompute', async () => {
        await db.FraudSignal.create({ tenant_id: tenantId, org_id: org.id, signal_type: 'suspicious_document', severity: 'critical', status: 'open' });
        await request(app).post('/v1/trust_scores/compute').set(buyerHeaders).send({ org_id: org.id }); // any checklist recompute re-derives the badge

        const org2 = await db.Organization.findByPk(org.id);
        assert.strictEqual(org2.verified_badge, false, 'expected the badge to be revoked once a critical fraud signal opens');
        assert.strictEqual(org2.badge_issued_at, null);
    });

    await t('teardown', async () => {
        await db.FraudSignal.destroy({ where: { org_id: org.id } });
        await db.ReputationRating.destroy({ where: { ratee_org_id: org.id } });
        await db.ReputationSummary.destroy({ where: { org_id: org.id } });
        await db.TrustScore.destroy({ where: { org_id: org.id } });
        await db.OrgRiskAssessment.destroy({ where: { org_id: org.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
