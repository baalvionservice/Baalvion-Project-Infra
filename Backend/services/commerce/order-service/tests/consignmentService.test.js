'use strict';
// Consignment state machine + certificate integrity. Models are stubbed (no DB) — we override the
// specific Sequelize model methods on the imported singletons, mirroring discount.test.js's
// sequelize.query stubbing style.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const { test } = require('node:test');
const assert = require('node:assert');

const models = require('../models');
const svc = require('../service/consignmentService');

const STORE = 'store-1';
async function statusOf(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }

// ──────────────────────── transition map (exported) ────────────────────────
test('CONSIGNMENT_TRANSITIONS encodes the forward-only luxury-resale lifecycle', () => {
    const T = svc.CONSIGNMENT_TRANSITIONS;
    assert.deepEqual(T.submitted, ['quoted', 'rejected', 'withdrawn']);
    assert.deepEqual(T.quoted, ['accepted', 'rejected', 'withdrawn']);
    assert.deepEqual(T.accepted, ['received', 'withdrawn']);
    assert.deepEqual(T.received, ['authenticating']);
    assert.deepEqual(T.authenticating, ['authenticated', 'rejected']);
    assert.deepEqual(T.authenticated, ['listed']);
    assert.deepEqual(T.listed, ['sold']);
    // Terminal states.
    assert.deepEqual(T.rejected, []);
    assert.deepEqual(T.sold, []);
    assert.deepEqual(T.withdrawn, []);
});

// ──────────────────────── updateConsignmentStatus (stubbed model) ────────────────────────
// Build a fake request row whose .update() captures what was written. findOne returns it; loadRequest
// (the second findOne with include) returns a plain snapshot.
function stubRequest(currentStatus) {
    const captured = {};
    const row = {
        id: 'req-1', storeId: STORE, status: currentStatus,
        update: async (u) => { Object.assign(captured, u); row.status = u.status; return row; },
        toJSON: () => ({ id: 'req-1', status: row.status }),
    };
    models.ConsignmentRequest.findOne = async (opts) => {
        // loadRequest passes an include; the transition lookup does not. Both return the same row here.
        if (opts && Array.isArray(opts.include)) return { toJSON: () => ({ id: 'req-1', status: row.status, items: [] }) };
        return row;
    };
    return { captured };
}

test('updateConsignmentStatus allows a legal forward transition and stamps processedBy/At', async () => {
    const { captured } = stubRequest('submitted');
    await svc.updateConsignmentStatus(STORE, 'req-1', { status: 'quoted', quoteAmount: 5000, quoteCurrency: 'USD', payoutType: 'consignment', commissionRate: 25 }, 42);
    assert.equal(captured.status, 'quoted');
    assert.equal(captured.quoteAmount, 5000);
    assert.equal(captured.quoteCurrency, 'USD');
    assert.equal(captured.payoutType, 'consignment');
    assert.equal(captured.commissionRate, 25);
    assert.equal(captured.processedBy, 42);
    assert.ok(captured.processedAt instanceof Date);
});

test('updateConsignmentStatus rejects an illegal jump with 409', async () => {
    stubRequest('submitted');
    assert.equal(await statusOf(() => svc.updateConsignmentStatus(STORE, 'req-1', { status: 'sold' }, 1)), 409);
});

test('updateConsignmentStatus rejects a transition out of a terminal state with 409', async () => {
    stubRequest('rejected');
    assert.equal(await statusOf(() => svc.updateConsignmentStatus(STORE, 'req-1', { status: 'quoted' }, 1)), 409);
});

test('updateConsignmentStatus 404s when the request does not exist', async () => {
    models.ConsignmentRequest.findOne = async () => null;
    assert.equal(await statusOf(() => svc.updateConsignmentStatus(STORE, 'missing', { status: 'quoted' }, 1)), 404);
});

// ──────────────────────── certificate integrity (pure) ────────────────────────
test('certificateHash is deterministic and changes when a field is tampered', () => {
    const base = { code: 'COA-1', serialNumber: 'SN-9', brand: 'Hermès', model: 'Birkin', conditionGrade: 'excellent', storeId: STORE };
    const h1 = svc.certificateHash(base);
    const h2 = svc.certificateHash({ ...base });
    assert.equal(h1, h2, 'same inputs → same hash');
    assert.equal(h1.length, 64, 'sha256 hex');
    assert.notEqual(h1, svc.certificateHash({ ...base, conditionGrade: 'fair' }), 'tampered grade → different hash');
});

// ──────────────────────── verifyCertificate (stubbed model, public) ────────────────────────
test('verifyCertificate returns only safe fields for a valid certificate', async () => {
    const code = 'COA-OK';
    const verificationHash = svc.certificateHash({ code, serialNumber: 'SN-1', brand: 'Chanel', model: 'Classic Flap', conditionGrade: 'pristine', storeId: STORE });
    models.CertificateOfAuthenticity.findOne = async () => ({
        code, storeId: STORE, status: 'valid', verificationHash,
        serialNumber: 'SN-1', brand: 'Chanel', model: 'Classic Flap', conditionGrade: 'pristine',
        issuerName: 'Expert A', issuedAt: new Date('2026-01-01T00:00:00Z'),
        // Fields that must NOT leak:
        consignmentItemId: 'item-secret', issuedBy: 7,
    });
    const out = await svc.verifyCertificate(STORE, code);
    assert.equal(out.valid, true);
    assert.equal(out.certificate.brand, 'Chanel');
    assert.equal(out.certificate.conditionGrade, 'pristine');
    assert.equal(out.certificate.consignmentItemId, undefined, 'internal id must not leak');
    assert.equal(out.certificate.issuedBy, undefined, 'issuer user id must not leak');
    assert.equal(out.certificate.verificationHash, undefined, 'raw hash must not leak');
});

test('verifyCertificate returns {valid:false} for an unknown code', async () => {
    models.CertificateOfAuthenticity.findOne = async () => null;
    assert.deepEqual(await svc.verifyCertificate(STORE, 'COA-NONE'), { valid: false });
});

test('verifyCertificate fails closed when the stored hash does not match (tampered row)', async () => {
    models.CertificateOfAuthenticity.findOne = async () => ({
        code: 'COA-TAMPER', storeId: STORE, status: 'valid',
        verificationHash: 'a'.repeat(64), // does not match a fresh hash of the fields below
        serialNumber: 'SN-2', brand: 'Gucci', model: 'Marmont', conditionGrade: 'good',
    });
    assert.deepEqual(await svc.verifyCertificate(STORE, 'COA-TAMPER'), { valid: false });
});

test('verifyCertificate reports a revoked certificate as not valid', async () => {
    models.CertificateOfAuthenticity.findOne = async () => ({ code: 'COA-REV', storeId: STORE, status: 'revoked' });
    const out = await svc.verifyCertificate(STORE, 'COA-REV');
    assert.equal(out.valid, false);
    assert.equal(out.status, 'revoked');
});
