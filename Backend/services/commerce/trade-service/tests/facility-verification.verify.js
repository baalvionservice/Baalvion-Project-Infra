'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 7 (Factory & Warehouse
 * Verification) standalone verification harness. jest is broken repo-wide, so this
 * exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/facility-verification.verify.js
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
    let address;
    let facilityId;

    await t('setup: create org + factory address', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Facility Verify Co', type: 'seller', status: 'active' });
        address = await db.VerifiedAddress.create({ tenant_id: tenantId, org_id: org.id, address_type: 'factory', line1: 'Plot 9', status: 'approved' });
    });

    await t('POST /v1/facilities submits a factory profile', async () => {
        const res = await request(app)
            .post('/v1/facilities')
            .set(buyerHeaders)
            .send({ org_id: org.id, facility_type: 'factory', address_id: address.id, production_capacity: '1000 units/day', employee_count: 50 });
        assert.strictEqual(res.status, 201, JSON.stringify(res.body));
        facilityId = res.body.data.id;
    });

    await t('checklist factory category is submitted, warehouse untouched', async () => {
        const res = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const factory = res.body.data.checklist.find((i) => i.category === 'factory');
        const warehouse = res.body.data.checklist.find((i) => i.category === 'warehouse');
        assert.strictEqual(factory.status, 'submitted');
        assert.strictEqual(warehouse.status, 'not_started');
    });

    await t('POST /v1/facilities/:id/inspection/request schedules inspection', async () => {
        const res = await request(app).post(`/v1/facilities/${facilityId}/inspection/request`).set(buyerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.inspection_status, 'scheduled');
    });

    await t('non-admin cannot record an inspection result', async () => {
        const res = await request(app).patch(`/v1/facilities/${facilityId}/inspection/result`).set(buyerHeaders).send({ passed: true });
        assert.strictEqual(res.status, 403, JSON.stringify(res.body));
    });

    await t('admin records a passing inspection', async () => {
        const res = await request(app).patch(`/v1/facilities/${facilityId}/inspection/result`).set(adminHeaders).send({ passed: true });
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.inspection_status, 'passed');
    });

    await t('admin approves the facility, factory checklist category flips to approved', async () => {
        const res = await request(app).patch(`/v1/facilities/${facilityId}/approve`).set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));

        const center = await request(app).get(`/v1/verification_center/${org.id}`).set(buyerHeaders);
        const factory = center.body.data.checklist.find((i) => i.category === 'factory');
        assert.strictEqual(factory.status, 'approved');
    });

    await t('rejects an invalid facility_type', async () => {
        const res = await request(app)
            .post('/v1/facilities')
            .set(buyerHeaders)
            .send({ org_id: org.id, facility_type: 'office' });
        assert.strictEqual(res.status, 422, JSON.stringify(res.body));
    });

    await t('teardown', async () => {
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.Facility.destroy({ where: { org_id: org.id }, force: true });
        await db.VerifiedAddress.destroy({ where: { org_id: org.id }, force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
