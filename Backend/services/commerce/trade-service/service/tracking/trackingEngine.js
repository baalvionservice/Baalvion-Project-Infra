'use strict';
/**
 * Logistics Core Foundation — shared tracking-event recording logic, used by
 * BOTH the synchronous authenticated API (controller/trackingController.js
 * `create`, Phase 1) and the async `tracking_sync` BullMQ worker (Phase 2,
 * queue/workers.js) — bulk/webhook-sourced pings enqueue instead of blocking
 * the caller on N synchronous DB writes. One code path, two entry points.
 */
const db = require('../../models');
const { emitLogisticsEvent } = require('../events/logisticsEvents');

const TRACKING_SOURCES = ['carrier_webhook', 'gps_device', 'manual'];

/**
 * @param {object} payload
 * @param {string} payload.shipmentId
 * @param {string} [payload.containerId]
 * @param {string} [payload.source]
 * @param {string} payload.eventType
 * @param {string} [payload.description]
 * @param {number} [payload.latitude]
 * @param {number} [payload.longitude]
 * @param {string} [payload.locationLabel]
 * @param {string|Date} [payload.occurredAt]
 * @param {object} [payload.rawPayload]
 * @param {string} [payload.tenantId]
 * @param {string} [payload.createdBy]
 * @returns {Promise<import('sequelize').Model>}
 */
async function recordTrackingEvent(payload = {}) {
    const shipmentId = payload.shipmentId ?? payload.shipment_id;
    if (!shipmentId) throw new Error('shipmentId is required');
    const eventType = payload.eventType ?? payload.event_type;
    if (!eventType) throw new Error('eventType is required');
    const source = payload.source || 'manual';
    if (!TRACKING_SOURCES.includes(source)) {
        throw new Error(`source must be one of: ${TRACKING_SOURCES.join(', ')}`);
    }

    const row = await db.TrackingEvent.create({
        shipment_id: shipmentId,
        container_id: payload.containerId ?? payload.container_id,
        source,
        event_type: eventType,
        description: payload.description,
        latitude: payload.latitude,
        longitude: payload.longitude,
        location_label: payload.locationLabel ?? payload.location_label,
        occurred_at: payload.occurredAt ?? payload.occurred_at ?? new Date(),
        raw_payload: payload.rawPayload ?? payload.raw_payload ?? {},
        created_by: payload.createdBy ?? payload.created_by,
        ...(payload.tenantId ? { tenant_id: payload.tenantId } : {}),
    });

    // Best-effort: keep the shipment's headline location current.
    if (row.latitude != null || row.longitude != null || row.location_label) {
        try {
            const shipment = await db.TradeShipment.findByPk(row.shipment_id);
            if (shipment) {
                await shipment.update({
                    metadata: {
                        ...(shipment.metadata || {}),
                        lastKnownLocation: row.location_label || `${row.latitude},${row.longitude}`,
                        lastTrackedAt: row.occurred_at,
                    },
                });
            }
        } catch { /* non-fatal */ }
    }

    await emitLogisticsEvent('logisticsTrackingUpdated', {
        shipmentId: row.shipment_id, containerId: row.container_id, source: row.source,
        latitude: row.latitude, longitude: row.longitude, locationLabel: row.location_label,
        occurredAt: row.occurred_at instanceof Date ? row.occurred_at.toISOString() : String(row.occurred_at),
        tenantId: row.tenant_id,
    });

    // Shipment Tracking & Global Visibility Platform: best-effort geofence
    // evaluation off every GPS ping. Never blocks/fails the tracking write.
    try {
        const { evaluateGeofences } = require('../tracking-platform/geofenceEngine');
        await evaluateGeofences(row);
    } catch { /* non-fatal */ }

    return row;
}

module.exports = { recordTrackingEvent, TRACKING_SOURCES };
