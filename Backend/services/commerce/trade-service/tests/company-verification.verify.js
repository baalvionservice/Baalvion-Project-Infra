'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 3 (Company Verification +
 * Stakeholders) standalone verification harness. jest is broken repo-wide, so this
 * exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/company-verification.verify.js
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
    let stakeholderId;

    await t('setup: create org', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Company Verify Co', type: 'seller', status: 'active' });
    });

    await t('POST /v1/company_verifications/:orgId submits company profile', async () => {
        const res = await request(app)
            .post(`/v1/company_verifications/${org.id}`)
            .set(buyerHeaders)
            .send({ legal_company_name: 'Company Verify Co Pvt Ltd', registration_number: 'REG-123', business_type: 'private_limited' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.status, 'submitted');
    });

    await t('checklist company category is submitted', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const company = res.body.data.checklist.find((i) => i.category === 'company');
        assert.strictEqual(company.status, 'submitted');
    });

    await t('POST /v1/company_stakeholders adds a director', async () => {
        const res = await request(app)
            .post('/v1/company_stakeholders')
            .set(buyerHeaders)
            .send({ org_id: org.id, person_name: 'John Director', role: 'director', ownership_percentage: 40 });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        stakeholderId = res.body.data.id;
    });

    await t('checklist directors category is submitted with 1 item', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const directors = res.body.data.checklist.find((i) => i.category === 'directors');
        assert.strictEqual(directors.status, 'submitted');
        assert.strictEqual(directors.item_count, 1);
    });

    await t('rejects an invalid stakeholder role', async () => {
        const res = await request(app)
            .post('/v1/company_stakeholders')
            .set(buyerHeaders)
            .send({ org_id: org.id, person_name: 'Bad Role', role: 'ceo' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
    });

    await t('admin approves the company verification', async () => {
        const res = await request(app).patch(`/v1/company_verifications/${org.id}/approve`).set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.status, 'approved');
    });

    await t('admin approves the stakeholder, directors category flips to approved', async () => {
        const res = await request(app).patch(`/v1/company_stakeholders/${stakeholderId}/approve`).set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));

        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const directors = center.body.data.checklist.find((i) => i.category === 'directors');
        const company = center.body.data.checklist.find((i) => i.category === 'company');
        assert.strictEqual(directors.status, 'approved');
        assert.strictEqual(company.status, 'approved');
    });

    await t('deleting the stakeholder recomputes directors back to not_started', async () => {
        const res = await request(app).delete(`/v1/company_stakeholders/${stakeholderId}`).set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));

        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const directors = center.body.data.checklist.find((i) => i.category === 'directors');
        assert.strictEqual(directors.status, 'not_started');
        assert.strictEqual(directors.item_count, 0);
    });

    await t('a foreign-tenant caller gets 404 listing stakeholders for this org', async () => {
        const res = await request(app)
            .get(`/v1/company_stakeholders?org_id=${org.id}`)
            .set(gatewayHeaders({ userId: 'u-x', orgId: 'T-OTHER', roles: ['buyer'] }));
        assert.strictEqual(res.status, 404, JSON.stringify(res.body));
    });

    await t('teardown', async () => {
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.CompanyVerification.destroy({ where: { org_id: org.id }, force: true });
        await db.CompanyStakeholder.destroy({ where: { org_id: org.id }, force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
