'use strict';
// Dual-issue window (Phase 4 A3): after a successful LOCAL login, law-service ALSO requests a
// canonical RS256 token from auth-service via the internal S2S endpoint /v1/auth/issue-on-behalf.
// Feature-flagged via LAW_DUAL_ISSUE_ENABLED. NEVER breaks login: any failure returns null and
// login proceeds with the legacy HS256 token only. In-memory migration telemetry is exposed.
const crypto = require('crypto');
const config = require('../config/appConfig');

// Migration metrics (in-memory counters; exposed for /metrics wiring or inspection).
const telemetry = { upgraded: 0, failed: 0, rejectedUsers: 0, staleLegacy: 0, lastError: null };

async function issueCanonicalToken({ email }) {
    const { enabled, authServiceUrl, internalSecret, serviceName } = config.dualIssue;
    if (!enabled) return null;
    if (!internalSecret) { telemetry.failed++; telemetry.lastError = 'INTERNAL_SERVICE_SECRET unset'; return null; }

    const body = JSON.stringify({ email });
    const ts   = String(Date.now());
    const sig  = crypto.createHmac('sha256', internalSecret).update(`${serviceName}.${ts}.${body}`).digest('hex');

    try {
        const res = await fetch(`${authServiceUrl}/v1/auth/issue-on-behalf`, {
            method: 'POST',
            headers: {
                'content-type':         'application/json',
                'x-internal-service':   serviceName,
                'x-internal-timestamp': ts,
                'x-internal-signature': sig,
            },
            body,
        });
        if (res.status === 404) { telemetry.rejectedUsers++; return null; } // not yet imported into auth-service
        if (!res.ok) { telemetry.failed++; telemetry.lastError = `HTTP ${res.status}`; return null; }
        const json = await res.json();
        const token = json?.data?.accessToken || null;
        if (token) telemetry.upgraded++; else { telemetry.failed++; telemetry.lastError = 'no accessToken in response'; }
        return token;
    } catch (err) {
        telemetry.failed++;
        telemetry.lastError = err.message;
        console.warn(`[law][dual-issue] canonical upgrade failed for ${email}: ${err.message}`);
        return null;
    }
}

module.exports = { issueCanonicalToken, telemetry };
