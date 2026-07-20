'use strict';
// Chain-of-custody / authenticity-timeline additions to consignmentService: getItemTimeline,
// addOwnershipRecord, listMyCertificates. Models stubbed (no DB), same style as
// consignmentService.test.js / ownership.test.js.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const { test } = require('node:test');
const assert = require('node:assert');

const models = require('../models');
const svc = require('../service/consignmentService');

const STORE = 'store-1';
const OWNER = '100';
const actor = (userId, isStaff = false) => ({ userId, requestId: 'req-1', isStaff: async () => isStaff });
const OWNER_ACTOR = actor(OWNER);
const OTHER_ACTOR = actor('200');
const ANON_ACTOR = actor(null);
const ADMIN_ACTOR = actor('999', true);

async function statusOf(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }

// ──────────────────────── getItemTimeline ────────────────────────
test('getItemTimeline: owner sees a chronologically-merged feed of custody + authentication + certificate events', async () => {
    models.ConsignmentRequest.findOne = async ({ where }) =>
        (where.id === 'req-1' && where.storeId === STORE) ? { id: 'req-1', userId: OWNER, ownerSessionId: null } : null;
    models.ConsignmentItem.findOne = async ({ where }) =>
        (where.id === 'item-1' && where.consignmentRequestId === 'req-1') ? { id: 'item-1' } : null;
    models.ItemOwnershipRecord.findAll = async () => [
        { eventType: 'consignor_submission', eventDate: new Date('2026-01-01T00:00:00Z'), ownerLabel: 'Jane Seller', location: null, notes: null },
        { eventType: 'platform_custody', eventDate: new Date('2026-01-03T00:00:00Z'), ownerLabel: 'Amarisé Maison Avenue', location: null, notes: null },
    ];
    models.ItemAuthentication.findAll = async () => [
        { status: 'authenticated', decidedAt: new Date('2026-01-05T00:00:00Z'), updatedAt: new Date('2026-01-05T00:00:00Z'), authenticatorName: 'Expert A', confidence: 'high', findings: 'Genuine' },
        { status: 'pending', decidedAt: null, updatedAt: new Date('2026-01-02T00:00:00Z'), authenticatorName: null, confidence: null, findings: null },
    ];
    models.CertificateOfAuthenticity.findAll = async () => [
        { status: 'valid', issuedAt: new Date('2026-01-06T00:00:00Z'), issuerName: 'Expert A', code: 'COA-1', id: 'cert-1' },
        { status: 'revoked', issuedAt: new Date('2026-01-07T00:00:00Z'), issuerName: 'Expert A', code: 'COA-2', id: 'cert-2' },
    ];

    const out = await svc.getItemTimeline(STORE, 'req-1', 'item-1', OWNER_ACTOR);
    assert.equal(out.itemId, 'item-1');
    // pending authentication + revoked certificate are excluded — only real, finalized events surface.
    assert.equal(out.events.length, 4);
    assert.deepEqual(out.events.map((e) => e.type), [
        'consignor_submission', 'platform_custody', 'authentication_authenticated', 'certificate_issued',
    ]);
    // Chronological order is enforced by date, not insertion order.
    for (let i = 1; i < out.events.length; i++) {
        assert.ok(new Date(out.events[i].date) >= new Date(out.events[i - 1].date));
    }
    assert.equal(out.events[3].code, 'COA-1');
});

test('getItemTimeline: a different user is denied (403), staff is allowed', async () => {
    models.ConsignmentRequest.findOne = async () => ({ id: 'req-1', userId: OWNER, ownerSessionId: null });
    models.ConsignmentItem.findOne = async () => ({ id: 'item-1' });
    models.ItemOwnershipRecord.findAll = async () => [];
    models.ItemAuthentication.findAll = async () => [];
    models.CertificateOfAuthenticity.findAll = async () => [];

    assert.equal(await statusOf(() => svc.getItemTimeline(STORE, 'req-1', 'item-1', OTHER_ACTOR)), 403);
    assert.equal(await statusOf(() => svc.getItemTimeline(STORE, 'req-1', 'item-1', ANON_ACTOR)), 403);
    assert.equal(await statusOf(() => svc.getItemTimeline(STORE, 'req-1', 'item-1', ADMIN_ACTOR)), 200);
});

