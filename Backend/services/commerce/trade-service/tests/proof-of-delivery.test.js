'use strict';
// Shipment Tracking & Global Visibility Platform — proof of delivery (Phase 3, Prompt 6).
const podService = require('../service/tracking-platform/proofOfDeliveryService');

describe('proofOfDeliveryService (DB-backed)', () => {
    let db;
    let dbAvailable = false;
    let tradeOperationId;
    const shipmentIds = [];

    beforeAll(async () => {
        db = require('../models');
        try {
            await db.sequelize.authenticate();
            await require('../migrate').run();
            const op = await db.TradeOperation.create({ tenant_id: 'T-TEST', reference_no: `OP-POD-${Date.now()}` });
            tradeOperationId = op.id;
            dbAvailable = true;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[proof-of-delivery] DB unavailable — skipping engine suite:', err.message);
        }
    });

    afterAll(async () => {
        if (!dbAvailable) return;
        for (const id of shipmentIds) {
            try { await db.ProofOfDelivery.destroy({ where: { shipment_id: id }, force: true }); } catch { /* noop */ }
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

    maybe('captures a POD without a pending OTP and advances the shipment to delivered', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-POD-${Date.now()}`, status: 'out_for_delivery',
        });
        shipmentIds.push(shipment.id);

        const pod = await podService.capturePod({ shipmentId: shipment.id, receiverName: 'Test Receiver' });
        expect(pod.otp_verified).toBe(false);

        const updated = await db.TradeShipment.findByPk(shipment.id);
        expect(updated.status).toBe('delivered');
    });

    maybe('generates an OTP and rejects capture with the wrong code', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-POD2-${Date.now()}`, status: 'out_for_delivery',
        });
        shipmentIds.push(shipment.id);

        await podService.generateDeliveryOtp(shipment.id);
        await expect(podService.capturePod({ shipmentId: shipment.id, otpCode: '000000' }))
            .rejects.toThrow('invalid or expired OTP');
    });

    maybe('accepts capture with the correct OTP', async () => {
        const shipment = await db.TradeShipment.create({
            tenant_id: 'T-TEST', trade_operation_id: tradeOperationId,
            shipment_no: `SHP-POD3-${Date.now()}`, status: 'out_for_delivery',
        });
        shipmentIds.push(shipment.id);

        const code = await podService.generateDeliveryOtp(shipment.id);
        const pod = await podService.capturePod({ shipmentId: shipment.id, otpCode: code });
        expect(pod.otp_verified).toBe(true);
    });
});
