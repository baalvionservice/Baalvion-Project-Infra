'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 14 (Reputation System)
 * standalone verification harness. jest is broken repo-wide, so this exercises the
 * real HTTP surface + DB via supertest. Also confirms the Step 13 Trust Score
 * feedback component picks up real ratings once they exist (forward-compat wiring).
 *
 *   node tests/reputation-system.verify.js
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
    let seller;

    await t('setup: create a seller org', async () => {
        seller = await db.Organization.create({ tenant_id: tenantId, name: 'Reputation Verify Seller', type: 'seller', status: 'active' });
    });

    await t('rejects an out-of-range rating_value', async () => {
        const res = await request(app).post('/v1/reputation/ratings').set(buyerHeaders).send({ ratee_org_id: seller.id, role: 'seller', rating_value: 9 });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
    });

    await t('submits three ratings for the seller', async () => {
        for (const value of [5, 4, 3]) {
            const res = await request(app)
                .post('/v1/reputation/ratings')
                .set(buyerHeaders)
                .send({ ratee_org_id: seller.id, role: 'seller', rating_value: value, response_time_seconds: 3600 });
            assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        }
    });

    await t('GET /v1/reputation/summaries reflects the average', async () => {
        const res = await request(app).get(`/v1/reputation/summaries?org_id=${seller.id}`).set(buyerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        const sellerSummary = res.body.data.find((s) => s.role === 'seller');
        assert.strictEqual(Number(sellerSummary.avg_rating), 4);
        assert.strictEqual(sellerSummary.total_ratings, 3);
        assert.strictEqual(sellerSummary.avg_response_time, 3600);
    });

    await t('GET /v1/reputation/ratings lists all three ratings', async () => {
        const res = await request(app).get(`/v1/reputation/ratings?ratee_org_id=${seller.id}`).set(buyerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.total, 3);
    });

    await t('trust score feedback component now reads the real 4/5 average instead of the neutral default', async () => {
        const res = await request(app).post('/v1/trust_scores/compute').set(buyerHeaders).send({ org_id: seller.id });
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.breakdown.feedback, 80); // (4/5)*100
    });

    await t('teardown', async () => {
        await db.TrustScore.destroy({ where: { org_id: seller.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: seller.id } });
        await db.ReputationSummary.destroy({ where: { org_id: seller.id } });
        await db.ReputationRating.destroy({ where: { ratee_org_id: seller.id } });
        await seller.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
