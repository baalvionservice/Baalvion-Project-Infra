'use strict';
// PUBLIC guest order lookup/tracking (email + orderNumber). Exercises the REAL service function with
// the data layer stubbed (mirrors guestReturnAndLink.test.js / ownership.test.js — no DB needed).
//   1. Correct orderNumber + email returns a SAFE tracking view (PII-minimised; no guest session,
//      customer id, internal metadata, or full street address).
//   2. Email matching is case-insensitive and whitespace-tolerant.
//   3. A wrong email, an unknown order number, and a missing field ALL return the SAME 404 (no oracle).
//   4. A registered order (email only on the customer record) is lookup-able by the customer email.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test-secret';

const { test } = require('node:test');
const assert = require('node:assert');

const cache = require('../service/cacheService');
cache.get = async () => null; cache.set = async () => {}; cache.del = async () => {}; cache.delPattern = async () => {};

const models = require('../models');
const orderService = require('../service/orderService');

const STORE = 'store-1';
const EMAIL = 'guest@example.com';
const ORDER_NUMBER = 'ORD-ABCD12-9F3A1C';

// A delivered GUEST order: customerId=null, recipient email on the shipping address, plus internal
// metadata (guest session / inventory locks) that MUST NOT leak through the public tracking view.
function guestOrder(overrides = {}) {
    const base = {
        id: 'ord-uuid-1',
        storeId: STORE,
        customerId: null,
        orderNumber: ORDER_NUMBER,
        status: 'processing',
        paymentStatus: 'paid',
        fulfillmentStatus: 'unfulfilled',
        currencyCode: 'USD',
        subtotal: 100, discountAmount: 0, shippingAmount: 0, taxAmount: 8, totalAmount: 108,
        createdAt: new Date('2026-06-23T00:00:00Z'),
        updatedAt: new Date('2026-06-23T01:00:00Z'),
        cancelledAt: null,
        shippingAddress: { firstName: 'Ava', lastName: 'Stone', address1: '1 Vault Rd', city: 'London', countryCode: 'GB', phone: '+44 700 900', email: EMAIL },
        billingAddress: null,
        metadata: { guestSessionId: 'cs_secret_session', inventoryLocks: [{ lockId: 'lk1' }], idempotencyKey: 'idem-xyz' },
        items: [{ name: 'Heritage Bag', variantName: 'Noir', sku: 'BAG-NOIR', quantity: 1, price: 100, total: 100, metadata: { internal: 'x' } }],
        ...overrides,
    };
    return { ...base, toJSON() { return base; } };
}

function stubOrder(order, shipment = null) {
    models.OrdersOrder.findOne = async ({ where }) =>
        (where.storeId === STORE && where.orderNumber === order.orderNumber) ? order : null;
    models.OrdersCustomer.findByPk = async () => null;
    models.OrdersShipment.findOne = async () => shipment;
}

async function status(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }

test('guest lookup: correct orderNumber + email returns a safe, PII-minimised tracking view', async () => {
    stubOrder(guestOrder());
    const view = await orderService.lookupGuestOrder(STORE, { email: EMAIL, orderNumber: ORDER_NUMBER });

    // Useful tracking fields are present.
    assert.equal(view.orderNumber, ORDER_NUMBER);
    assert.equal(view.status, 'processing');
    assert.equal(view.paymentStatus, 'paid');
    assert.equal(view.fulfillmentStatus, 'unfulfilled');
    assert.equal(view.totalAmount, 108);
    assert.equal(view.items.length, 1);
    assert.equal(view.items[0].name, 'Heritage Bag');
    // Coarse destination only.
    assert.deepEqual(view.shipTo, { city: 'London', countryCode: 'GB' });
    // No shipment created yet → shipment is null (not an error).
    assert.equal(view.shipment, null);

    // Sensitive fields are NOT leaked.
    const json = JSON.stringify(view);
    assert.equal(view.id, undefined, 'internal order id is not exposed');
    assert.equal(view.customerId, undefined);
    assert.equal(view.metadata, undefined, 'internal metadata is not exposed');
    assert.equal(view.shippingAddress, undefined, 'full address object is not exposed');
    assert.ok(!json.includes('cs_secret_session'), 'guest session id never leaks');
    assert.ok(!json.includes('1 Vault Rd'), 'street address never leaks');
    assert.ok(!json.includes('+44 700 900'), 'phone never leaks');
    assert.ok(!json.includes('idem-xyz'), 'idempotency key never leaks');
});

