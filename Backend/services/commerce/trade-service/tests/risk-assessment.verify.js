'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 12 (Risk Assessment
 * Engine) standalone verification harness. jest is broken repo-wide, so this
 * exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/risk-assessment.verify.js
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

    await t('setup: create a brand-new, unverified org', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Risk Verify Co', type: 'seller', status: 'active' });
    });

    await t('GET /v1/risk_assessments before any computation returns 404', async () => {
        const res = await request(app).get(`/v1/risk_assessments?org_id=${org.id}`).set(buyerHeaders);
        assert.strictEqual(res.status, 404, JSON.stringify(res.body));
    });

    await t('POST /v1/risk_assessments/compute scores a brand-new org as high/critical risk', async () => {
        const res = await request(app).post('/v1/risk_assessments/compute').set(buyerHeaders).send({ org_id: org.id });
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.ok(['high', 'critical'].includes(res.body.data.risk_level), `expected high/critical, got ${res.body.data.risk_level}`);
        assert.strictEqual(res.body.data.factors.verification_completion, 0);
        assert.strictEqual(res.body.data.factors.trading_history_count, 0);
    });

    await t('checklist risk category reflects the computed level (under_review for high risk)', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const risk = res.body.data.checklist.find((i) => i.category === 'risk');
        assert.ok(['under_review', 'rejected'].includes(risk.status));
    });

    await t('GET /v1/risk_assessments now returns the current assessment', async () => {
        const res = await request(app).get(`/v1/risk_assessments?org_id=${org.id}`).set(buyerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.is_current, true);
    });

    await t('approving every checklist category then recomputing lowers the risk level', async () => {
        const nonRiskCategories = db.VerificationChecklistItem.CATEGORIES.filter((c) => c !== 'risk' && c !== 'trust_score');
        await db.VerificationChecklistItem.update({ status: 'approved' }, { where: { org_id: org.id, category: nonRiskCategories } });
        // simulate an older company (age factor)
        await org.update({ createdAt: new Date(Date.now() - 400 * 86400000) });

        const res = await request(app).post('/v1/risk_assessments/compute').set(buyerHeaders).send({ org_id: org.id });
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.factors.verification_completion, 1);
        assert.ok(['low', 'medium'].includes(res.body.data.risk_level), `expected low/medium, got ${res.body.data.risk_level}`);
    });

    await t('history endpoint shows both computation runs, newest first', async () => {
        const res = await request(app).get(`/v1/risk_assessments/history?org_id=${org.id}`).set(buyerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.length, 2);
        assert.ok(new Date(res.body.data[0].computed_at) >= new Date(res.body.data[1].computed_at));
        assert.strictEqual(res.body.data.filter((r) => r.is_current).length, 1);
    });

    await t('teardown', async () => {
        await db.OrgRiskAssessment.destroy({ where: { org_id: org.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
