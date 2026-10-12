'use strict';
/**
 * Tiny JSON-over-HTTPS helper for the public registry lookups.
 *
 * Every registry call is best-effort evidence, never a gate: it has a short timeout
 * and reports failure as data instead of throwing, so a slow or down registry can
 * never hold up a customer's submission.
 */
const TIMEOUT_MS = 6000;

async function getJson(url, { headers = {}, timeoutMs = TIMEOUT_MS, fetchImpl = fetch } = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetchImpl(url, { headers: { Accept: 'application/json', ...headers }, signal: ctrl.signal });
        const text = await res.text();
        let body = null;
        try { body = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
        return { ok: res.ok, status: res.status, body };
    } catch (err) {
        return { ok: false, status: 0, body: null, error: err.name === 'AbortError' ? 'timed out' : err.message };
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { getJson, TIMEOUT_MS };
