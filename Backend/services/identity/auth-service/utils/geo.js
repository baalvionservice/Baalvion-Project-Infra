'use strict';
// Ported verbatim from the retired session-service (Phase 2 enrichment absorption).
// Pure functions — no DB, no I/O beyond the in-process geoip-lite dataset.
const geoip = require('geoip-lite');

function lookupIp(ip) {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return { country: 'LOCAL', region: null, city: null, lat: null, lon: null, timezone: null };
    }
    const geo = geoip.lookup(ip);
    if (!geo) return { country: null, region: null, city: null, lat: null, lon: null, timezone: null };
    return {
        country:  geo.country  || null,
        region:   geo.region   || null,
        city:     geo.city     || null,
        lat:      geo.ll?.[0]  ?? null,
        lon:      geo.ll?.[1]  ?? null,
        timezone: geo.timezone || null,
    };
}

// Haversine distance in kilometres between two lat/lon pairs.
function distanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return (deg * Math.PI) / 180; }

module.exports = { lookupIp, distanceKm };
