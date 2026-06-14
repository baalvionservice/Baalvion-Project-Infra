'use strict';
/**
 * ============================================================================
 * AfterShip Tracking API v4 adapter — REAL carrier shipment visibility.
 * ============================================================================
 * Resolves a (carrier slug + tracking number) into a normalized shipment
 * milestone + checkpoint history. AfterShip aggregates 1000+ carriers behind one
 * REST API, so this single adapter covers ocean lines, couriers and postal.
 *
 * API:  https://www.aftership.com/docs/tracking/quickstart/api-quickstart
 *   Base   https://api.aftership.com/v4
 *   Auth   header  aftership-api-key: <key>   (legacy alias: as-api-key)
 *   Read   GET  /trackings/{slug}/{tracking_number}
 *   Create POST /trackings  { tracking: { tracking_number, slug?, title } }
 *
 * POSTURE: FAIL-OPEN / DEGRADED. Tracking is observational — track() NEVER
 * rejects. On ANY error (timeout / 5xx / not-configured / parse failure) it
 * resolves to { status: UNKNOWN, events: [], degraded: true } so a missing or
 * down provider degrades visibility but NEVER blocks order fulfillment. This is
 * the OPPOSITE posture from the payment/sanctions adapters (which fail closed).
 *
 * Required configuration (env / secret manager — NEVER hardcode):
 *   AFTERSHIP_API_KEY         AfterShip API key            (required)
 *   AFTERSHIP_WEBHOOK_SECRET  verify inbound tracking webhooks (optional)
 *   AFTERSHIP_BASE_URL        override base url             (optional)
 *   CARRIER_TIMEOUT_MS        per-attempt timeout, ms       (optional, default 5000)
 */
const { request, IntegrationTimeoutError, IntegrationHttpError } = require('../../_shared/httpClient');
const { env: defaultEnv, parseHttpUrl } = require('../../_shared/config');
const { TRACKING_STATUS } = require('../contract');

const DEFAULT_BASE_URL = 'https://api.aftership.com/v4';
const DEFAULT_HOST = 'api.aftership.com';
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TRACKING_NUMBER_LEN = 64; // sane upper bound; over -> degraded (fail-open)
const REQUIRED = ['AFTERSHIP_API_KEY'];
const NOT_FOUND = 404;

/**
 * AfterShip `tag` -> normalized TRACKING_STATUS.
 * Tags: https://www.aftership.com/docs/tracking/others/tags-and-subtags
 *   Pending / InfoReceived           -> BOOKED
 *   InTransit                        -> IN_TRANSIT
 *   OutForDelivery                   -> OUT_FOR_DELIVERY
 *   AttemptFail / Exception / Expired-> EXCEPTION
 *   Delivered                        -> DELIVERED
 *   AvailableForPickup               -> OUT_FOR_DELIVERY (it has arrived, awaiting collection)
 * Customs checkpoints are detected separately and override to CUSTOMS_HOLD.
 */
const TAG_MAP = Object.freeze({
    Pending: TRACKING_STATUS.BOOKED,
    InfoReceived: TRACKING_STATUS.BOOKED,
    InTransit: TRACKING_STATUS.IN_TRANSIT,
    OutForDelivery: TRACKING_STATUS.OUT_FOR_DELIVERY,
    AvailableForPickup: TRACKING_STATUS.OUT_FOR_DELIVERY,
    AttemptFail: TRACKING_STATUS.EXCEPTION,
    Exception: TRACKING_STATUS.EXCEPTION,
    Expired: TRACKING_STATUS.EXCEPTION,
    Delivered: TRACKING_STATUS.DELIVERED,
});

/**
 * Map an AfterShip `tag` to a normalized status.
 * @param {string} tag
 * @returns {keyof typeof TRACKING_STATUS}
 */
function mapTag(tag) {
    return TAG_MAP[String(tag || '').trim()] || TRACKING_STATUS.UNKNOWN;
}

/**
 * Detect a customs-related checkpoint. AfterShip surfaces customs activity in a
 * checkpoint's `tag`/`subtag`/`message` rather than the top-level tag, so a
 * shipment held at customs is otherwise reported as plain InTransit.
 * @param {{ tag?: string, subtag?: string, subtag_message?: string, message?: string }} cp
 * @returns {boolean}
 */
function isCustomsCheckpoint(cp) {
    if (!cp) return false;
    const hay = [cp.tag, cp.subtag, cp.subtag_message, cp.message]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return hay.includes('customs') || hay.includes('clearance') || hay.includes('held by customs');
}

