'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 15 (Manual Review
 * Console) standalone verification harness. jest is broken repo-wide, so this
 * exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/manual-review-console.verify.js
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
    const reviewerHeaders = gatewayHeaders({ userId: 'reviewer-1', orgId: 'T-ADMIN', roles: ['reviewer'] });
    let org;
    let taxRegId;

    await t('setup: org + a submitted tax registration', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Review Console Verify Co', type: 'seller', status: 'active' });
        const gstin = await db.TaxIdType.findOne({ where: { country_code: 'IN', type_code: 'GSTIN' } });
        const res = await request(app).post('/v1/tax_registrations').set(buyerHeaders).send({ org_id: org.id, tax_id_type_id: gstin.id, tax_id_value: '27AAPFU0939F1ZV' });
        taxRegId = res.body.data.id;
    });

    await t('the reviewer role can reach the console (route-level requireRole)', async () => {
        const res = await request(app).get(`/v1/review_actions/queue?org_id=${org.id}`).set(reviewerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    });

    await t('a non-reviewer cannot reach the console', async () => {
        const res = await request(app).get('/v1/review_actions/queue').set(buyerHeaders);
        assert.strictEqual(res.status, 403, JSON.stringify(res.body));
    });

    await t('GET /v1/review_actions/queue surfaces the submitted tax registration', async () => {
        const res = await request(app).get(`/v1/review_actions/queue?org_id=${org.id}`).set(reviewerHeaders);
        const match = res.body.data.find((i) => i.reviewable_type === 'tax' && i.reviewable_id === taxRegId);
        assert.ok(match, 'expected the tax registration in the queue');
    });

    await t('POST /v1/review_actions approve applies the decision to the real entity', async () => {
        const res = await request(app)
            .post('/v1/review_actions')
            .set(reviewerHeaders)
            .send({ reviewable_type: 'tax', reviewable_id: taxRegId, action: 'approve', notes: 'looks good', org_id: org.id, tenant_id: org.tenant_id });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));

        const taxReg = await db.TaxRegistration.findByPk(taxRegId);
        assert.strictEqual(taxReg.status, 'approved');

        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const tax = center.body.data.checklist.find((i) => i.category === 'tax');
        assert.strictEqual(tax.status, 'approved');
    });

    await t('the approved item drops out of the pending queue', async () => {
        const res = await request(app).get(`/v1/review_actions/queue?org_id=${org.id}`).set(reviewerHeaders);
        const match = res.body.data.find((i) => i.reviewable_type === 'tax' && i.reviewable_id === taxRegId);
        assert.ok(!match, 'expected the approved tax registration to no longer be pending');
    });

    await t('GET /v1/review_actions returns the decision history for that item', async () => {
        const res = await request(app).get(`/v1/review_actions?reviewable_type=tax&reviewable_id=${taxRegId}`).set(reviewerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.length, 1);
        assert.strictEqual(res.body.data[0].action, 'approve');
        assert.strictEqual(res.body.data[0].notes, 'looks good');
    });

    await t('escalate requires escalated_to', async () => {
        const res = await request(app)
            .post('/v1/review_actions')
            .set(reviewerHeaders)
            .send({ reviewable_type: 'tax', reviewable_id: taxRegId, action: 'escalate' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
    });

    await t('compliance_rule evaluations cannot be directly approved/rejected', async () => {
        const anyRule = await db.ComplianceRule.findOne();
        const res = await request(app)
            .post('/v1/review_actions')
            .set(reviewerHeaders)
            .send({ reviewable_type: 'compliance_rule', reviewable_id: anyRule.id, action: 'approve' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
        assert.strictEqual(res.body.error.code, 'REVIEW_FAILED');
    });

    await t('teardown', async () => {
        await db.ReviewAction.destroy({ where: { org_id: org.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.TaxRegistration.destroy({ where: { org_id: org.id }, force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
