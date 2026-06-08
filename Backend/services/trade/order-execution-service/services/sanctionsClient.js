'use strict';
/**
 * Sanctions screening client (R8). Returns { status, confidence, matches }.
 *
 * Backend is selectable via config.sanctions.provider:
 *   'risk-service'  — POST {url}/api/v1/sanctions/screen to the in-repo engine.
 *   'opensanctions' — the REAL OpenSanctions/yente adapter (consolidated OFAC+EU+UN+UK).
 * Both FAIL-CLOSED: on unavailability they THROW, so counterpartyScreening catches per
 * party and screeningPolicy blocks the order (never a silent CLEAR).
 */
const config = require('../config/appConfig');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Lazily construct the OpenSanctions adapter once (reads its own YENTE_* env).
let _osProvider = null;
function openSanctionsProvider() {
    if (!_osProvider) {
        _osProvider = require('../integrations/sanctions/realAdapter').createRealSanctionsProvider();
    }
    return _osProvider;
}

async function screen({ name, country, tenantId }, opts = {}) {
    // Provider routing — opts.provider/opts.adapter let tests inject without env.
    const provider = opts.provider || config.sanctions.provider;
    if (provider === 'opensanctions') {
        const adapter = opts.adapter || openSanctionsProvider();
        return adapter.screen({ name, country, tenantId });
    }

    const url = opts.url || config.sanctions.url;
    const timeoutMs = opts.timeoutMs || config.sanctions.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const headers = { 'Content-Type': 'application/json' };
        // X-Tenant-ID must be a UUID for the engine's tenant context; omit otherwise
        // (the watchlist + verdict are global — only the audit row is tenant-scoped).
        if (tenantId && UUID_RE.test(String(tenantId))) headers['X-Tenant-ID'] = String(tenantId);
        const res = await fetch(`${url}/api/v1/sanctions/screen`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: String(name), ...(country ? { country: String(country) } : {}) }),
            signal: controller.signal,
        });
        if (!res.ok) throw new Error(`sanctions screen HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { screen };
