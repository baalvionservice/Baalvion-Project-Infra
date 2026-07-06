'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 10 (Compliance Engine)
 * standalone verification harness. jest is broken repo-wide, so this exercises the
 * real HTTP surface + DB via supertest.
 *
 *   node tests/compliance-rules-engine.verify.js
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
    const adminHeaders = gatewayHeaders({ userId: 'reviewer-1', orgId: 'T-ADMIN', roles: ['admin'] });
    let org;

    await t('setup: create an incomplete org (KP, no company/identity verification)', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Compliance Verify Co', type: 'seller', status: 'active', country: 'KP' });
    });

    await t('GET /v1/compliance_rules lists the seeded rules', async () => {
        const res = await request(app).get('/v1/compliance_rules').set(buyerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.data.length >= 5);
    });

    await t('POST /v1/compliance_rules/evaluate fails country_allowed + profile_complete for an incomplete KP org', async () => {
        const res = await request(app).post('/v1/compliance_rules/evaluate').set(buyerHeaders).send({ org_id: org.id });
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        const byCode = Object.fromEntries(res.body.data.map((r) => [r.rule_code, r]));
        assert.strictEqual(byCode.country_allowed.passed, false);
        assert.strictEqual(byCode.profile_complete.passed, false);
        assert.strictEqual(byCode.sanctions_clear.passed, true); // no screening on file → treated as clear
    });

    await t('compliance checklist category is rejected (a blocking rule failed)', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const compliance = res.body.data.checklist.find((i) => i.category === 'compliance');
        assert.strictEqual(compliance.status, 'rejected');
    });

    await t('fixing the country and completing company+identity flips compliance to approved', async () => {
        await org.update({ country: 'IN' });
        await db.VerificationChecklistItem.update({ status: 'approved' }, { where: { org_id: org.id, category: ['company', 'identity', 'documents'] } });

        const res = await request(app).post('/v1/compliance_rules/evaluate').set(buyerHeaders).send({ org_id: org.id });
        const byCode = Object.fromEntries(res.body.data.map((r) => [r.rule_code, r]));
        assert.strictEqual(byCode.country_allowed.passed, true);
        assert.strictEqual(byCode.profile_complete.passed, true);
        assert.strictEqual(byCode.mandatory_documents_complete.passed, true);

        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const compliance = center.body.data.checklist.find((i) => i.category === 'compliance');
        assert.strictEqual(compliance.status, 'approved');
    });

    await t('non-admin cannot create a new compliance rule', async () => {
        const res = await request(app)
            .post('/v1/compliance_rules')
            .set(buyerHeaders)
            .send({ rule_code: 'x', category: 'internal_policy', condition: { type: 'no_expired_items' } });
        assert.strictEqual(res.status, 403, JSON.stringify(res.body));
    });

    await t('admin can add a new data-driven rule without a code change', async () => {
        const res = await request(app)
            .post('/v1/compliance_rules')
            .set(adminHeaders)
            .send({ rule_code: `custom_${Date.now()}`, category: 'internal_policy', condition: { type: 'country_not_restricted', params: { blockedCountries: ['XX'] } }, severity: 'info' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        await db.ComplianceRule.destroy({ where: { id: res.body.data.id } });
    });

    await t('teardown', async () => {
        await db.ComplianceRuleEvaluation.destroy({ where: { org_id: org.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
