'use strict';
// Shipment Tracking & Global Visibility Platform — alert engine (Phase 3, Prompt 6).
const alertEngine = require('../service/tracking-platform/alertEngine');

describe('alertEngine.createAlert validation (pure)', () => {
    test('rejects a missing shipmentId', async () => {
        await expect(alertEngine.createAlert({ alertType: 'delay', message: 'x' }))
            .rejects.toThrow('shipmentId is required');
    });

    test('rejects an unknown alertType', async () => {
        await expect(alertEngine.createAlert({ shipmentId: 'x', alertType: 'not_a_type', message: 'x' }))
            .rejects.toThrow(/alertType must be one of/);
    });

    test('rejects a missing message', async () => {
        await expect(alertEngine.createAlert({ shipmentId: 'x', alertType: 'delay' }))
            .rejects.toThrow('message is required');
    });
});

describe('alertEngine (DB-backed)', () => {
    let db;
    let dbAvailable = false;
    let tradeOperationId;
    const shipmentIds = [];

    beforeAll(async () => {
        db = require('../models');
        try {
            await db.sequelize.authenticate();
            await require('../migrate').run();
            const op = await db.TradeOperation.create({ tenant_id: 'T-TEST', reference_no: `OP-ALERT-${Date.now()}` });
            tradeOperationId = op.id;
            dbAvailable = true;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[shipment-alerts] DB unavailable — skipping engine suite:', err.message);
        }
    });

    afterAll(async () => {
        if (!dbAvailable) return;
        for (const id of shipmentIds) {
            try { await db.ShipmentNotification.destroy({ where: { shipment_id: id }, force: true }); } catch { /* noop */ }
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

    maybe('creates a new alert and fans out websocket + configured-channel notifications', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-ALERT-${Date.now()}`, status: 'in_transit',
        });
        shipmentIds.push(shipment.id);

        const { alert, created } = await alertEngine.createAlert({
            shipmentId: shipment.id, alertType: 'delay', severity: 'high', message: 'Test delay',
        });
        expect(created).toBe(true);
        expect(alert.status).toBe('active');

        const notifications = await db.ShipmentNotification.findAll({ where: { alert_id: alert.id } });
        expect(notifications.length).toBeGreaterThan(0);
        expect(notifications.some((n) => n.channel === 'websocket')).toBe(true);
    });

    maybe('dedupes a second createAlert call for the same shipment+type while unresolved', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-ALERT2-${Date.now()}`, status: 'in_transit',
        });
        shipmentIds.push(shipment.id);

        const first = await alertEngine.createAlert({ shipmentId: shipment.id, alertType: 'gps_lost', message: 'lost 1' });
        const second = await alertEngine.createAlert({ shipmentId: shipment.id, alertType: 'gps_lost', message: 'lost 2' });
        expect(first.created).toBe(true);
        expect(second.created).toBe(false);
        expect(second.alert.id).toBe(first.alert.id);

        const count = await db.ShipmentAlert.count({ where: { shipment_id: shipment.id, alert_type: 'gps_lost' } });
        expect(count).toBe(1);
    });

    maybe('acknowledge/resolve transitions status correctly', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-ALERT3-${Date.now()}`, status: 'in_transit',
        });
        shipmentIds.push(shipment.id);

        const { alert } = await alertEngine.createAlert({ shipmentId: shipment.id, alertType: 'battery_low', message: 'low battery' });
        const acked = await alertEngine.acknowledgeAlert(alert.id, 'tester@baalvion.com');
        expect(acked.status).toBe('acknowledged');
        expect(acked.acknowledged_by).toBe('tester@baalvion.com');

        const resolved = await alertEngine.resolveAlert(alert.id);
        expect(resolved.status).toBe('resolved');
        expect(resolved.resolved_at).not.toBeNull();
    });
});
