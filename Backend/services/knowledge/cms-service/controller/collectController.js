'use strict';
/**
 * Public event collector. Validated by collectSchema upstream. Always answers
 * 202 quickly — the beacon fires from page-unload handlers and must never see an
 * error or a slow response, and a public endpoint must not reveal whether a site
 * exists. All real work is enqueued off-request by ingestService.
 */
const ingestService = require('../service/analytics/ingestService');
const { TRACKER_JS, TRACKER_VERSION } = require('../service/analytics/trackerScript');
const { logger } = require('../platform/logger');

/** Serve the first-party tracker script (public, cacheable). */
function script(req, res) {
    res.type('application/javascript');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('X-Tracker-Version', TRACKER_VERSION);
    res.set('Access-Control-Allow-Origin', '*');
    // Helmet's default Cross-Origin-Resource-Policy: same-origin (set globally in
    // index.js) silently blocks every consuming frontend from loading this script
    // cross-origin, despite the ACAO: * above declaring it public -- confirmed live
    // (net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin on imperialpedia.com and every
    // other site embedding this tracker). Same override pattern already used for
    // /uploads in index.js.
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.send(TRACKER_JS);
}

async function collect(req, res) {
    const ctx = {
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
        origin: req.get('origin') || '',
        headers: req.headers || {},
    };
    try {
        const result = await ingestService.collect(req.validated, ctx);
        return res.status(202).json({ success: true, data: result });
    } catch (err) {
        // Never surface ingest failures to the beacon; log and ack.
        logger('analytics-collect').warn({ err: err && err.message }, 'collect ingest failed (acked)');
        return res.status(202).json({ success: true, data: { accepted: 0, rejected: 0, deferred: true } });
    }
}

module.exports = { collect, script };
