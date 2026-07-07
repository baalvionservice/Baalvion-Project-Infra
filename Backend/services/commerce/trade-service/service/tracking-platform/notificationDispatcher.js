'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — fans an alert out across
 * every channel configured for the shipment's tenant (a shipment_notifications
 * row per channel), and records the delivery outcome. Called by
 * alertEngine.createAlert; not meant to be called directly by controllers.
 */
const db = require('../../models');
const realtime = require('../../realtime');
const notificationChannels = require('../../providers/notificationChannels');
const logger = require('../logger');

// Default channel set for every alert: always push over the shipment's
// websocket room (free, already-connected clients), plus whatever
// external channels the tenant has configured. A tenant-level channel
// preference table is a natural Phase 2 addition; for now every configured
// channel in providers/notificationChannels.js fires for every alert.
async function dispatchAlertNotifications(alert) {
    const channels = ['websocket', ...notificationChannels.CHANNELS.map((c) => c.name)];
    const results = [];
    for (const channel of channels) {
        const row = await db.ShipmentNotification.create({
            tenant_id: alert.tenant_id,
            shipment_id: alert.shipment_id,
            alert_id: alert.id,
            channel,
            payload: { alertType: alert.alert_type, severity: alert.severity, message: alert.message },
        });
        try {
            if (channel === 'websocket') {
                await realtime.publish(`shipment:${alert.shipment_id}`, 'notification', {
                    alertId: alert.id, alertType: alert.alert_type, severity: alert.severity, message: alert.message,
                });
            } else {
                await notificationChannels.send(channel, { message: alert.message });
            }
            await row.update({ status: 'sent', sent_at: new Date() });
        } catch (err) {
            logger.error('[notificationDispatcher] channel send failed', { channel, error: err.message });
            await row.update({ status: 'failed', error: err.message });
        }
        results.push(row);
    }
    return results;
}

module.exports = { dispatchAlertNotifications };