/** Build a normalized event `location` string from a checkpoint. */
function checkpointLocation(cp) {
    const parts = [cp.city, cp.state, cp.country_name || cp.country_iso3].filter(Boolean);
    if (parts.length) return parts.join(', ');
    return cp.location || undefined;
}

/**
 * Normalize a single AfterShip checkpoint to a TrackingEvent.
 * @returns {import('../contract').TrackingEvent}
 */
function toEvent(cp) {
    const status = isCustomsCheckpoint(cp) ? TRACKING_STATUS.CUSTOMS_HOLD : mapTag(cp.tag);
    return {
        timestamp: cp.checkpoint_time || cp.created_at || undefined,
        status,
        location: checkpointLocation(cp),
        description: cp.message || cp.subtag_message || undefined,
    };
}

/**
 * Normalize a full AfterShip `tracking` object into a TrackingResult.
 * The latest milestone is the top-level tag, EXCEPT when the most recent
 * checkpoint is a customs event still in transit — then we surface CUSTOMS_HOLD
 * so the order path can see the shipment is stuck in clearance.
 * @param {object} tracking AfterShip `data.tracking`
 * @param {{ trackingNumber: string, carrier?: string }} req
 * @returns {import('../contract').TrackingResult}
 */
function toResult(tracking, req) {
    const checkpoints = Array.isArray(tracking?.checkpoints) ? tracking.checkpoints : [];
    const events = checkpoints.map(toEvent);

    let status = mapTag(tracking?.tag);
    // Customs override: if not yet delivered and the latest checkpoint is a
    // customs hold, reflect that as the current milestone.
    if (status !== TRACKING_STATUS.DELIVERED && events.length) {
        const latest = events[events.length - 1];
        if (latest.status === TRACKING_STATUS.CUSTOMS_HOLD) status = TRACKING_STATUS.CUSTOMS_HOLD;
    }

    return {
        trackingNumber: tracking?.tracking_number || req.trackingNumber,
        carrier: tracking?.slug || req.carrier,
        status,
        events,
        eta: tracking?.expected_delivery || undefined,
        degraded: false,
    };
}

/** A degraded (fail-open) result — provider unavailable / not configured. */
function degraded(req, reason) {
    return {
        trackingNumber: req.trackingNumber,
        carrier: req.carrier,
        status: TRACKING_STATUS.UNKNOWN,
        events: [],
        degraded: true,
        ...(reason ? { reason } : {}),
    };
}

/**
 * Normalize an injected `env` dep. Accepts either a resolver function
 * `(name) => value`, a plain env-source object `{ NAME: value }`, or nothing
 * (reads process.env). Always returns trimmed/blank-as-undefined semantics.
 * @param {((name:string)=>string)|Record<string,string>|undefined} dep
 * @returns {(name:string)=>(string|undefined)}
 */
function resolveEnv(dep) {
    if (typeof dep === 'function') return (name) => normalizeVal(dep(name));
    if (dep && typeof dep === 'object') return (name) => defaultEnv(name, dep);
    return (name) => defaultEnv(name);
}

function normalizeVal(v) {
    if (v == null) return undefined;
    const t = String(v).trim();
    return t === '' ? undefined : t;
}

/**
 * @param {{ env?: ((name:string)=>string)|Record<string,string>, http?: typeof request }} [deps]
 * @returns {import('../contract').CarrierProvider & { IS_CONFIGURED: boolean }}
 */
