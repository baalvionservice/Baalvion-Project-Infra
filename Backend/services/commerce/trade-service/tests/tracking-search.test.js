'use strict';
// Shipment Tracking & Global Visibility Platform — cross-entity tracking search (Phase 3, Prompt 6).
const trackingSearchService = require('../service/tracking-platform/trackingSearchService');

describe('trackingSearchService.search (pure)', () => {
    test('returns empty result sets for a blank query without touching the DB', async () => {
        const result = await trackingSearchService.search('', 'T-TEST');
        expect(result).toEqual({ shipments: [], containers: [], vehicles: [], freightBookings: [], purchaseOrders: [] });
    });
});

describe('trackingSearchService.search (DB-backed)', () => {
    let db;
    let dbAvailable = false;
    let tradeOperationId;
    const shipmentIds = [];

    beforeAll(async () => {
        db = require('../models');
        try {
            await db.sequelize.authenticate();
            await require('../migrate').run();
            const op = await db.TradeOperation.create({ tenant_id: 'T-TEST', reference_no: `OP-SEARCH-${Date.now()}` });
            tradeOperationId = op.id;
            dbAvailable = true;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[tracking-search] DB unavailable — skipping engine suite:', err.message);
        }
    });

    afterAll(async () => {
        if (!dbAvailable) return;
        for (const id of shipmentIds) {
            try { await db.TradeShipment.destroy({ where: { id }, force: true }); } catch { /* noop */ }
        }
        if (tradeOperationId) {
            try { await db.TradeOperation.destroy({ where: { id: tradeOperationId }, force: true }); } catch { /* noop */ }
        }
        try { await db.sequelize.close(); } catch { /* noop */ }
    });

    const maybe = (name, fn) => test(name, async () => {
        if (!dbAvailable) return; // soft-skip
        await fn();
    });

    maybe('finds a shipment by its unique tracking number', async () => {
        const trackingNumber = `TRK-SEARCH-${Date.now()}`;
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-SEARCH-${Date.now()}`, status: 'in_transit', tracking_number: trackingNumber,
        });
        shipmentIds.push(shipment.id);

        const result = await trackingSearchService.search(trackingNumber, 'T-TEST');
        expect(result.shipments.map((s) => s.id)).toContain(shipment.id);
    });

    maybe('scopes results to the given tenant', async () => {
        const trackingNumber = `TRK-SCOPED-${Date.now()}`;
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-OTHER', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-SCOPED-${Date.now()}`, status: 'in_transit', tracking_number: trackingNumber,
        });
        shipmentIds.push(shipment.id);

        const result = await trackingSearchService.search(trackingNumber, 'T-TEST');
        expect(result.shipments.map((s) => s.id)).not.toContain(shipment.id);
    });
});
