'use strict';
const { buildLogoutToken } = require('./logoutToken');
const { isSafeHttpUrl } = require('./safeUrl');
const logger = require('../utils/logger');

/**
 * Send an OIDC back-channel logout POST to each RP that had a session. Each RP receives a freshly
 * minted logout_token (aud = that client). Per-client failures are isolated and never thrown — a
 * single unreachable RP must not block logout of the others or the OP session itself.
 *
 * targets: [{ clientId, uri }]
 */
async function notifyClients({ sid, sub, targets }) {
    if (!Array.isArray(targets) || targets.length === 0) return { sent: 0, failed: 0 };

    // Defense-in-depth SSRF guard (config is already validated at write time): never
    // POST to a loopback/private/link-local/metadata host even if a stale row exists.
    const safeTargets = targets.filter((t) => {
        if (t && isSafeHttpUrl(t.uri)) return true;
        logger.warn({ clientId: t && t.clientId }, 'back-channel logout: skipping unsafe/internal target uri');
        return false;
    });
    if (safeTargets.length === 0) return { sent: 0, failed: 0, skipped: targets.length };

    const results = await Promise.allSettled(safeTargets.map(async ({ clientId, uri }) => {
        const logoutToken = buildLogoutToken({ clientId, sub, sid });
        const controller  = new AbortController();
        const timer       = setTimeout(() => controller.abort(), 3000);
        try {
            const res = await fetch(uri, {
                method:  'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:    new URLSearchParams({ logout_token: logoutToken }).toString(),
                signal:  controller.signal,
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
        } finally { clearTimeout(timer); }
    }));

    const sent    = results.filter(r => r.status === 'fulfilled').length;
    const failed  = results.length - sent;
    const skipped = targets.length - safeTargets.length;
    if (failed) logger.warn({ sid, failed, total: targets.length }, 'back-channel logout: some RPs failed');
    return { sent, failed, skipped };
}

module.exports = { notifyClients };
