'use strict';
/**
 * Lightweight, dependency-free event enrichment.
 *
 * Deliberately no geoip DB or UA library on the hot path — country/city come from
 * the CDN (Cloudflare `cf-ipcountry` etc.) which is already in front of every
 * site, and UA classification is a coarse regex sufficient for device/OS/browser
 * breakdowns. A heavier resolver can slot in behind these functions later without
 * touching callers.
 */
const crypto = require('node:crypto');

/** Coarse device/OS/browser classification from a User-Agent string. */
function parseUserAgent(ua) {
    const s = String(ua || '');
    if (!s) return { type: 'unknown', os: 'unknown', browser: 'unknown' };

    const isBot = /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview/i.test(s);
    const isTablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(s);
    const isMobile = /mobi|iphone|ipod|android.*mobile|windows phone/i.test(s);
    const type = isBot ? 'bot' : isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    const os =
        /windows nt/i.test(s) ? 'Windows' :
        /iphone|ipad|ipod|ios/i.test(s) ? 'iOS' :
        /mac os x/i.test(s) ? 'macOS' :
        /android/i.test(s) ? 'Android' :
        /linux/i.test(s) ? 'Linux' : 'unknown';

    const browser =
        /edg\//i.test(s) ? 'Edge' :
        /opr\/|opera/i.test(s) ? 'Opera' :
        /chrome\//i.test(s) && !/edg\//i.test(s) ? 'Chrome' :
        /firefox\//i.test(s) ? 'Firefox' :
        /safari\//i.test(s) && !/chrome\//i.test(s) ? 'Safari' : 'unknown';

    return { type, os, browser };
}

/** Extract coarse geo from CDN-populated request headers (never from raw IP here). */
function geoFromHeaders(headers = {}) {
    const h = (k) => headers[k] || headers[k.toLowerCase()] || undefined;
    return {
        country: h('cf-ipcountry') || h('x-vercel-ip-country') || h('x-geo-country') || undefined,
        city: h('cf-ipcity') || h('x-vercel-ip-city') || undefined,
        region: h('x-vercel-ip-country-region') || undefined,
    };
}

/**
 * Cookieless-capable visitor id: a salted daily hash of IP + UA, scoped per
 * website. Stable within a UTC day, unlinkable across days — no PII stored. Used
 * only when the client does not supply its own first-party visitor id.
 */
function deriveVisitorId(websiteId, ip, ua, salt, dayIso) {
    const material = `${websiteId}|${ip || ''}|${ua || ''}|${salt || ''}|${dayIso}`;
    return 'v_' + crypto.createHash('sha256').update(material).digest('hex').slice(0, 24);
}

const SEARCH_ENGINES = /google\.|bing\.|yahoo\.|duckduckgo\.|yandex\.|baidu\.|ecosia\.|brave\.|ask\.com|startpage\./i;
const SOCIAL_NETWORKS = /facebook\.|fb\.com|instagram\.|twitter\.|^t\.co$|linkedin\.|lnkd\.in|pinterest\.|reddit\.|youtube\.|youtu\.be|tiktok\.|x\.com|threads\.|whatsapp\.|telegram\./i;

/**
 * Classify an event into a marketing channel: paid / email / social / organic /
 * referral / direct / internal / campaign. UTM medium wins; otherwise the
 * referrer host is classified (search → organic, known socials → social,
 * self-host → internal). This is computed once at ingest so rollups can group by
 * a single stable `channel` dimension.
 */
function classifyChannel({ campaign = {}, referrer = '', selfHost = '' } = {}) {
    const medium = (campaign.medium || '').toLowerCase();
    if (medium) {
        if (/cpc|ppc|paid|display|banner|retarget/.test(medium)) return 'paid';
        if (/email|newsletter/.test(medium)) return 'email';
        if (/social/.test(medium)) return 'social';
        if (/organic/.test(medium)) return 'organic';
        if (/affiliate/.test(medium)) return 'affiliate';
        return 'referral';
    }
    if (campaign.source) return 'campaign';
    if (!referrer) return 'direct';
    try {
        const host = new URL(referrer).hostname.toLowerCase();
        const self = String(selfHost || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
        if (self && (host === self || host.endsWith(`.${self}`))) return 'internal';
        if (SEARCH_ENGINES.test(host)) return 'organic';
        if (SOCIAL_NETWORKS.test(host)) return 'social';
        return 'referral';
    } catch {
        return 'direct';
    }
}

/** Parse UTM/campaign fields from a URL's query string. */
function campaignFromUrl(url) {
    try {
        const u = new URL(url);
        const p = u.searchParams;
        const out = {};
        for (const [key, field] of [
            ['utm_source', 'source'], ['utm_medium', 'medium'], ['utm_campaign', 'campaign'],
            ['utm_term', 'term'], ['utm_content', 'content'],
        ]) {
            const v = p.get(key);
            if (v) out[field] = v;
        }
        return out;
    } catch {
        return {};
    }
}

module.exports = { parseUserAgent, geoFromHeaders, deriveVisitorId, campaignFromUrl, classifyChannel };
