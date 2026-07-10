'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — pluggable GPS provider
 * registry (Google/Mapbox/TomTom/HERE/Traccar), mirroring
 * service/freight/connectors/'s per-carrier registry pattern and
 * providers/tracking.js's simulated/live switch. Each provider resolves the
 * current position for a device id; until its env key is configured it
 * returns null (caller falls back to the last known tracking_event), so the
 * platform works fully on ingested webhook/manual pings without a paid GPS
 * subscription.
 */
const REGISTRY = [
    { name: 'google', key: 'GOOGLE_MAPS_API_KEY' },
    { name: 'mapbox', key: 'MAPBOX_ACCESS_TOKEN' },
    { name: 'tomtom', key: 'TOMTOM_API_KEY' },
    { name: 'here', key: 'HERE_API_KEY' },
    { name: 'traccar', key: 'TRACCAR_API_URL' },
];

const mode = (provider) => {
    const entry = REGISTRY.find((p) => p.name === provider);
    if (!entry) return 'unsupported';
    return process.env[entry.key] ? 'live' : 'simulated';
};

/**
 * Resolve the current position for a device from the named provider.
 * Simulated mode returns null (no synthetic GPS fabrication — the caller
 * should rely on ingested tracking_events instead of a fake position).
 */
async function currentPosition(provider, externalDeviceId) {
    if (mode(provider) !== 'live') return null;
    // Live wiring point: call the provider's device/position API here when its
    // key is configured. Left unimplemented (no SDK dependency added) until a
    // concrete provider is selected for production use.
    void externalDeviceId;
    return null;
}

function health() {
    return REGISTRY.map((p) => ({ name: p.name, mode: mode(p.name) }));
}

module.exports = { REGISTRY, mode, currentPosition, health };