test('guest lookup: email match is case-insensitive and whitespace-tolerant', async () => {
    stubOrder(guestOrder());
    const view = await orderService.lookupGuestOrder(STORE, { email: `  ${EMAIL.toUpperCase()} `, orderNumber: ORDER_NUMBER });
    assert.equal(view.orderNumber, ORDER_NUMBER);
});

test('guest lookup: wrong email, unknown order number, and missing fields all return the SAME 404', async () => {
    stubOrder(guestOrder());
    assert.equal(await status(() => orderService.lookupGuestOrder(STORE, { email: 'someone-else@example.com', orderNumber: ORDER_NUMBER })), 404);
    assert.equal(await status(() => orderService.lookupGuestOrder(STORE, { email: EMAIL, orderNumber: 'ORD-NOPE-000000' })), 404);
    assert.equal(await status(() => orderService.lookupGuestOrder(STORE, { email: '', orderNumber: ORDER_NUMBER })), 404);
    assert.equal(await status(() => orderService.lookupGuestOrder(STORE, { email: EMAIL, orderNumber: '' })), 404);
});

test('guest lookup: a shipped order surfaces customer-shareable parcel tracking (carrier + number)', async () => {
    const shipment = {
        status: "in_transit",
        carrier: "DHL Express",
        trackingNumber: "JD0123456789",
        trackingUrl: "https://track.dhl.com/JD0123456789",
        shippedAt: new Date("2026-06-23T02:00:00Z"),
        deliveredAt: null,
        estimatedDelivery: new Date("2026-06-25T00:00:00Z"),
        events: [
            { status: "pending", message: "Label created", at: "2026-06-23T01:30:00Z" },
            { status: "in_transit", message: "Departed facility", location: "London", at: "2026-06-23T02:00:00Z" },
        ],
    };
    stubOrder(guestOrder({ status: "shipped" }), shipment);

    const view = await orderService.lookupGuestOrder(STORE, { email: EMAIL, orderNumber: ORDER_NUMBER });
    assert.ok(view.shipment, "shipment is present");
    assert.equal(view.shipment.carrier, "DHL Express");
    assert.equal(view.shipment.trackingNumber, "JD0123456789");
    assert.equal(view.shipment.trackingUrl, "https://track.dhl.com/JD0123456789");
    assert.equal(view.shipment.status, "in_transit");
    // Latest timeline event is surfaced.
    assert.equal(view.shipment.lastUpdate.status, "in_transit");
    assert.equal(view.shipment.lastUpdate.location, "London");
});

test('guest lookup: a registered order is findable by the linked customer email (no address email)', async () => {
    const order = guestOrder({
        customerId: 'cust-1',
        shippingAddress: { firstName: 'Ava', lastName: 'Stone', address1: '1 Vault Rd', city: 'London', countryCode: 'GB' },
    });
    models.OrdersOrder.findOne = async ({ where }) => (where.orderNumber === ORDER_NUMBER ? order : null);
    models.OrdersCustomer.findByPk = async (id) => (id === 'cust-1' ? { email: EMAIL } : null);
    models.OrdersShipment.findOne = async () => null;

    const view = await orderService.lookupGuestOrder(STORE, { email: EMAIL, orderNumber: ORDER_NUMBER });
    assert.equal(view.orderNumber, ORDER_NUMBER);
    // Still no customer id leaked even for a registered order.
    assert.equal(view.customerId, undefined);
});
