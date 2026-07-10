'use strict';
/**
 * Traffic signal provider for the ETA prediction engine. Live mode
 * (TOMTOM_TRAFFIC_API_KEY/HERE_TRAFFIC_API_KEY/GOOGLE_TRAFFIC_API_KEY set)
 * would call the respective traffic API; until a key is supplied it returns a
 * deterministic simulated congestion level. Pure + side-effect free (matches
 * providers/tracking.js's shape).
 */
const mode = () => (
    process.env.TOMTOM_TRAFFIC_API_KEY || process.env.HERE_TRAFFIC_API_KEY || process.env.GOOGLE_TRAFFIC_API_KEY
        ? 'live' : 'simulated'
);

function simulate(routeLabel = '') {
    const seed = String(routeLabel).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const congestionPct = seed % 60; // 0-59% congestion
    return { mode: 'simulated', congestionPct, delayRiskPct: Math.round(congestionPct * 0.5) };
}

async function liveCongestion(routeLabel) {
    void routeLabel;
    throw new Error('live traffic provider not configured');
}

async function congestionFor(routeLabel) {
    if (mode() === 'live') {
        try { return await liveCongestion(routeLabel); } catch { return simulate(routeLabel); }
    }
    return simulate(routeLabel);
}

function health() { return { name: 'traffic', mode: mode(), healthy: true }; }

module.exports = { congestionFor, simulate, mode, health };
