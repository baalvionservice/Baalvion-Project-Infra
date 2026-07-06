'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 4 (Tax Verification)
 * standalone verification harness. jest is broken repo-wide, so this exercises the
 * real HTTP surface + DB via supertest.
 *
 *   node tests/tax-verification.verify.js
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
    let gstin;
    let taxRegId;

    await t('setup: create org + look up IN:GSTIN tax id type', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Tax Verify Co', type: 'seller', status: 'active' });
        gstin = await db.TaxIdType.findOne({ where: { country_code: 'IN', type_code: 'GSTIN' } });
        assert.ok(gstin);
    });

    await t('POST /v1/tax_registrations rejects a malformed GSTIN', async () => {
        const res = await request(app)
            .post('/v1/tax_registrations')
            .set(buyerHeaders)
            .send({ org_id: org.id, tax_id_type_id: gstin.id, tax_id_value: 'not-a-gstin' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
        assert.strictEqual(res.body.error.code, 'INVALID_TAX_ID_FORMAT');
    });

    await t('POST /v1/tax_registrations accepts a well-formed GSTIN', async () => {
        const res = await request(app)
            .post('/v1/tax_registrations')
            .set(buyerHeaders)
            .send({ org_id: org.id, tax_id_type_id: gstin.id, tax_id_value: '27AAPFU0939F1ZV' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        taxRegId = res.body.data.id;
    });

    await t('checklist tax category is submitted', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const tax = res.body.data.checklist.find((i) => i.category === 'tax');
        assert.strictEqual(tax.status, 'submitted');
    });

    await t('resubmitting the same tax_id_type updates the existing row (unique per org+type)', async () => {
        const res = await request(app)
            .post('/v1/tax_registrations')
            .set(buyerHeaders)
            .send({ org_id: org.id, tax_id_type_id: gstin.id, tax_id_value: '29AAPFU0939F1ZM' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.id, taxRegId);
        const count = await db.TaxRegistration.count({ where: { org_id: org.id } });
        assert.strictEqual(count, 1);
    });

    await t('admin approves the tax registration, checklist flips to approved', async () => {
        const res = await request(app).patch(`/v1/tax_registrations/${taxRegId}/approve`).set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.data.verified_at);

        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const tax = center.body.data.checklist.find((i) => i.category === 'tax');
        assert.strictEqual(tax.status, 'approved');
    });

    await t('rejects an unknown tax_id_type_id', async () => {
        const res = await request(app)
            .post('/v1/tax_registrations')
            .set(buyerHeaders)
            .send({ org_id: org.id, tax_id_type_id: '00000000-0000-0000-0000-000000000000', tax_id_value: 'X' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
    });

    await t('teardown', async () => {
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.TaxRegistration.destroy({ where: { org_id: org.id }, force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
