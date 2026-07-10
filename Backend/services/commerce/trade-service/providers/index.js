'use strict';
/**
 * Provider abstraction layer. Registers external integrations behind a uniform
 * interface (health + mode), validates required/optional secrets, and reports
 * sandbox/live mode. Real providers implement live calls with graceful fallback;
 * unconfigured providers run in 'simulated' mode until their key is supplied.
 */
const fx = require('./fx');
const tracking = require('./tracking');
const esign = require('./esign');
const notificationChannels = require('./notificationChannels');
const weather = require('./weather');
const traffic = require('./traffic');
const gps = require('../service/tracking-platform/geoProviders/gps');

// Declared integrations + the env key that activates 'live' mode.
const REGISTRY = [
    { name: 'fx', key: null, note: 'Frankfurter/ECB — keyless live FX', impl: fx },
    { name: 'email', key: 'EMAIL_API_KEY', note: 'Transactional email (e.g. Postmark/SES)' },
    { name: 'sms', key: 'SMS_API_KEY', note: 'SMS delivery (e.g. Twilio)' },
    { name: 'storage', key: 'STORAGE_BUCKET', note: 'Object storage for uploads (e.g. S3/GCS)' },
    { name: 'ai', key: 'GEMINI_API_KEY', note: 'Genkit/Gemini AI flows' },
    { name: 'ocr', key: 'OCR_API_KEY', note: 'Document OCR/extraction' },
    { name: 'tracking', key: 'TRACKING_API_KEY', note: 'Carrier shipment tracking (live aggregator or simulated)', impl: tracking },
    { name: 'esign', key: 'ESIGN_API_KEY', note: 'E-signature for B/L + contracts (DocuSeal/Adobe Sign)', impl: esign },
    { name: 'whatsapp', key: 'WHATSAPP_API_KEY', note: 'Shipment alert delivery via WhatsApp Business API' },
    { name: 'slack', key: 'SLACK_WEBHOOK_URL', note: 'Shipment alert delivery via Slack incoming webhook' },
    { name: 'teams', key: 'TEAMS_WEBHOOK_URL', note: 'Shipment alert delivery via Microsoft Teams incoming webhook' },
    { name: 'tracking_webhook', key: 'TRACKING_WEBHOOK_URL', note: 'Generic outbound webhook for shipment alert fan-out' },
    { name: 'weather', key: 'OPENWEATHER_API_KEY', note: 'Weather signal for ETA prediction (live aggregator or simulated)', impl: weather },
    { name: 'traffic', key: 'TOMTOM_TRAFFIC_API_KEY', note: 'Traffic signal for ETA prediction (live aggregator or simulated)', impl: traffic },
    { name: 'gps_google', key: 'GOOGLE_MAPS_API_KEY', note: 'Live GPS position lookup via Google Maps' },
    { name: 'gps_mapbox', key: 'MAPBOX_ACCESS_TOKEN', note: 'Live GPS position lookup via Mapbox' },
    { name: 'gps_tomtom', key: 'TOMTOM_API_KEY', note: 'Live GPS position lookup via TomTom' },
    { name: 'gps_here', key: 'HERE_API_KEY', note: 'Live GPS position lookup via HERE' },
    { name: 'gps_traccar', key: 'TRACCAR_API_URL', note: 'Live GPS position lookup via a self-hosted Traccar server' },
];

function mode(entry) {
    if (!entry.key) return 'live';                 // keyless live provider
    return process.env[entry.key] ? 'live' : 'simulated';
}

// Boot-time secret report (non-fatal): which providers are live vs simulated.
function validateEnv() {
    const required = ['JWT_ACCESS_SECRET', 'DB_NAME', 'DB_USER'];
    const missingRequired = required.filter((k) => !process.env[k]);
    const providers = REGISTRY.map((e) => ({ name: e.name, mode: mode(e), key: e.key, note: e.note }));
    return {
        missingRequired,
        weakSecret: !process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === 'replace-with-strong-secret',
        providers,
    };
}

function logEnvReport() {
    const r = validateEnv();
    if (r.missingRequired.length) console.warn('[providers] MISSING required env:', r.missingRequired.join(', '));
    if (r.weakSecret) console.warn('[providers] WARNING: JWT_ACCESS_SECRET is unset/default — set a strong secret before production.');
    const live = r.providers.filter((p) => p.mode === 'live').map((p) => p.name);
    const sim = r.providers.filter((p) => p.mode === 'simulated').map((p) => p.name);
    console.log(`[providers] live: ${live.join(', ') || 'none'} | simulated (awaiting keys): ${sim.join(', ') || 'none'}`);
}

async function healthAll() {
    const live = await fx.health();
    const others = REGISTRY.filter((e) => e.key).map((e) => ({
        name: e.name, mode: mode(e), healthy: mode(e) === 'live', note: e.note,
    }));
    const cache = require('../cache'); // eslint-disable-line global-require
    return { generatedAt: new Date().toISOString(), cache: cache.health(), providers: [live, ...others] };
}

module.exports = { fx, tracking, esign, notificationChannels, weather, traffic, gps, validateEnv, logEnvReport, healthAll, REGISTRY };