function createAftershipProvider(deps = {}) {
    const env = resolveEnv(deps.env);
    const http = deps.http || request;

    const apiKey = env('AFTERSHIP_API_KEY');
    const rawBaseUrl = (env('AFTERSHIP_BASE_URL') || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const allowCustomHost = env('AFTERSHIP_ALLOW_CUSTOM_HOST') === 'true';
    const timeoutMs = Number(env('CARRIER_TIMEOUT_MS')) || DEFAULT_TIMEOUT_MS;
    const configured = REQUIRED.every((n) => env(n) !== undefined);

    // SSRF guard: the AFTERSHIP_API_KEY is sent as a request header to baseUrl.
    // Lock the host to api.aftership.com unless an operator explicitly opts in via
    // AFTERSHIP_ALLOW_CUSTOM_HOST=true, and require a parseable http/https URL.
    // FAIL-OPEN: an invalid/unexpected host means we never send the key there —
    // track() degrades to UNKNOWN instead of leaking the key or throwing.
    let baseUrl = rawBaseUrl;
    let baseUrlReason;
    try {
        parseHttpUrl(rawBaseUrl, allowCustomHost ? {} : { allowHosts: [DEFAULT_HOST] });
    } catch (err) {
        baseUrlReason = err.code === 'HOST_NOT_ALLOWED' ? 'BASE_URL_HOST_NOT_ALLOWED' : 'BASE_URL_INVALID';
        baseUrl = null; // poison: any request attempt degrades before sending the key
    }

    function headers() {
        return {
            'aftership-api-key': apiKey,
            'as-api-key': apiKey, // legacy alias accepted by AfterShip
            'Content-Type': 'application/json',
        };
    }

    /** GET an existing tracking; null on 404 (not yet registered). */
    async function fetchTracking({ slug, trackingNumber }) {
        const url = `${baseUrl}/trackings/${encodeURIComponent(slug)}/${encodeURIComponent(trackingNumber)}`;
        try {
            const { json } = await http({ url, method: 'GET', headers: headers(), timeoutMs, retries: 2 });
            return json?.data?.tracking || null;
        } catch (err) {
            if (err instanceof IntegrationHttpError && err.status === NOT_FOUND) return null;
            throw err;
        }
    }

    /** Register a tracking number; tolerate the 409 "already exists" race. */
    async function registerTracking({ slug, trackingNumber }) {
        const body = JSON.stringify({
            tracking: {
                tracking_number: trackingNumber,
                ...(slug ? { slug } : {}),
                title: trackingNumber,
            },
        });
        try {
            const { json } = await http({
                url: `${baseUrl}/trackings`,
                method: 'POST',
                headers: headers(),
                body,
                timeoutMs,
                retries: 0, // create is not idempotent on AfterShip; 409 is benign
            });
            return json?.data?.tracking || null;
        } catch (err) {
            // 409 = already tracked: fall through to a fresh read.
            if (err instanceof IntegrationHttpError && err.status === 409) return null;
            throw err;
        }
    }

    return {
        name: 'aftership',
        IS_PRODUCTION_SAFE: true,
        IS_CONFIGURED: configured,

        /**
         * Read shipment visibility. NEVER rejects (fail-open).
         * @param {{ trackingNumber: string, carrier?: string, tenantId?: string }} args
         * @returns {Promise<import('../contract').TrackingResult>}
         */
        async track(args = {}) {
            const req = { trackingNumber: args.trackingNumber, carrier: args.carrier };
            const tn = typeof req.trackingNumber === 'string' ? req.trackingNumber.trim() : '';
            if (!tn) return degraded(req, 'NO_TRACKING_NUMBER');
            if (tn.length > MAX_TRACKING_NUMBER_LEN) return degraded(req, 'TRACKING_NUMBER_TOO_LONG');
            if (!configured) return degraded(req, 'NOT_CONFIGURED');
            if (!baseUrl) return degraded(req, baseUrlReason || 'BASE_URL_INVALID');

            const slug = req.carrier; // AfterShip "slug" == carrier id

            try {
                let tracking = null;

                // Prefer: register-if-needed then fetch.
                if (slug) {
                    tracking = await fetchTracking({ slug, trackingNumber: req.trackingNumber });
                }
                if (!tracking) {
                    await registerTracking({ slug, trackingNumber: req.trackingNumber });
                    if (slug) {
                        tracking = await fetchTracking({ slug, trackingNumber: req.trackingNumber });
                    }
                }

                if (!tracking) {
                    // Registered but no data yet (AfterShip is still fetching) — or
                    // slug unknown so we couldn't read back. Degrade, don't block.
                    return degraded(req, 'NO_DATA_YET');
                }
                return toResult(tracking, req);
            } catch (err) {
                // FAIL-OPEN: any timeout / 5xx / network / parse error degrades.
                const reason = err instanceof IntegrationTimeoutError
                    ? 'TIMEOUT'
                    : (err instanceof IntegrationHttpError ? `HTTP_${err.status || 'ERR'}` : 'ERROR');
                return degraded(req, reason);
            }
        },
    };
}

module.exports = {
    createAftershipProvider,
    mapTag,
    isCustomsCheckpoint,
    toEvent,
    toResult,
    TAG_MAP,
    DEFAULT_BASE_URL,
    DEFAULT_HOST,
    DEFAULT_TIMEOUT_MS,
    MAX_TRACKING_NUMBER_LEN,
    REQUIRED,
};
