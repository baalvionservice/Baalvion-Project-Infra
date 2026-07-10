'use strict';
// Shipment Tracking & Global Visibility Platform — IoT ingestion (Phase 3, Prompt 6).
const iotIngestEngine = require('../service/tracking-platform/iotIngestEngine');

describe('iotIngestEngine.ingestReading validation (pure)', () => {
    test('rejects a missing deviceId', async () => {
        await expect(iotIngestEngine.ingestReading({ metricType: 'temperature', value: 1 }))
            .rejects.toThrow('deviceId is required');
    });

    test('rejects a missing metricType', async () => {
        await expect(iotIngestEngine.ingestReading({ deviceId: 'x', value: 1 }))
            .rejects.toThrow('metricType is required');
    });
});

describe('iotIngestEngine (DB-backed)', () => {
    let db;
    let dbAvailable = false;
    let tradeOperationId;
    const shipmentIds = [];
    const deviceIds = [];

    beforeAll(async () => {
        db = require('../models');
        try {
            await db.sequelize.authenticate();
            await require('../migrate').run();
            const op = await db.TradeOperation.create({ tenant_id: 'T-TEST', reference_no: `OP-IOT-${Date.now()}` });
            tradeOperationId = op.id;
            dbAvailable = true;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[iot-tracking] DB unavailable — skipping engine suite:', err.message);
        }
    });

    afterAll(async () => {
        if (!dbAvailable) return;
        for (const id of deviceIds) {
            try { await db.IotSensorLog.destroy({ where: { device_id: id }, force: true }); } catch { /* noop */ }
            try { await db.IotDevice.destroy({ where: { id }, force: true }); } catch { /* noop */ }
        }
        for (const id of shipmentIds) {
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

    maybe('ingests a normal reading without raising an alert', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-IOT-${Date.now()}`, status: 'in_transit',
        });
        shipmentIds.push(shipment.id);
        const device = await db.IotDevice.create({ tenant_id: 'T-TEST', shipment_id: shipment.id, device_type: 'temperature' });
        deviceIds.push(device.id);

        await iotIngestEngine.ingestReading({ deviceId: device.id, metricType: 'temperature', value: 4, unit: 'C' });

        const alerts = await db.ShipmentAlert.count({ where: { shipment_id: shipment.id, alert_type: 'temperature' } });
        expect(alerts).toBe(0);

        const updated = await db.IotDevice.findByPk(device.id);
        expect(updated.status).toBe('online');
        expect(updated.last_seen_at).not.toBeNull();
    });

    maybe('raises a temperature alert when the reading breaches the cold-chain default threshold', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-IOT2-${Date.now()}`, status: 'in_transit',
        });
        shipmentIds.push(shipment.id);
        const device = await db.IotDevice.create({ tenant_id: 'T-TEST', shipment_id: shipment.id, device_type: 'temperature' });
        deviceIds.push(device.id);

        await iotIngestEngine.ingestReading({ deviceId: device.id, metricType: 'temperature', value: 25, unit: 'C' });

        const alert = await db.ShipmentAlert.findOne({ where: { shipment_id: shipment.id, alert_type: 'temperature' } });
        expect(alert).not.toBeNull();
        expect(alert.severity).toBe('high');
    });

    maybe('respects a device-level custom threshold over the default', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-IOT3-${Date.now()}`, status: 'in_transit',
        });
        shipmentIds.push(shipment.id);
        const device = await db.IotDevice.create({
            tenant_id: 'T-TEST', shipment_id: shipment.id, device_type: 'temperature',
            metadata: { thresholds: { temperature: { min: -30, max: 30 } } },
        });
        deviceIds.push(device.id);

        await iotIngestEngine.ingestReading({ deviceId: device.id, metricType: 'temperature', value: 25, unit: 'C' });
        const alert = await db.ShipmentAlert.findOne({ where: { shipment_id: shipment.id, alert_type: 'temperature' } });
        expect(alert).toBeNull(); // within the custom (wider) threshold
    });
});
