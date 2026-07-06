'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 8 (Product & Certificate
 * Verification) standalone verification harness. jest is broken repo-wide, so this
 * exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/product-certificate-verification.verify.js
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
    let certId;

    await t('setup: create org', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Cert Verify Co', type: 'seller', status: 'active' });
    });

    await t('POST /v1/product_certificates submits a quality certificate', async () => {
        const res = await request(app)
            .post('/v1/product_certificates')
            .set(buyerHeaders)
            .send({ org_id: org.id, product_name: 'Cotton Fabric', certificate_type: 'quality', country_of_origin: 'IN' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        certId = res.body.data.id;
    });

    await t('checklist certificates category is submitted', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const certs = res.body.data.checklist.find((i) => i.category === 'certificates');
        assert.strictEqual(certs.status, 'submitted');
    });

    await t('rejects an invalid certificate_type', async () => {
        const res = await request(app)
            .post('/v1/product_certificates')
            .set(buyerHeaders)
            .send({ org_id: org.id, product_name: 'X', certificate_type: 'organic' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
    });

    await t('admin approves the certificate, checklist flips to approved', async () => {
        const res = await request(app).patch(`/v1/product_certificates/${certId}/approve`).set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));

        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const certs = center.body.data.checklist.find((i) => i.category === 'certificates');
        assert.strictEqual(certs.status, 'approved');
    });

    await t('teardown', async () => {
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.ProductCertificate.destroy({ where: { org_id: org.id }, force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
