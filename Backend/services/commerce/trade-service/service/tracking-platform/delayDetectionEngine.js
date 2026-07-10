'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — periodic delay-cause
 * detection across active TradeShipments, mirroring the sweep pattern in
 * controller/shipmentController.js's sweepTracking (that one runs against the
 * legacy trade.shipments; this one runs against tradeops.shipments).
 */
const { Op } = require('sequelize');
const db = require('../../models');
const { createAlert } = require('./alertEngine');

const ACTIVE_STATUSES = [
    'booked', 'picked_up', 'in_transit', 'port_processing',
    'customs_clearance', 'customs_hold', 'released', 'delayed', 're_routed',
];
const DWELL_HOURS = Number(process.env.SHIPMENT_DWELL_HOURS || 72);

async function recordDelay(shipment, delayType, estimatedDelayMinutes, metadata = {}) {
    const existing = await db.DelayEvent.findOne({
        where: { shipment_id: shipment.id, delay_type: delayType, resolved: false },
    });
    if (existing) return existing;

    const delay = await db.DelayEvent.create({
        tenant_id: shipment.tenant_id,
        shipment_id: shipment.id,
        delay_type: delayType,
        estimated_delay_minutes: estimatedDelayMinutes,
        metadata,
    });

    await createAlert({
        shipmentId: shipment.id, alertType: 'delay', severity: estimatedDelayMinutes > 1440 ? 'high' : 'medium',
        message: `${delayType.replace(/_/g, ' ')} delay detected`,
        metadata: { delayEventId: delay.id, delayType, estimatedDelayMinutes },
        tenantId: shipment.tenant_id,
    });
    return delay;
}

/** Evaluate one shipment against every detectable delay cause. */
async function detectDelaysForShipment(shipment) {
    const now = Date.now();
    const detected = [];

    if (shipment.status === 'customs_hold') {
        detected.push(await recordDelay(shipment, 'customs_hold', null));
    }

    if (shipment.estimated_arrival) {
        const etaMs = new Date(shipment.estimated_arrival).getTime();
        if (now > etaMs && !['delivered', 'cancelled'].includes(shipment.status)) {
            const lateMinutes = Math.round((now - etaMs) / 60000);
            detected.push(await recordDelay(shipment, 'late_delivery', lateMinutes));
        }
    }

    const lastEvent = await db.ShipmentEvent.findOne({
        where: { shipment_id: shipment.id },
        order: [['occurred_at', 'DESC']],
    });
    if (lastEvent) {
        const ageHours = (now - new Date(lastEvent.occurred_at).getTime()) / 3600000;
        if (ageHours > DWELL_HOURS && !['delivered', 'cancelled'].includes(shipment.status)) {
            detected.push(await recordDelay(shipment, 'warehouse', Math.round(ageHours * 60), { reason: 'no tracking update' }));
        }
    }

    const openCheckpoint = await db.ShipmentCheckpoint.findOne({
        where: { shipment_id: shipment.id, arrived_at: { [Op.ne]: null }, departed_at: null },
        order: [['arrived_at', 'DESC']],
    });
    if (openCheckpoint) {
        const waitingHours = (now - new Date(openCheckpoint.arrived_at).getTime()) / 3600000;
        if (waitingHours > 6 && ['border', 'customs'].includes(openCheckpoint.checkpoint_type)) {
            detected.push(await recordDelay(shipment, 'border', Math.round(waitingHours * 60), { checkpointId: openCheckpoint.id }));
        }
    }

    return detected.filter(Boolean);
}

/** Sweep all active TradeShipments for delay causes (callable by a scheduler/worker). */
async function sweepDelays(limit = 500) {
    const shipments = await db.TradeShipment.findAll({ where: { status: { [Op.in]: ACTIVE_STATUSES } }, limit });
    let raised = 0;
    for (const shipment of shipments) {
        const detected = await detectDelaysForShipment(shipment);
        raised += detected.length;
    }
    return { scanned: shipments.length, raised };
}

module.exports = { detectDelaysForShipment, sweepDelays, recordDelay, ACTIVE_STATUSES };
