'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — geofence containment +
 * entry/exit/dwell detection. Pure math (haversine circle + ray-casting
 * polygon), no external geo dependency (matches the project's "no PostGIS"
 * choice — shapes are plain JSONB).
 *
 * Hooked from service/tracking/trackingEngine.js.recordTrackingEvent: every
 * new GPS ping is checked against all active geofences for the shipment's
 * tenant, and geofence_events + shipment_alerts are raised on entry/exit/dwell.
 */
const db = require('../../models');
const { createAlert } = require('./alertEngine');

const EARTH_RADIUS_M = 6371000;
const DEFAULT_DWELL_MINUTES = Number(process.env.GEOFENCE_DWELL_MINUTES || 120);

function toRad(deg) { return (deg * Math.PI) / 180; }

/** Haversine distance in meters between two lat/lng points. */
function haversineMeters(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Ray-casting point-in-polygon. `points` is an array of {lat, lng}. */
function pointInPolygon(lat, lng, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
        const pi = points[i]; const pj = points[j];
        const intersects = (pi.lat > lat) !== (pj.lat > lat)
            && lng < ((pj.lng - pi.lng) * (lat - pi.lat)) / (pj.lat - pi.lat) + pi.lng;
        if (intersects) inside = !inside;
    }
    return inside;
}

/** Is (lat,lng) inside a geofence's shape? */
function isContained(shape, lat, lng) {
    if (!shape) return false;
    if (shape.type === 'circle' && shape.center) {
        const r = Number(shape.radius_m) || 0;
        return haversineMeters(lat, lng, shape.center.lat, shape.center.lng) <= r;
    }
    if (shape.type === 'polygon' && Array.isArray(shape.points) && shape.points.length >= 3) {
        return pointInPolygon(lat, lng, shape.points);
    }
    return false;
}

/**
 * Evaluate a single tracking-event location against every active geofence
 * for the shipment's tenant, writing geofence_events + raising alerts on
 * state transitions (entry/exit) and on dwell-exceeded.
 *
 * @param {import('sequelize').Model} trackingEvent a just-created TrackingEvent row
 */
async function evaluateGeofences(trackingEvent) {
    if (trackingEvent.latitude == null || trackingEvent.longitude == null) return [];
    const lat = Number(trackingEvent.latitude);
    const lng = Number(trackingEvent.longitude);
    const shipmentId = trackingEvent.shipment_id;

    const fences = await db.Geofence.findAll({ where: { tenant_id: trackingEvent.tenant_id, active: true } });
    if (!fences.length) return [];

    const raised = [];
    for (const fence of fences) {
        const inside = isContained(fence.shape, lat, lng);
        const lastEvent = await db.GeofenceEvent.findOne({
            where: { geofence_id: fence.id, shipment_id: shipmentId },
            order: [['occurred_at', 'DESC']],
        });
        const wasInside = lastEvent ? lastEvent.event_type !== 'exit' : false;

        if (inside && !wasInside) {
            const ev = await db.GeofenceEvent.create({
                tenant_id: trackingEvent.tenant_id, geofence_id: fence.id, shipment_id: shipmentId,
                event_type: 'entry', latitude: lat, longitude: lng,
            });
            raised.push(ev);
            await createAlert({
                shipmentId, alertType: 'geofence_enter', severity: 'low',
                message: `Shipment entered geofence "${fence.name}"`,
                metadata: { geofenceId: fence.id, fenceType: fence.fence_type },
                tenantId: trackingEvent.tenant_id,
            });
        } else if (!inside && wasInside) {
            const ev = await db.GeofenceEvent.create({
                tenant_id: trackingEvent.tenant_id, geofence_id: fence.id, shipment_id: shipmentId,
                event_type: 'exit', latitude: lat, longitude: lng,
            });
            raised.push(ev);
            await createAlert({
                shipmentId, alertType: 'geofence_exit', severity: 'low',
                message: `Shipment exited geofence "${fence.name}"`,
                metadata: { geofenceId: fence.id, fenceType: fence.fence_type },
                tenantId: trackingEvent.tenant_id,
            });
        } else if (inside && wasInside && lastEvent && lastEvent.event_type === 'entry') {
            const dwellMinutes = (Date.now() - new Date(lastEvent.occurred_at).getTime()) / 60000;
            if (dwellMinutes > DEFAULT_DWELL_MINUTES) {
                const alreadyFlagged = await db.GeofenceEvent.findOne({
                    where: { geofence_id: fence.id, shipment_id: shipmentId, event_type: 'dwell_exceeded' },
                });
                if (!alreadyFlagged) {
                    const ev = await db.GeofenceEvent.create({
                        tenant_id: trackingEvent.tenant_id, geofence_id: fence.id, shipment_id: shipmentId,
                        event_type: 'dwell_exceeded', latitude: lat, longitude: lng,
                        metadata: { dwellMinutes: Math.round(dwellMinutes) },
                    });
                    raised.push(ev);
                    await createAlert({
                        shipmentId, alertType: 'delay', severity: 'medium',
                        message: `Shipment has dwelled at "${fence.name}" for ${Math.round(dwellMinutes)}m (limit ${DEFAULT_DWELL_MINUTES}m)`,
                        metadata: { geofenceId: fence.id, dwellMinutes: Math.round(dwellMinutes) },
                        tenantId: trackingEvent.tenant_id,
                    });
                }
            }
        }
    }
    return raised;
}

module.exports = { haversineMeters, pointInPolygon, isContained, evaluateGeofences, DEFAULT_DWELL_MINUTES };
