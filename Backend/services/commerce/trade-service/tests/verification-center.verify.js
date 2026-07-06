'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 1 (Foundation) standalone
 * verification harness. jest is broken repo-wide (see other *.verify.js files), so
 * this exercises the real HTTP surface + DB via supertest against the exported app,
 * signing v1 gateway headers the same way bffBridge.verifyGatewayIdentity expects.
 *
 *   node tests/verification-center.verify.js
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
    const rolesJson = JSON.stringify(roles);
    const sig = crypto.createHmac('sha256', secret).update(`${userId}.${orgId}.${roles.join(',')}`).digest('hex');
    return {
        'x-user-id': userId,
        'x-org-id': orgId,
        'x-roles': rolesJson,
        'x-gateway-signature': sig,
    };
}

(async () => {
    const tenantId = `T-VERIFY-${Date.now()}`;
    let org;

    await t('setup: create a fresh organization', async () => {
        org = await db.Organization.create({
            tenant_id: tenantId,
            name: 'Verify Foundation Co',
            type: 'buyer',
            status: 'active',
        });
        assert.ok(org.id);
        assert.strictEqual(org.verified_badge, false);
    });

    await t('GET /v1/verification_center/:orgId returns all 15 categories as not_started', async () => {
        const res = await request(app)
            .get(`/v1/verification_center/${org.id}`)
            .set(gatewayHeaders({ userId: 'u-1', orgId: tenantId, roles: ['admin'] }));
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        const { checklist, verified_badge } = res.body.data;
        assert.strictEqual(verified_badge, false);
        assert.strictEqual(checklist.length, 15);
        assert.ok(checklist.every((i) => i.status === 'not_started'));
        const categories = checklist.map((i) => i.category).sort();
        assert.deepStrictEqual(categories, [
            'address', 'bank', 'business_registration', 'certificates', 'company',
            'compliance', 'directors', 'documents', 'factory', 'identity', 'products',
            'risk', 'tax', 'trust_score', 'warehouse',
        ].sort());
    });

    await t('GET /v1/verification_center/:orgId for a foreign-tenant org returns 404 (no existence leak)', async () => {
        const res = await request(app)
            .get(`/v1/verification_center/${org.id}`)
            .set(gatewayHeaders({ userId: 'u-2', orgId: 'T-SOMEONE-ELSE', roles: ['buyer'] }));
        assert.strictEqual(res.status, 404, JSON.stringify(res.body));
    });

    await t('GET /v1/verification_center/:orgId for a non-existent org returns 404', async () => {
        const res = await request(app)
            .get('/v1/verification_center/999999999')
            .set(gatewayHeaders({ userId: 'u-1', orgId: tenantId, roles: ['admin'] }));
        assert.strictEqual(res.status, 404, JSON.stringify(res.body));
    });

    await t('GET /v1/tax_id_types lists the seeded country-configurable tax identifiers', async () => {
        const res = await request(app)
            .get('/v1/tax_id_types')
            .set(gatewayHeaders({ userId: 'u-1', orgId: tenantId, roles: ['buyer'] }));
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        const codes = res.body.data.map((r) => `${r.country_code}:${r.type_code}`).sort();
        assert.deepStrictEqual(codes, ['AE:VAT', 'CN:USCC', 'IN:GSTIN', 'IN:IEC', 'IN:PAN', 'US:EIN']);
    });

    await t('GET /v1/tax_id_types?country_code=in filters case-insensitively', async () => {
        const res = await request(app)
            .get('/v1/tax_id_types?country_code=in')
            .set(gatewayHeaders({ userId: 'u-1', orgId: tenantId, roles: ['buyer'] }));
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.data.length, 3);
    });

    await t('checklist.recomputeCategory rolls up child statuses correctly', async () => {
        const checklist = require('../service/verification/checklist');
        assert.strictEqual(checklist.aggregateStatus([]), 'not_started');
        assert.strictEqual(checklist.aggregateStatus(['approved']), 'approved');
        assert.strictEqual(checklist.aggregateStatus(['approved', 'submitted']), 'submitted');
        assert.strictEqual(checklist.aggregateStatus(['approved', 'rejected']), 'rejected');
        assert.strictEqual(checklist.aggregateStatus(['under_review']), 'under_review');

        const item = await checklist.recomputeCategory({
            orgId: org.id, tenantId, category: 'identity', childStatuses: ['approved'],
        });
        assert.strictEqual(item.status, 'approved');
        assert.strictEqual(item.approved_count, 1);

        const refreshed = await checklist.getChecklist(org.id, tenantId);
        const identity = refreshed.find((i) => i.category === 'identity');
        assert.strictEqual(identity.status, 'approved');
    });

    await t('teardown: remove the test organization + its checklist rows', async () => {
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) { failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`)); }
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
