'use strict';
// Shipment Tracking & Global Visibility Platform — ETA prediction engine (Phase 3, Prompt 6).
const etaEngine = require('../service/tracking-platform/etaPredictionEngine');

describe('etaPredictionEngine scoring (pure)', () => {
    test('scoreConfidence starts from carrier on-time % and erodes with risk factors', () => {
        const high = etaEngine.scoreConfidence({ onTimePct: 95, openDelayCount: 0, weatherRisk: 0, trafficRisk: 0 });
        const low = etaEngine.scoreConfidence({ onTimePct: 95, openDelayCount: 3, weatherRisk: 24, trafficRisk: 30 });
        expect(high).toBeGreaterThan(low);
        expect(high).toBeLessThanOrEqual(99);
        expect(low).toBeGreaterThanOrEqual(5);
    });

    test('scoreConfidence defaults to a neutral baseline when no carrier history exists', () => {
        const score = etaEngine.scoreConfidence({ onTimePct: null, openDelayCount: 0, weatherRisk: 0, trafficRisk: 0 });
        expect(score).toBe(80);
    });

    test('scoreRisk increases with open delays and poor ETA accuracy history', () => {
        const lowRisk = etaEngine.scoreRisk({ openDelayCount: 0, weatherRisk: 0, trafficRisk: 0, etaAccuracyPct: 95 });
        const highRisk = etaEngine.scoreRisk({ openDelayCount: 2, weatherRisk: 24, trafficRisk: 30, etaAccuracyPct: 40 });
        expect(highRisk).toBeGreaterThan(lowRisk);
        expect(highRisk).toBeLessThanOrEqual(100);
        expect(lowRisk).toBeGreaterThanOrEqual(0);
    });
});

describe('etaPredictionEngine.predictEta (DB-backed)', () => {
    let db;
    let dbAvailable = false;
    let tradeOperationId;
    const shipmentIds = [];

    beforeAll(async () => {
        db = require('../models');
        try {
            await db.sequelize.authenticate();
            await require('../migrate').run();
            const op = await db.TradeOperation.create({ tenant_id: 'T-TEST', reference_no: `OP-ETA-${Date.now()}` });
            tradeOperationId = op.id;
            dbAvailable = true;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[eta-prediction] DB unavailable — skipping engine suite:', err.message);
        }
    });

    afterAll(async () => {
        if (!dbAvailable) return;
        for (const id of shipmentIds) {
            try { await db.EtaPrediction.destroy({ where: { shipment_id: id }, force: true }); } catch { /* noop */ }
            try { await db.ShipmentAlert.destroy({ where: { shipment_id: id }, force: true }); } catch { /* noop */ }
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

    maybe('computes and persists a prediction for a shipment with no carrier history', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-ETA-${Date.now()}`, status: 'in_transit',
            estimated_arrival: new Date(Date.now() + 5 * 86400000),
            origin_port: 'Mumbai', destination_port: 'Rotterdam',
        });
        shipmentIds.push(shipment.id);

        const prediction = await etaEngine.predictEta(shipment.id);
        expect(prediction.shipment_id).toBe(shipment.id);
        expect(prediction.confidence_pct).not.toBeNull();
        expect(prediction.model_version).toBe(etaEngine.MODEL_VERSION);

        const latest = await etaEngine.latestPrediction(shipment.id);
        expect(latest.id).toBe(prediction.id);
    });

    maybe('rejects an unknown shipment id', async () => {
        await expect(etaEngine.predictEta('00000000-0000-0000-0000-000000000000')).rejects.toThrow('shipment not found');
    });
});
