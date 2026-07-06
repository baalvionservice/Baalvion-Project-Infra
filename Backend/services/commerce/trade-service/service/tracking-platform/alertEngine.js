'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — the single chokepoint for
 * raising a shipment alert. Every other engine in this directory (geofence,
 * IoT, delay-detection, ETA) calls `createAlert` instead of writing
 * `db.ShipmentAlert` directly, so dedup + realtime publish + notification
 * fan-out always happen together.
 */
const db = require('../../models');
const realtime = require('../../realtime');

const ALERT_TYPES = [
    'gps_lost', 'offline', 'geofence_enter', 'geofence_exit', 'delay',
    'route_deviation', 'temperature', 'humidity', 'shock',
    'unauthorized_opening', 'container_tampering', 'battery_low',
    'eta_changed', 'late_delivery', 'customs_hold', 'delivered',
];

/**
 * Create a shipment alert, deduping against any existing unresolved alert of
 * the same type for the same shipment (avoids paging the same issue every
 * time a sweep/ingest re-detects it while it remains unresolved).
 *
 * @param {object} opts
 * @param {string} opts.shipmentId
 * @param {string} opts.alertType
 * @param {'low'|'medium'|'high'|'critical'} [opts.severity]
 * @param {string} opts.message
 * @param {object} [opts.metadata]
 * @param {string} [opts.tenantId]
 * @returns {Promise<{alert: import('sequelize').Model, created: boolean}>}
 */
async function createAlert({ shipmentId, alertType, severity = 'medium', message, metadata = {}, tenantId } = {}) {
    if (!shipmentId) throw new Error('shipmentId is required');
    if (!ALERT_TYPES.includes(alertType)) throw new Error(`alertType must be one of: ${ALERT_TYPES.join(', ')}`);
    if (!message) throw new Error('message is required');

    const existing = await db.ShipmentAlert.findOne({
        where: { shipment_id: shipmentId, alert_type: alertType, status: ['active', 'acknowledged'] },
    });
    if (existing) return { alert: existing, created: false };

    const alert = await db.ShipmentAlert.create({
        shipment_id: shipmentId,
        alert_type: alertType,
        severity,
        message,
        metadata,
        ...(tenantId ? { tenant_id: tenantId } : {}),
    });

    await realtime.publish(`shipment:${shipmentId}`, 'alert', {
        id: alert.id, shipmentId, alertType, severity, message, triggeredAt: alert.triggered_at,
    });

    try {
        const { dispatchAlertNotifications } = require('./notificationDispatcher');
        await dispatchAlertNotifications(alert);
    } catch { /* best-effort — notification failure must never block alert creation */ }

    return { alert, created: true };
}

async function acknowledgeAlert(alertId, userId) {
    const alert = await db.ShipmentAlert.findByPk(alertId);
    if (!alert) throw new Error('alert not found');
    await alert.update({ status: 'acknowledged', acknowledged_by: userId, acknowledged_at: new Date() });
    return alert;
}

async function resolveAlert(alertId) {
    const alert = await db.ShipmentAlert.findByPk(alertId);
    if (!alert) throw new Error('alert not found');
    await alert.update({ status: 'resolved', resolved_at: new Date() });
    return alert;
}

module.exports = { ALERT_TYPES, createAlert, acknowledgeAlert, resolveAlert };
