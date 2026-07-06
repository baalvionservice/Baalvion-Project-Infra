'use strict';
const request = require('supertest');
const app = require('../index');
const { gatewayHeaders } = require('./helpers/gatewayAuth');

const buyer = gatewayHeaders({ userId: 'u-buyer', orgId: 'T-JEST-PO-BUYER', roles: ['client'] });
const seller = gatewayHeaders({ userId: 'u-seller', orgId: 'T-JEST-PO-SELLER', roles: ['client'] });
const other = gatewayHeaders({ userId: 'u-other', orgId: 'T-JEST-PO-OTHER', roles: ['client'] });
const admin = gatewayHeaders({ userId: 'u-admin', orgId: 'T-JEST-PO-ADMIN', roles: ['admin'] });

describe('purchase orders (Phase 1 lifecycle + tenant isolation)', () => {
    let poId;

    it('blocks anonymous reads (401)', async () => {
        const r = await request(app).get('/v1/purchase_orders');
        expect(r.status).toBe(401);
    });

    it('creates a draft PO under the caller tenant, computing totals server-side', async () => {
        const r = await request(app).post('/v1/purchase_orders').set(buyer).send({
            tenant_id: 'SPOOFED',
            status: 'accepted', // must be ignored — server forces 'draft'
            buyer_org_id: 'T-JEST-PO-BUYER',
            seller_org_id: 'T-JEST-PO-SELLER',
            currency: 'USD',
            shipping_terms: 'FOB',
            payment_terms: 'Net 30',
            line_items: [
                { product: 'Widgets', quantity: 100, unit_price: 10, tax_rate: 5 },
                { product: 'Gadgets', quantity: 50, unit_price: 20, tax_rate: 0 },
            ],
        });
        expect(r.status).toBe(201);
        expect(r.body.data.tenant_id).toBe('T-JEST-PO-BUYER');
        expect(r.body.data.status).toBe('draft');
        expect(r.body.data.po_number).toMatch(/^PO-/);
        // subtotal = 100*10 + 50*20 = 2000; tax = 100*10*0.05 = 50; total = 2050
        expect(Number(r.body.data.subtotal)).toBe(2000);
        expect(Number(r.body.data.tax_total)).toBe(50);
        expect(Number(r.body.data.total_value)).toBe(2050);
        poId = r.body.data.id;
    });

    it('hides the PO from a non-party tenant (404)', async () => {
        const r = await request(app).get(`/v1/purchase_orders/${poId}`).set(other);
        expect(r.status).toBe(404);
    });

    it('allows the buyer to edit the draft', async () => {
        const r = await request(app).patch(`/v1/purchase_orders/${poId}`).set(buyer)
            .send({ notes: 'Please expedite' });
        expect(r.status).toBe(200);
        expect(r.body.data.notes).toBe('Please expedite');
    });

    it('issues the PO to the seller', async () => {
        const r = await request(app).patch(`/v1/purchase_orders/${poId}/issue`).set(buyer);
        expect(r.status).toBe(200);
        expect(r.body.data.status).toBe('issued');
        expect(r.body.data.issued_at).toBeTruthy();
    });

    it('rejects edits once issued (409)', async () => {
        const r = await request(app).patch(`/v1/purchase_orders/${poId}`).set(buyer)
            .send({ notes: 'too late' });
        expect(r.status).toBe(409);
    });

    it('lets the seller (a PO party, different tenant) read the issued PO', async () => {
        const r = await request(app).get(`/v1/purchase_orders/${poId}`).set(seller);
        expect(r.status).toBe(200);
    });

    it('seller accepts the PO — creates a linked fulfillment order', async () => {
        const r = await request(app).patch(`/v1/purchase_orders/${poId}/accept`).set(seller);
        expect(r.status).toBe(200);
        expect(r.body.data.status).toBe('accepted');
        expect(r.body.data.order_id).toBeTruthy();
        expect(r.body.data.responded_at).toBeTruthy();
    });

    it('rejects a second accept on an already-accepted PO (409)', async () => {
        const r = await request(app).patch(`/v1/purchase_orders/${poId}/accept`).set(seller);
        expect(r.status).toBe(409);
    });

    it('lets admin bypass tenant scoping', async () => {
        const r = await request(app).get(`/v1/purchase_orders/${poId}`).set(admin);
        expect(r.status).toBe(200);
    });

    it('cannot cancel an already-accepted PO (409)', async () => {
        const r = await request(app).patch(`/v1/purchase_orders/${poId}/cancel`).set(buyer);
        expect(r.status).toBe(409);
    });

    it('rejects a draft PO end-to-end (separate PO)', async () => {
        const create = await request(app).post('/v1/purchase_orders').set(buyer).send({
            buyer_org_id: 'T-JEST-PO-BUYER',
            seller_org_id: 'T-JEST-PO-SELLER',
            line_items: [{ product: 'Bolts', quantity: 10, unit_price: 1 }],
        });
        const id = create.body.data.id;
        await request(app).patch(`/v1/purchase_orders/${id}/issue`).set(buyer);
        const rejected = await request(app).patch(`/v1/purchase_orders/${id}/reject`).set(seller).send({ reason: 'Out of stock' });
        expect(rejected.status).toBe(200);
        expect(rejected.body.data.status).toBe('rejected');
        expect(rejected.body.data.notes).toBe('Out of stock');
    });

    afterAll(async () => {
        const db = require('../models');
        await db.PurchaseOrder.destroy({ where: { buyer_org_id: 'T-JEST-PO-BUYER' } });
        await db.Order.destroy({ where: { buyer_org_id: 'T-JEST-PO-BUYER' } });
    });
});
