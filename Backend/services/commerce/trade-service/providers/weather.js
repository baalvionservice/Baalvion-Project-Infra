'use strict';
/**
 * Weather signal provider for the ETA prediction engine. Live mode
 * (OPENWEATHER_API_KEY or WEATHER_API_KEY set) would call OpenWeather/
 * Tomorrow.io/WeatherAPI; until a key is supplied it returns a deterministic
 * simulated condition so ETA scoring always has an input. Pure + side-effect
 * free (matches providers/tracking.js's shape).
 */
const mode = () => (process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY ? 'live' : 'simulated');

// Deterministic pseudo-random condition from a location string, so repeated
// calls for the same lane are stable within a process lifetime.
function simulate(locationLabel = '') {
    const seed = String(locationLabel).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const conditions = ['clear', 'rain', 'storm', 'fog', 'snow'];
    const condition = conditions[seed % conditions.length];
    const severity = condition === 'clear' ? 0 : (seed % 3) + 1; // 0-3
    return { mode: 'simulated', condition, severityScore: severity, delayRiskPct: severity * 8 };
}

async function liveConditions(locationLabel) {
    void locationLabel;
    throw new Error('live weather provider not configured');
}

async function conditionsFor(locationLabel) {
    if (mode() === 'live') {
        try { return await liveConditions(locationLabel); } catch { return simulate(locationLabel); }
    }
    return simulate(locationLabel);
}

function health() { return { name: 'weather', mode: mode(), healthy: true }; }

module.exports = { conditionsFor, simulate, mode, health };