test('getItemTimeline: 404s when the request or item does not exist', async () => {
    models.ConsignmentRequest.findOne = async () => null;
    assert.equal(await statusOf(() => svc.getItemTimeline(STORE, 'missing', 'item-1', OWNER_ACTOR)), 404);

    models.ConsignmentRequest.findOne = async () => ({ id: 'req-1', userId: OWNER, ownerSessionId: null });
    models.ConsignmentItem.findOne = async () => null;
    assert.equal(await statusOf(() => svc.getItemTimeline(STORE, 'req-1', 'missing-item', OWNER_ACTOR)), 404);
});

// ──────────────────────── addOwnershipRecord ────────────────────────
test('addOwnershipRecord: ops can record a manual custody event (prior_ownership/sold/returned)', async () => {
    models.ConsignmentItem.findOne = async () => ({ id: 'item-1' });
    models.ConsignmentRequest.findOne = async () => ({ id: 'req-1' });
    let created = null;
    models.ItemOwnershipRecord.create = async (data) => {
        created = data;
        return { toJSON: () => ({ id: 'rec-1', ...data }) };
    };

    const out = await svc.addOwnershipRecord(STORE, 'req-1', 'item-1', { eventType: 'sold', ownerLabel: 'Buyer X', notes: 'Sold at auction' }, 42);
    assert.equal(out.id, 'rec-1');
    assert.equal(created.eventType, 'sold');
    assert.equal(created.ownerLabel, 'Buyer X');
    assert.equal(created.recordedBy, 42);
    assert.equal(created.storeId, STORE);
    assert.equal(created.consignmentItemId, 'item-1');
});

test('addOwnershipRecord: rejects auto-generated event types (consignor_submission/platform_custody) as invalid input', async () => {
    models.ConsignmentItem.findOne = async () => ({ id: 'item-1' });
    models.ConsignmentRequest.findOne = async () => ({ id: 'req-1' });
    assert.equal(
        await statusOf(() => svc.addOwnershipRecord(STORE, 'req-1', 'item-1', { eventType: 'platform_custody' }, 42)),
        400,
    );
    assert.equal(
        await statusOf(() => svc.addOwnershipRecord(STORE, 'req-1', 'item-1', { eventType: 'consignor_submission' }, 42)),
        400,
    );
});

test('addOwnershipRecord: 404s when the item or request does not exist', async () => {
    models.ConsignmentItem.findOne = async () => null;
    assert.equal(await statusOf(() => svc.addOwnershipRecord(STORE, 'req-1', 'missing', { eventType: 'sold' }, 42)), 404);

    models.ConsignmentItem.findOne = async () => ({ id: 'item-1' });
    models.ConsignmentRequest.findOne = async () => null;
    assert.equal(await statusOf(() => svc.addOwnershipRecord(STORE, 'missing-req', 'item-1', { eventType: 'sold' }, 42)), 404);
});

// ──────────────────────── listMyCertificates ────────────────────────
test('listMyCertificates: returns [] for a guest (no userId) without querying the database', async () => {
    let called = false;
    models.CertificateOfAuthenticity.findAll = async () => { called = true; return []; };
    const out = await svc.listMyCertificates(STORE, null);
    assert.deepEqual(out, []);
    assert.equal(called, false, 'no DB query for an unauthenticated caller');
});

test('listMyCertificates: returns the authenticated seller\'s issued certificates', async () => {
    models.CertificateOfAuthenticity.findAll = async ({ where, include }) => {
        assert.equal(where.storeId, STORE);
        assert.ok(Array.isArray(include));
        return [{ toJSON: () => ({ id: 'cert-1', code: 'COA-1', brand: 'Hermès' }) }];
    };
    const out = await svc.listMyCertificates(STORE, OWNER);
    assert.equal(out.length, 1);
    assert.equal(out[0].code, 'COA-1');
});
