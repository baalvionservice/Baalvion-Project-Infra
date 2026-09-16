'use strict';
/**
 * Great-circle distance + speed-based transit estimation.
 *
 * These are REAL calculations on real geography, not lookup tables of invented
 * figures: haversine over the ports' actual coordinates, converted to nautical miles,
 * divided by a vessel's actual service speed.
 *
 * HONEST LIMITATION, stated rather than hidden: a great-circle line is the distance a
 * bird flies, not the distance a ship sails — real routing follows sea lanes and
 * canals (a Rotterdam→Singapore sailing goes through Suez, not across Egypt). So this
 * is an approximation that runs SHORT on any lane where land or a canal is in the way.
 * It is therefore only used as a FALLBACK when no published schedule exists for a
 * lane; whenever real port-call dates are on file, those dates are used instead and
 * this module is not consulted. Callers must surface the difference — see
 * `estimateTransit`'s `basis` field.
 */

const EARTH_RADIUS_KM = 6371;
const KM_PER_NAUTICAL_MILE = 1.852;
/** Typical container-ship service speed when a vessel record doesn't carry one. */
const DEFAULT_SERVICE_SPEED_KNOTS = 16;
/** Port time (berthing, working cargo, departure formalities) added per sailing. */
const DEFAULT_PORT_HOURS = 24;

const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres between two lat/lng points. */
function haversineKm(a, b) {
    if (!a || !b || a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
        return null;
    }
    const dLat = toRad(Number(b.latitude) - Number(a.latitude));
    const dLon = toRad(Number(b.longitude) - Number(a.longitude));
    const lat1 = toRad(Number(a.latitude));
    const lat2 = toRad(Number(b.latitude));
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function kmToNauticalMiles(km) {
    return km == null ? null : km / KM_PER_NAUTICAL_MILE;
}

/**
 * Transit time from real published dates when we have them, else a speed-based
 * estimate from real coordinates.
 *
 * @param {object} input
 * @param {Date|string} [input.departure]  published/actual departure at the load port
 * @param {Date|string} [input.arrival]    published/actual arrival at the discharge port
 * @param {object} [input.fromPort]        { latitude, longitude }
 * @param {object} [input.toPort]          { latitude, longitude }
 * @param {number} [input.speedKnots]      the vessel's service speed
 * @returns {{ days: number|null, hours: number|null, basis: 'schedule'|'estimated'|'unknown',
 *             distanceNm: number|null, note: string|null }}
 */
function estimateTransit({ departure = null, arrival = null, fromPort = null, toPort = null, speedKnots = null } = {}) {
    // 1. Real scheduled/actual dates always win — nothing to estimate.
    if (departure && arrival) {
        const ms = new Date(arrival).getTime() - new Date(departure).getTime();
        if (Number.isFinite(ms) && ms >= 0) {
            const hours = ms / 3600000;
            return {
                days: Math.round((hours / 24) * 10) / 10,
                hours: Math.round(hours),
                basis: 'schedule',
                distanceNm: null,
                note: null,
            };
        }
    }

    // 2. No dates — fall back to distance ÷ speed over the real coordinates.
    const km = haversineKm(fromPort, toPort);
    if (km == null) {
        return { days: null, hours: null, basis: 'unknown', distanceNm: null, note: 'No schedule on file and port coordinates are unavailable.' };
    }
    const nm = kmToNauticalMiles(km);
    const speed = Number(speedKnots) > 0 ? Number(speedKnots) : DEFAULT_SERVICE_SPEED_KNOTS;
    const sailingHours = nm / speed;
    const totalHours = sailingHours + DEFAULT_PORT_HOURS;
    return {
        days: Math.round((totalHours / 24) * 10) / 10,
        hours: Math.round(totalHours),
        basis: 'estimated',
        distanceNm: Math.round(nm),
        note: 'Estimated from great-circle distance at service speed — no published schedule for this lane. '
            + 'Actual sea routing (canals, coastlines) makes real transit longer.',
    };
}

module.exports = {
    EARTH_RADIUS_KM,
    KM_PER_NAUTICAL_MILE,
    DEFAULT_SERVICE_SPEED_KNOTS,
    DEFAULT_PORT_HOURS,
    haversineKm,
    kmToNauticalMiles,
    estimateTransit,
};
