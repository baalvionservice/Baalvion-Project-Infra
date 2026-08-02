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

/** @param {string} hostname bare hostname, no protocol/port (e.g. 'about.baalvion.com') */
function brandForHost(hostname) {
    if (!hostname) return DEFAULT_BRAND;
    const h = String(hostname).toLowerCase();
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
        return brandForHost(new URL(raw).hostname);
    } catch {
        return DEFAULT_BRAND;
    }
}

module.exports = { brandForHost, brandFromRequest, DEFAULT_BRAND, HOST_BRAND, APEX_BRAND };
