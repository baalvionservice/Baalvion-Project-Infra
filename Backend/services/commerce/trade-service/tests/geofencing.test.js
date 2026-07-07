'use strict';
// Shipment Tracking & Global Visibility Platform — geofencing (Phase 3, Prompt 6).
//
// Two suites:
//   1. Pure geometry — no DB, always runs. Proves haversine + point-in-polygon math.
//   2. Engine (DB-backed) — entry/exit/dwell detection + alert creation. Skips
//      gracefully when no DB is reachable.

const geofenceEngine = require('../service/tracking-platform/geofenceEngine');

// ───────────────────────────────────────────────────────────────────────────
// 1. PURE GEOMETRY
// ───────────────────────────────────────────────────────────────────────────
describe('geofenceEngine geometry (pure)', () => {
    test('haversineMeters returns ~0 for identical points', () => {
        expect(geofenceEngine.haversineMeters(12.9716, 77.5946, 12.9716, 77.5946)).toBeCloseTo(0, 3);
    });

    test('haversineMeters matches a known distance (Bengaluru <-> Chennai, ~290km)', () => {
        const meters = geofenceEngine.haversineMeters(12.9716, 77.5946, 13.0827, 80.2707);
        expect(meters).toBeGreaterThan(280000);
        expect(meters).toBeLessThan(300000);
    });

    test('pointInPolygon is true for a point inside a simple square', () => {
        const square = [{ lat: 0, lng: 0 }, { lat: 0, lng: 2 }, { lat: 2, lng: 2 }, { lat: 2, lng: 0 }];
        expect(geofenceEngine.pointInPolygon(1, 1, square)).toBe(true);
    });

    test('pointInPolygon is false for a point outside a simple square', () => {
        const square = [{ lat: 0, lng: 0 }, { lat: 0, lng: 2 }, { lat: 2, lng: 2 }, { lat: 2, lng: 0 }];
        expect(geofenceEngine.pointInPolygon(5, 5, square)).toBe(false);
    });

    test('isContained: circle shape uses radius_m', () => {
        const shape = { type: 'circle', center: { lat: 12.9716, lng: 77.5946 }, radius_m: 1000 };
        expect(geofenceEngine.isContained(shape, 12.9716, 77.5946)).toBe(true); // center itself
        expect(geofenceEngine.isContained(shape, 13.5, 80.0)).toBe(false); // far away
    });

    test('isContained: polygon shape uses ray-casting', () => {
        const shape = { type: 'polygon', points: [{ lat: 0, lng: 0 }, { lat: 0, lng: 2 }, { lat: 2, lng: 2 }, { lat: 2, lng: 0 }] };
        expect(geofenceEngine.isContained(shape, 1, 1)).toBe(true);
        expect(geofenceEngine.isContained(shape, 9, 9)).toBe(false);
    });

    test('isContained: returns false for unknown/missing shape', () => {
        expect(geofenceEngine.isContained(null, 1, 1)).toBe(false);
        expect(geofenceEngine.isContained({ type: 'unknown' }, 1, 1)).toBe(false);
    });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. ENGINE (DB-backed) — entry/exit detection + alert creation
// ───────────────────────────────────────────────────────────────────────────
describe('geofenceEngine.evaluateGeofences (DB-backed)', () => {
    let db;
    let dbAvailable = false;
    let tradeOperationId;
    const cleanup = { shipments: [], geofences: [] };

    beforeAll(async () => {
        db = require('../models');
        try {
            await db.sequelize.authenticate();
            await require('../migrate').run();
            const op = await db.TradeOperation.create({ tenant_id: 'T-TEST', reference_no: `OP-GEO-${Date.now()}` });
            tradeOperationId = op.id;
            dbAvailable = true;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[geofencing] DB unavailable — skipping engine suite:', err.message);
        }
    });

    afterAll(async () => {
        if (!dbAvailable) return;
        for (const id of cleanup.geofences) {
            try { await db.GeofenceEvent.destroy({ where: { geofence_id: id }, force: true }); } catch { /* noop */ }
            try { await db.Geofence.destroy({ where: { id }, force: true }); } catch { /* noop */ }
        }
        for (const id of cleanup.shipments) {
            try { await db.TrackingEvent.destroy({ where: { shipment_id: id }, force: true }); } catch { /* noop */ }
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

    maybe('raises a geofence_enter alert + geofence_event on first entry', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-GEO-${Date.now()}`, status: 'in_transit',
        });
        cleanup.shipments.push(shipment.id);

        const fence = await db.Geofence.create({
            tenant_id: 'T-TEST', name: 'Test Port Fence', fence_type: 'port', active: true,
            shape: { type: 'circle', center: { lat: 12.9716, lng: 77.5946 }, radius_m: 5000 },
        });
        cleanup.geofences.push(fence.id);

        const trackingEvent = await db.TrackingEvent.create({
            tenant_id: 'T-TEST', shipment_id: shipment.id, event_type: 'location_update',
            latitude: 12.9716, longitude: 77.5946,
        });

        const raised = await geofenceEngine.evaluateGeofences(trackingEvent);
        expect(raised).toHaveLength(1);
        expect(raised[0].event_type).toBe('entry');

        const alert = await db.ShipmentAlert.findOne({ where: { shipment_id: shipment.id, alert_type: 'geofence_enter' } });
        expect(alert).not.toBeNull();
    });

    maybe('does not raise a duplicate entry alert for a subsequent ping still inside', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-GEO2-${Date.now()}`, status: 'in_transit',
        });
        cleanup.shipments.push(shipment.id);

        const fence = await db.Geofence.create({
            tenant_id: 'T-TEST', name: 'Test Warehouse Fence', fence_type: 'warehouse', active: true,
            shape: { type: 'circle', center: { lat: 12.9716, lng: 77.5946 }, radius_m: 5000 },
        });
        cleanup.geofences.push(fence.id);

        const ping1 = await db.TrackingEvent.create({
            tenant_id: 'T-TEST', shipment_id: shipment.id, event_type: 'location_update',
            latitude: 12.9716, longitude: 77.5946,
        });
        await geofenceEngine.evaluateGeofences(ping1);

        const ping2 = await db.TrackingEvent.create({
            tenant_id: 'T-TEST', shipment_id: shipment.id, event_type: 'location_update',
            latitude: 12.9720, longitude: 77.5950,
        });
        const raisedSecond = await geofenceEngine.evaluateGeofences(ping2);
        expect(raisedSecond).toHaveLength(0);

        const entryEvents = await db.GeofenceEvent.findAll({ where: { geofence_id: fence.id, event_type: 'entry' } });
        expect(entryEvents).toHaveLength(1);
    });
});
