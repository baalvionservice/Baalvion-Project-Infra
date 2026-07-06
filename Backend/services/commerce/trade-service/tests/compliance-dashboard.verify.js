'use strict';
/**
 * Phase 2 Trust/Verification/Compliance Foundation — Step 16 (Compliance
 * Dashboard) standalone verification harness. jest is broken repo-wide, so this
 * exercises the real HTTP surface + DB via supertest.
 *
 *   node tests/compliance-dashboard.verify.js
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

    await t('setup: org with a submitted tax registration + an open fraud signal + high risk', async () => {
        org = await db.Organization.create({ tenant_id: tenantId, name: 'Dashboard Verify Co', type: 'seller', status: 'active', country: 'IN' });
        const gstin = await db.TaxIdType.findOne({ where: { country_code: 'IN', type_code: 'GSTIN' } });
        await request(app).post('/v1/tax_registrations').set(buyerHeaders).send({ org_id: org.id, tax_id_type_id: gstin.id, tax_id_value: '27AAPFU0939F1ZV' });
        await request(app).post('/v1/risk_assessments/compute').set(buyerHeaders).send({ org_id: org.id });
        await db.FraudSignal.create({ tenant_id: tenantId, org_id: org.id, signal_type: 'suspicious_document', severity: 'critical', status: 'open' });
    });

    await t('a non-reviewer cannot reach the dashboard', async () => {
        const res = await request(app).get('/v1/compliance_dashboard').set(buyerHeaders);
        assert.strictEqual(res.status, 403, JSON.stringify(res.body));
    });

    await t('GET /v1/compliance_dashboard aggregates pending/risk/fraud/country stats across tenants', async () => {
        const res = await request(app).get('/v1/compliance_dashboard').set(reviewerHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        const d = res.body.data;

        assert.ok(d.pending_verifications.total >= 1);
        const taxPending = d.pending_verifications.by_category.find((r) => r.category === 'tax' && r.status === 'submitted');
        assert.ok(taxPending, 'expected at least one pending tax item');

        assert.ok(d.high_risk_organizations.by_level.some((r) => ['high', 'critical'].includes(r.risk_level)));
        assert.ok(d.high_risk_organizations.top.some((r) => r.org_id === org.id));

        assert.ok(d.fraud_alerts.open >= 1);
        assert.ok(d.fraud_alerts.by_severity.some((r) => r.severity === 'critical'));

        const countryRow = d.country_stats.find((c) => c.country === 'IN');
        assert.ok(countryRow, 'expected an IN country row');
        assert.ok(countryRow.total_orgs >= 1);
    });

    await t('teardown', async () => {
        await db.FraudSignal.destroy({ where: { org_id: org.id } });
        await db.OrgRiskAssessment.destroy({ where: { org_id: org.id } });
        await db.VerificationChecklistItem.destroy({ where: { org_id: org.id } });
        await db.TaxRegistration.destroy({ where: { org_id: org.id }, force: true });
        await org.destroy();
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) failures.forEach((f) => console.log(`FAILED: ${f.name}: ${f.message}`));
    await db.sequelize.close();
    process.exit(fail ? 1 : 0);
})();
