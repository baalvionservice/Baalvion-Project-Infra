'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — arrive/depart a physical
 * checkpoint, computing dwell/waiting-time metrics from the timestamps
 * instead of leaving them to be derived ad hoc downstream.
 */
const db = require('../../models');
const { createAlert } = require('./alertEngine');

const DEFAULT_WAITING_ALERT_MINUTES = Number(process.env.CHECKPOINT_WAITING_ALERT_MINUTES || 180);

async function arriveCheckpoint({ shipmentId, checkpointType, name, sequence = 0, latitude, longitude, tenantId, createdBy } = {}) {
    if (!shipmentId) throw new Error('shipmentId is required');
    if (!checkpointType) throw new Error('checkpointType is required');
    return db.ShipmentCheckpoint.create({
        shipment_id: shipmentId, checkpoint_type: checkpointType, name, sequence,
        arrived_at: new Date(), latitude, longitude, created_by: createdBy,
        ...(tenantId ? { tenant_id: tenantId } : {}),
    });
}

async function departCheckpoint(checkpointId, { inspectionStatus, approved } = {}) {
    const checkpoint = await db.ShipmentCheckpoint.findByPk(checkpointId);
    if (!checkpoint) throw new Error('checkpoint not found');
    const departedAt = new Date();
    const waitingMinutes = checkpoint.arrived_at
        ? Math.round((departedAt.getTime() - new Date(checkpoint.arrived_at).getTime()) / 60000)
        : null;

    await checkpoint.update({
        departed_at: departedAt,
        waiting_minutes: waitingMinutes,
        ...(inspectionStatus ? { inspection_status: inspectionStatus } : {}),
        ...(approved != null ? { approved } : {}),
    });

    if (waitingMinutes != null && waitingMinutes > DEFAULT_WAITING_ALERT_MINUTES) {
        await createAlert({
            shipmentId: checkpoint.shipment_id, alertType: 'delay', severity: 'medium',
            message: `Shipment waited ${waitingMinutes}m at checkpoint "${checkpoint.name || checkpoint.checkpoint_type}" (limit ${DEFAULT_WAITING_ALERT_MINUTES}m)`,
            metadata: { checkpointId: checkpoint.id, waitingMinutes },
            tenantId: checkpoint.tenant_id,
        });
    }
    return checkpoint;
}

/** Recompute delay_minutes against a planned shipment_route leg's ETA, if one exists. */
async function computeDelayAgainstRoute(checkpointId) {
    const checkpoint = await db.ShipmentCheckpoint.findByPk(checkpointId);
    if (!checkpoint || !checkpoint.arrived_at) return checkpoint;
    const route = await db.ShipmentRoute.findOne({
        where: { shipment_id: checkpoint.shipment_id, sequence: checkpoint.sequence },
    });
    if (!route || !route.planned_arrival) return checkpoint;
    const delayMinutes = Math.round(
        (new Date(checkpoint.arrived_at).getTime() - new Date(route.planned_arrival).getTime()) / 60000,
    );
    await checkpoint.update({ delay_minutes: delayMinutes });
    return checkpoint;
}

module.exports = { arriveCheckpoint, departCheckpoint, computeDelayAgainstRoute, DEFAULT_WAITING_ALERT_MINUTES };
