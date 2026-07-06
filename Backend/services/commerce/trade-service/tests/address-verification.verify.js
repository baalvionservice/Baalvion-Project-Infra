'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 6 (Address Verification)
 * standalone verification harness. jest is broken repo-wide, so this exercises the
 * real HTTP surface + DB via supertest.
 *
 *   node tests/address-verification.verify.js
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
    let registeredId;
    let factoryAddressId;

    await t('setup: create org', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Address Verify Co', type: 'seller', status: 'active' });
    });

    await t('POST /v1/verified_addresses submits a registered office', async () => {
        const res = await request(app)
            .post('/v1/verified_addresses')
            .set(buyerHeaders)
            .send({ org_id: org.id, address_type: 'registered_office', line1: '221B Baker Street', city: 'Mumbai', country: 'IN' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        registeredId = res.body.data.id;
    });

    await t('checklist address category is submitted', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const address = res.body.data.checklist.find((i) => i.category === 'address');
        assert.strictEqual(address.status, 'submitted');
        assert.strictEqual(address.item_count, 1);
    });

    await t('a factory address does NOT affect the address checklist category', async () => {
        const res = await request(app)
            .post('/v1/verified_addresses')
            .set(buyerHeaders)
            .send({ org_id: org.id, address_type: 'factory', line1: 'Plot 7, Industrial Area', country: 'IN' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        factoryAddressId = res.body.data.id;

        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const address = center.body.data.checklist.find((i) => i.category === 'address');
        const factory = center.body.data.checklist.find((i) => i.category === 'factory');
        assert.strictEqual(address.item_count, 1); // still just the registered office
        assert.strictEqual(factory.status, 'not_started'); // owned by Facilities (Step 7), not here
    });

    await t('rejects an invalid address_type', async () => {
        const res = await request(app)
            .post('/v1/verified_addresses')
            .set(buyerHeaders)
            .send({ org_id: org.id, address_type: 'space_station', line1: 'Orbit' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
    });

    await t('POST /v1/verified_addresses/:id/evidence attaches supporting evidence', async () => {
        const doc = await db.TradeDocument.create({ tenant_id: tenantId, doc_type: 'utility_bill', title: 'Electric bill', status: 'available' });
        const res = await request(app)
            .post(`/v1/verified_addresses/${registeredId}/evidence`)
            .set(buyerHeaders)
            .send({ document_id: doc.id, evidence_type: 'utility_bill' });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        await doc.destroy({ force: true });
    });

    await t('admin approves the registered office, address category flips to approved', async () => {
        const res = await request(app).patch(`/v1/verified_addresses/${registeredId}/approve`).set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));

        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const address = center.body.data.checklist.find((i) => i.category === 'address');
        assert.strictEqual(address.status, 'approved');
    });

    await t('a foreign tenant cannot list this org\'s addresses', async () => {
        const res = await request(app)
            .get(`/v1/verified_addresses?org_id=${org.id}`)
            .set(gatewayHeaders({ userId: 'u-x', orgId: 'T-OTHER', roles: ['buyer'] }));
        assert.strictEqual(res.status, 404, JSON.stringify(res.body));
    });

    await t('teardown', async () => {
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        // fk_address_evidence_address is ON DELETE CASCADE, so force-destroying the
        // addresses also removes their evidence rows.
        await db.VerifiedAddress.destroy({ where: { org_id: org.id }, force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
