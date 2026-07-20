'use strict';
// Invoice generation (Priority-1 gap: OrdersInvoice had a model + migration but no generation
// logic). Models + @baalvion/upload are stubbed (no DB, no S3) — pdfkit itself is REAL (pure,
// in-memory, no I/O), so this genuinely exercises the PDF-rendering code path, not just the
// plumbing around it. Same require.cache injection style as inventoryReservation.test.js.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const path = require('path');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const P = (...p) => require.resolve(path.join(__dirname, '..', ...p));

function inject(absPath, exports) {
    require.cache[absPath] = { id: absPath, filename: absPath, loaded: true, exports };
}

const STORE = 'store-1';
const ORDER = {
    id: 'order-1', orderNumber: 'ORD-TEST-1', totalAmount: '199.99', currencyCode: 'USD',
    customerId: 'cust-1', metadata: {},
    billingAddress: { firstName: 'Jane', lastName: 'Doe', line1: '1 Main St', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US' },
};
const ITEMS = [{ name: 'Vintage Clutch', sku: 'VC-1', quantity: 1, price: '199.99', total: '199.99' }];

let putObjectCalls;
let invoiceRows; // in-memory OrdersInvoice rows keyed by orderId

function makeInvoiceRow(data) {
    return {
        ...data,
        update: async function (patch) { Object.assign(this, patch); },
        toJSON: function () { const { update, toJSON, ...rest } = this; return rest; },
    };
}

function loadInvoiceService() {
    putObjectCalls = [];
    inject(require.resolve('@baalvion/upload'), {
        putObject: async (key, buf, contentType) => { putObjectCalls.push({ key, size: buf.length, contentType }); return key; },
        generateSignedDownloadUrl: async (key) => `https://signed.example.com/${key}`,
    });

    const OrdersInvoice = {
        async findOrCreate({ where, defaults }) {
            const existing = invoiceRows.find((r) => r.orderId === where.orderId);
            if (existing) return [existing, false];
            const row = makeInvoiceRow({ id: `inv-${invoiceRows.length + 1}`, pdfUrl: null, ...defaults });
            invoiceRows.push(row);
            return [row, true];
        },
        async findOne({ where }) {
            return invoiceRows.find((r) => r.orderId === where.orderId) || null;
        },
    };
    const OrdersOrder = { async findOne({ where }) { return (where.id === ORDER.id && where.storeId === STORE) ? { ...ORDER } : null; } };
    const OrdersCustomer = { async findByPk(id) { return id === 'cust-1' ? { userId: '100' } : null; } };
    inject(P('models'), { OrdersInvoice, OrdersOrder, OrdersCustomer });

    delete require.cache[P('service', 'invoiceService')];
    return require('../service/invoiceService');
}

beforeEach(() => { invoiceRows = []; putObjectCalls = []; });

async function statusOf(fn) { try { await fn(); return 200; } catch (e) { return e.statusCode || 500; } }

test('generateInvoiceForOrder renders a real PDF, uploads it, and stamps the invoice sent/pdfUrl', async () => {
    const svc = loadInvoiceService();
    await svc.generateInvoiceForOrder(STORE, ORDER, ITEMS);

    assert.equal(invoiceRows.length, 1, 'one invoice row created');
    const invoice = invoiceRows[0];
    assert.equal(invoice.orderId, ORDER.id);
    assert.equal(invoice.status, 'sent');
    assert.ok(invoice.pdfUrl, 'pdfUrl stamped');
    assert.ok(invoice.sentAt instanceof Date);

    assert.equal(putObjectCalls.length, 1, 'uploaded exactly one object');
    assert.equal(putObjectCalls[0].key, invoice.pdfUrl);
    assert.equal(putObjectCalls[0].contentType, 'application/pdf');
    assert.ok(putObjectCalls[0].size > 100, 'a real, non-trivial PDF buffer was rendered (not a stub/empty buffer)');
    assert.match(invoice.invoiceNumber, /^INV-[0-9A-Z]+-[0-9A-F]{4}$/i);
});

test('generateInvoiceForOrder is idempotent: a second call for the same order does not re-render or re-upload', async () => {
    const svc = loadInvoiceService();
    await svc.generateInvoiceForOrder(STORE, ORDER, ITEMS);
    assert.equal(putObjectCalls.length, 1);

    await svc.generateInvoiceForOrder(STORE, ORDER, ITEMS); // simulates a retried/replayed payment capture
    assert.equal(invoiceRows.length, 1, 'still only one invoice row (findOrCreate matched on orderId)');
    assert.equal(putObjectCalls.length, 1, 'no second PDF render/upload for an already-generated invoice');
});

test('generateInvoiceForOrder never throws — a downstream failure must not fail the payment-capture path', async () => {
    const svc = loadInvoiceService();
    inject(require.resolve('@baalvion/upload'), {
        putObject: async () => { throw new Error('S3 outage'); },
        generateSignedDownloadUrl: async (key) => key,
    });
    delete require.cache[P('service', 'invoiceService')];
    const svc2 = require('../service/invoiceService');
    await assert.doesNotReject(() => svc2.generateInvoiceForOrder(STORE, ORDER, ITEMS));
});

test('getOrderInvoice: owner can fetch, a different user is denied (403), 404s until the invoice exists', async () => {
    const svc = loadInvoiceService();
    // No invoice generated yet.
    assert.equal(await statusOf(() => svc.getOrderInvoice(STORE, ORDER.id, { userId: '100' })), 404);

    await svc.generateInvoiceForOrder(STORE, ORDER, ITEMS);
    const out = await svc.getOrderInvoice(STORE, ORDER.id, { userId: '100' });
    assert.equal(out.orderId, ORDER.id);

    assert.equal(await statusOf(() => svc.getOrderInvoice(STORE, ORDER.id, { userId: '200' })), 403);
    assert.equal(await statusOf(() => svc.getOrderInvoice(STORE, ORDER.id, { userId: '999', isStaff: async () => true })), 200);
});

test('getOrderInvoice: 404s for an order that does not exist', async () => {
    const svc = loadInvoiceService();
    assert.equal(await statusOf(() => svc.getOrderInvoice(STORE, 'missing-order', { userId: '100' })), 404);
});
