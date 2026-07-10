'use strict';
/**
 * Escrow/ledger-account money-flow — standalone verification harness (2026-07-10 session).
 *
 * Exercises the REAL end-to-end chain built this session against LIVE services — no mocks:
 *   - trade-service (this app, in-process via supertest)          — real Postgres (baalvion_db)
 *   - escrow-service (financial-services-java, real Spring Boot)  — http://localhost:13017
 *   - account-service                                             — http://localhost:13016
 *     (a contract-accurate stub in this sandbox: the real Java module has never been built here
 *     because Docker's build containers have no network access to Maven Central to resolve the
 *     parent POM. Every other Java finance service — escrow/ledger/settlement/audit — already had
 *     a pre-built image and required no rebuild, so this is the one seam. The stub implements
 *     AccountController's exact contract: POST /api/v1/accounts -> AccountResponse with a real
 *     UUID id, backed by a real Postgres table, not an in-memory fake.)
 *
 * Prerequisites (see Backend/services/commerce/financial-services-java/docker-compose.yml):
 *   docker compose -f Backend/docker-compose.yml up -d postgres redis   (baalvion-postgres, 5432)
 *   cd Backend/services/commerce/financial-services-java && docker compose up -d \
 *     escrow-service ledger-service settlement-service audit-service payment-service
 *   node <account-service-stub, see gti_e2e_flow_gap_analysis.md memory for the source> :13016
 *
 * Run: node tests/escrow-money-flow.verify.js
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.GATEWAY_SIGNING_SECRET = process.env.GATEWAY_SIGNING_SECRET || 'dev_gateway_signing_secret_change_me_min32';
process.env.FINANCE_WEBHOOK_SECRET = process.env.FINANCE_WEBHOOK_SECRET || 'dev_finance_webhook_secret_change_me_min32';
process.env.FINANCE_ENABLED = 'true';
process.env.SVC_ACCOUNT = process.env.SVC_ACCOUNT || 'http://localhost:13016';
process.env.SVC_ESCROW = process.env.SVC_ESCROW || 'http://localhost:13017';
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

function webhookHeaders(rawBody, eventType) {
    const sig = crypto.createHmac('sha256', process.env.FINANCE_WEBHOOK_SECRET).update(rawBody).digest('hex');
    return {
        'X-Webhook-Signature': `sha256=${sig}`,
        'X-Webhook-Event': eventType,
        'X-Webhook-Id': `verify-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
}

async function fetchJson(url, opts) {
    const res = await fetch(url, opts);
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
}

(async () => {
    const adminHeaders = gatewayHeaders({ userId: 'verify-super-admin', orgId: 'T-DEMO', roles: ['super_admin'] });
    let buyerAccountId;
    let sellerAccountId;
    let escrowId;
    let escrowRef;

    await t('resolves/provisions the buyer org (COMP-101) ledger account against real account-service', async () => {
        const res = await request(app).post('/v1/organizations/COMP-101/ledger-account').set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.data.ledgerAccountId, 'no ledgerAccountId in response');
        buyerAccountId = res.body.data.ledgerAccountId;
    });

    await t('resolves/provisions the seller org (COMP-102) ledger account against real account-service', async () => {
        const res = await request(app).post('/v1/organizations/COMP-102/ledger-account').set(adminHeaders);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.data.ledgerAccountId, 'no ledgerAccountId in response');
        sellerAccountId = res.body.data.ledgerAccountId;
    });

    await t('is idempotent — resolving the same org twice returns the SAME account id (no duplicate provisioning)', async () => {
        const res = await request(app).post('/v1/organizations/COMP-101/ledger-account').set(adminHeaders);
        assert.strictEqual(res.body.data.ledgerAccountId, buyerAccountId, 'a second resolve provisioned a different account');
    });

    await t('creates a REAL escrow hold on the real Java escrow-service (buyer->seller, real account ids)', async () => {
        escrowRef = `ESCROW-VERIFY-${Date.now()}`;
        const metadata = JSON.stringify({
            orderId: '1', buyerOrgId: 'COMP-101', sellerOrgId: 'COMP-102',
            buyerName: 'Apex Renewable Industries', sellerName: 'Global Power Systems',
        });
        const { status, body } = await fetchJson(`${process.env.SVC_ESCROW}/api/v1/escrow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                escrowRef, sourceAccountId: buyerAccountId, beneficiaryAccountId: sellerAccountId,
                amount: 50000.0, currency: 'USD', releaseCondition: 'MANUAL', metadata,
            }),
        });
        assert.strictEqual(status, 201, JSON.stringify(body));
        assert.strictEqual(body.status, 'HELD', `expected HELD, got ${body.status}`);
        escrowId = body.id;
    });

    let releasedBody;
    await t('releases the REAL escrow hold (the same call settlement-service.ts\'s triggerSettlement makes)', async () => {
        const { status, body } = await fetchJson(`${process.env.SVC_ESCROW}/api/v1/escrow/${escrowId}/release`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actor: 'verify-buyer-admin' }),
        });
        assert.strictEqual(status, 200, JSON.stringify(body));
        assert.strictEqual(body.status, 'RELEASED', `expected RELEASED, got ${body.status}`);
        releasedBody = body;
    });

    await t('projects the escrow.hold.released webhook onto trade.escrows (matches by escrow_ref)', async () => {
        const rawBody = JSON.stringify(releasedBody);
        const res = await request(app)
            .post('/v1/internal/finance-events')
            .set(webhookHeaders(rawBody, 'escrow.hold.released'))
            .set('Content-Type', 'application/json')
            .send(rawBody);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.projection.matched, true, `projection did not match: ${JSON.stringify(res.body)}`);
    });

    await t('the real trade.escrows row reflects status=released with order/buyer/seller linked', async () => {
        const row = await db.Escrow.findOne({ where: { escrow_ref: escrowRef } });
        assert.ok(row, 'no projection row found for escrow_ref');
        assert.strictEqual(row.status, 'released');
        assert.strictEqual(row.order_id, 1);
        assert.strictEqual(row.buyer_org_id, 'COMP-101');
        assert.strictEqual(row.seller_org_id, 'COMP-102');
        assert.strictEqual(row.java_escrow_id, escrowId);
    });

    await t('a malformed/unknown orderId in escrow metadata degrades to order_id=null instead of losing the projection', async () => {
        const badRef = `ESCROW-VERIFY-BADORDER-${Date.now()}`;
        const metadata = JSON.stringify({ orderId: 'not-a-number', buyerOrgId: 'COMP-101', sellerOrgId: 'COMP-102' });
        const payload = {
            id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', escrowRef: badRef, amount: 100, currency: 'USD', metadata,
        };
        const rawBody = JSON.stringify(payload);
        const res = await request(app)
            .post('/v1/internal/finance-events')
            .set(webhookHeaders(rawBody, 'escrow.hold.created'))
            .set('Content-Type', 'application/json')
            .send(rawBody);
        assert.strictEqual(res.status, 200, JSON.stringify(res.body));
        assert.strictEqual(res.body.projection.matched, true, `expected graceful degradation, got: ${JSON.stringify(res.body)}`);
        const row = await db.Escrow.findOne({ where: { escrow_ref: badRef } });
        assert.ok(row, 'no projection row created for malformed-orderId escrow');
        assert.strictEqual(row.order_id, null, 'order_id should have degraded to null, not thrown');
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail > 0) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  - ${f.name}: ${f.message}`));
        process.exitCode = 1;
    }
    await db.sequelize.close();
})();
