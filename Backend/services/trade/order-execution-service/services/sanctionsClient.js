'use strict';
/**
 * Thin client for the risk-service sanctions screening API (R8).
 * POST {url}/api/v1/sanctions/screen  in { name, country? }  out { status, confidence, matches }.
 * The engine persists its own tenant-scoped sanctions_screenings audit row + emits
 * sanctions.screening.completed, so this client only needs the verdict.
 */
const config = require('../config/appConfig');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function screen({ name, country, tenantId }, opts = {}) {
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
