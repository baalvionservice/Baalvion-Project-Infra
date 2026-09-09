'use strict';
/**
 * Resolves which site a request came from, for lifecycle-email theming. Mirrors
 * Frontend/auth-baalvion/src/lib/themes.ts's HOST_BRAND map (the same registry that themes the
 * shared login page) — keep these two in sync by hand when a new brand/domain is wired in.
 * Falls back to the flagship 'baalvion' theme when the host is unknown or absent (e.g. OAuth
 * callbacks, which don't carry an Origin header on the browser's redirect back from the
 * provider — there is no reliable per-request signal there today).
 */

// Exact matches — *.baalvion.com subdomains are each a DISTINCT product (mining ≠ jobs ≠ trade),
// so these are never suffix-matched, only looked up verbatim.
const HOST_BRAND = {
    'baalvion.com': 'baalvion',
    'www.baalvion.com': 'baalvion',
    'about.baalvion.com': 'about',
    'admin.baalvion.com': 'admin',
    'trade.baalvion.com': 'gti',
    'ir.baalvion.com': 'ir',
    'mining.baalvion.com': 'mining',
    'jobs.baalvion.com': 'jobs',
    'connect.baalvion.com': 'brand-connector',
    'canwemarry.com': 'canwemarry',
    'www.canwemarry.com': 'canwemarry',
};

// Apex domains where EVERY subdomain is the same product/brand (e.g. copyrightvideo.
// controlthemarket.com, community.marketunderworld.com) — matched by suffix, not just the
// bare apex, mirroring Frontend/auth-baalvion/src/lib/brand.ts's isAllowedHost baseline.
const APEX_BRAND = {
    'baalvionstack.com': 'proxy',
    'amarisemaisonavenue.com': 'amarise',
    'controlthemarket.com': 'ctm',
    'imperialpedia.com': 'imperialpedia',
    'lawelitenetwork.com': 'law',
    'marketunderworld.com': 'marketunderworld',
};

const DEFAULT_BRAND = 'baalvion';

/**
 * Extra host→brand entries supplied by configuration, as `host=brand` pairs:
 *
 *   BRAND_HOST_OVERRIDES=localhost:3071=canwemarry,staging-cwm.example=canwemarry
 *
 * This exists because the registry above keys on real production hostnames, and every
 * application in local development is a port on `localhost` — indistinguishable to a
 * hostname lookup, so every local signup resolved to the default brand and its lifecycle
 * links went to whichever app FRONTEND_URL named. Overrides are matched on host INCLUDING
 * the port, which is what separates one local app from another. Configuration rather than
 * code, so no environment's hostnames are baked into the service.
 */
function parseOverrides() {
    const raw = process.env.BRAND_HOST_OVERRIDES || '';
    const out = {};
    for (const pair of raw.split(',')) {
        const [host, brand] = pair.split('=').map((s) => (s || '').trim().toLowerCase());
        if (host && brand) out[host] = brand;
    }
    return out;
}
const HOST_OVERRIDES = parseOverrides();

/** @param {string} hostname bare hostname, no protocol/port (e.g. 'about.baalvion.com') */
function brandForHost(hostname) {
    if (!hostname) return DEFAULT_BRAND;
    const h = String(hostname).toLowerCase();
    if (HOST_OVERRIDES[h]) return HOST_OVERRIDES[h];
    if (HOST_BRAND[h]) return HOST_BRAND[h];
    for (const apex of Object.keys(APEX_BRAND)) {
        if (h === apex || h.endsWith(`.${apex}`)) return APEX_BRAND[apex];
    }
    return DEFAULT_BRAND;
}

/**
 * Resolves a brand slug from a request's Origin (preferred — set on same-site fetch/XHR from
 * every frontend SPA) or Referer header (fallback — present on some non-CORS navigations).
 * @param {import('express').Request} req
 */
function brandFromRequest(req) {
    const raw = req.get('origin') || req.get('referer') || '';
    if (!raw) return DEFAULT_BRAND;
    try {
        const url = new URL(raw);
        // `host` carries the port, `hostname` does not. Try the fuller form first so a
        // configured override can distinguish two applications on the same hostname; fall
        // back to the bare hostname, which is what production entries are keyed on.
        const withPort = brandForHost(url.host);
        return withPort === DEFAULT_BRAND ? brandForHost(url.hostname) : withPort;
    } catch {
        return DEFAULT_BRAND;
    }
}

/** Longest value auth.auth_audit_log.app_id accepts (VARCHAR(64)). */
const APP_ID_MAX = 64;

/**
 * Which site a request came from, for attribution in the audit stream.
 *
 * Deliberately NOT brandFromRequest: that answers "how do I theme this email?", so falling back
 * to the flagship brand is the right call there. An audit row is a record of what happened, and
 * "baalvion" is a claim — a login attributed to baalvion.com because the caller sent no Origin
 * (server-to-server, OAuth callbacks) would be indistinguishable from a real one. So:
 *   • no Origin/Referer at all  → null   ("unknown", and the UI can say so)
 *   • host in the registry      → the site id
 *   • host NOT in the registry  → the bare hostname, because recording what we actually saw
 *                                 beats recording a brand we guessed
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function siteFromRequest(req) {
    const raw = (req && typeof req.get === 'function' && (req.get('origin') || req.get('referer'))) || '';
    if (!raw) return null;
    let url;
    try {
        url = new URL(raw);
    } catch {
        return null;
    }
    // `host` carries the port, which is the only thing separating two local apps; `hostname`
    // is what the production registries are keyed on. Same precedence as brandForHost.
    const host = url.host.toLowerCase();
    const hostname = url.hostname.toLowerCase();
    if (HOST_OVERRIDES[host]) return HOST_OVERRIDES[host];
    if (HOST_OVERRIDES[hostname]) return HOST_OVERRIDES[hostname];
    if (HOST_BRAND[hostname]) return HOST_BRAND[hostname];
    for (const apex of Object.keys(APEX_BRAND)) {
        if (hostname === apex || hostname.endsWith(`.${apex}`)) return APEX_BRAND[apex];
    }
    return (host || hostname).slice(0, APP_ID_MAX);
}

module.exports = { brandForHost, brandFromRequest, siteFromRequest, DEFAULT_BRAND, HOST_BRAND, APEX_BRAND };
