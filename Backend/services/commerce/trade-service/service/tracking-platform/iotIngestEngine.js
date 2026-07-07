'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — IoT sensor ingestion.
 * Writes iot_sensor_logs, keeps iot_devices.last_seen_at/battery_pct current,
 * and raises alerts on threshold breach. Thresholds are per-device
 * (device.metadata.thresholds), falling back to sane defaults so a device
 * works out of the box without per-device configuration.
 */
const db = require('../../models');
const { createAlert } = require('./alertEngine');

const DEFAULT_THRESHOLDS = {
    temperature: { min: -20, max: 8 },   // cold-chain default (°C)
    humidity: { min: 10, max: 90 },       // %
    shock: { max: 5 },                    // g-force
    battery: { min: 15 },                 // %
};

function thresholdsFor(device) {
    const custom = (device.metadata && device.metadata.thresholds) || {};
    return { ...DEFAULT_THRESHOLDS, ...custom };
}

/**
 * Ingest a single sensor reading.
 * @param {object} payload
 * @param {string} payload.deviceId
 * @param {string} payload.metricType
 * @param {number} payload.value
 * @param {string} [payload.unit]
 * @param {string|Date} [payload.recordedAt]
 * @param {object} [payload.rawPayload]
 */
async function ingestReading({ deviceId, metricType, value, unit, recordedAt, rawPayload = {} } = {}) {
    if (!deviceId) throw new Error('deviceId is required');
    if (!metricType) throw new Error('metricType is required');

    const device = await db.IotDevice.findByPk(deviceId);
    if (!device) throw new Error('IoT device not found');

    const log = await db.IotSensorLog.create({
        tenant_id: device.tenant_id,
        device_id: deviceId,
        shipment_id: device.shipment_id,
        metric_type: metricType,
        value,
        unit,
        recorded_at: recordedAt || new Date(),
        raw_payload: rawPayload,
    });

    await device.update({
        status: 'online',
        last_seen_at: new Date(),
        ...(metricType === 'battery' ? { battery_pct: value } : {}),
    });

    if (device.shipment_id) await checkThresholds(device, metricType, value);

    return log;
}

async function checkThresholds(device, metricType, value) {
    const thresholds = thresholdsFor(device);
    const rule = thresholds[metricType];
    if (!rule || value == null) return;

    const num = Number(value);
    const breached = (rule.min != null && num < rule.min) || (rule.max != null && num > rule.max);
    if (!breached) return;

    const alertTypeMap = {
        temperature: 'temperature', humidity: 'humidity', shock: 'shock',
        battery: 'battery_low', door: 'unauthorized_opening',
    };
    const alertType = alertTypeMap[metricType];
    if (!alertType) return;

    await createAlert({
        shipmentId: device.shipment_id,
        alertType,
        severity: metricType === 'battery' ? 'low' : 'high',
        message: `${metricType} reading ${num} out of range on device ${device.external_device_id || device.id}`,
        metadata: { deviceId: device.id, metricType, value: num, thresholds: rule },
        tenantId: device.tenant_id,
    });
}

/** Mark devices that haven't reported in `staleMinutes` as offline (periodic sweep). */
async function markStaleDevicesOffline(staleMinutes = 60) {
    const cutoff = new Date(Date.now() - staleMinutes * 60000);
    const [count] = await db.IotDevice.update(
        { status: 'offline' },
        { where: { status: 'online', last_seen_at: { [db.Sequelize.Op.lt]: cutoff } } },
    );
    return count;
}

module.exports = { ingestReading, checkThresholds, markStaleDevicesOffline, DEFAULT_THRESHOLDS };
