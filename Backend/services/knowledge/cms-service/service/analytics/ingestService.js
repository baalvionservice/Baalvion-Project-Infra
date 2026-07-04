'use strict';
/**
 * Ingest service — the collector hot path.
 *
 * Does NO database writes: it resolves the tenant, enforces the per-site/per-module
 * enable flags, normalizes each raw beacon event into the unified envelope, and
 * enqueues it. Everything expensive (persist, session/visitor upsert, rollup)
 * happens off-request in the ingest worker. This is what lets the collector scale
 * flat and absorb spikes into BullMQ.
 */
const { v4: uuidv4 } = require('uuid');
const registry = require('./websiteRegistry');
const enrich = require('./enrich');
const consentService = require('./consentService');
const dedupeService = require('./dedupeService');
const { enqueueIngestBatch } = require('../../queues/analyticsQueue');
const { AppError } = require('../../utils/errors');

const SCHEMA_VERSION = 2;

const MAX_BATCH = Number(process.env.ANALYTICS_MAX_BATCH || 50);

// Coarse event → module routing when the client doesn't send an explicit module.
const EVENT_MODULE = {
    page_view: 'traffic',
    session_start: 'traffic',
    session_end: 'traffic',
    scroll: 'content',
    reading: 'content',
    content_view: 'content',
    engagement: 'content',
    web_vitals: 'seo',
    purchase: 'ecommerce',
    add_to_cart: 'ecommerce',
    begin_checkout: 'ecommerce',
};

function inferModule(event) {
    return EVENT_MODULE[event] || 'traffic';
}

function clampStr(v, max) {
    if (v == null) return null;
    const s = String(v);
    return s.length > max ? s.slice(0, max) : s;
}

/**
 * Normalize one raw beacon event against a resolved site + request context.
 * Returns the unified envelope ready to enqueue.
 */
function normalize(raw, site, ctx) {
    const nowIso = new Date().toISOString();
    const dayIso = nowIso.slice(0, 10);
    const ua = ctx.userAgent;
    const device = { ...enrich.parseUserAgent(ua), ...(raw.device || {}) };
    const geo = { ...enrich.geoFromHeaders(ctx.headers), ...(raw.geo || {}) };
    const url = clampStr(raw.url, 2048);
    const referrer = clampStr(raw.referrer, 2048);
    const campaign = { ...(url ? enrich.campaignFromUrl(url) : {}), ...(raw.campaign || {}) };
    // Stable marketing-channel classification, computed once at ingest so rollups
    // group by one dimension (organic/social/paid/email/referral/direct/...).
    campaign.channel = campaign.channel || enrich.classifyChannel({ campaign, referrer, selfHost: site.domain });
    // Preferred UI language from the client, when supplied (device.lang / geo.lang).
    if (raw.lang && !geo.lang) geo.lang = clampStr(raw.lang, 16);

    const visitorId = clampStr(raw.visitorId, 128)
        || enrich.deriveVisitorId(site.websiteId, ctx.ip, ua, site.salt, dayIso);

    const event = clampStr(raw.event, 64) || 'page_view';
    const occurredAt = raw.occurredAt && !Number.isNaN(Date.parse(raw.occurredAt))
        ? new Date(raw.occurredAt).toISOString()
        : nowIso;

    return {
        eventId: uuidv4(),
        occurredAt,
        receivedAt: nowIso,
        websiteId: site.websiteId,
        organizationId: site.organizationId,
        provider: 'first_party',
        event,
        module: clampStr(raw.module, 32) || inferModule(event),
        userId: raw.userId != null ? String(raw.userId) : null,
        sessionId: clampStr(raw.sessionId, 128),
        visitorId,
        page: clampStr(raw.page, 1024),
        url,
        referrer,
        campaign,
        geo,
        device,
        valueNum: typeof raw.value === 'number' && Number.isFinite(raw.value) ? raw.value : null,
        currency: clampStr(raw.currency, 8),
        metadata: (raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)) ? raw.metadata : {},
        // ── v2 trust layers (fraud_score + attribution_id are set in the worker) ──
        consentState: consentService.normalize(raw.consent),
        eventSchemaVersion: SCHEMA_VERSION,
        dedupeKey: raw.dedupeKey ? clampStr(raw.dedupeKey, 200) : null,
    };
}

/**
 * Accept a validated collect payload ({ site, events[] }) plus request context,
 * normalize, and enqueue. Returns { accepted, rejected, reason? }. Silently drops
 * when the site is unknown/disabled/archived — a public beacon must not leak
 * whether a site exists, and must never error a page's unload handler.
 */
async function collect(payload, ctx) {
    const site = await registry.resolve(payload.site);
    if (!site || !site.enabled) {
        return { accepted: 0, rejected: Array.isArray(payload.events) ? payload.events.length : 0, reason: 'site_disabled' };
    }
    // Origin allowlist: if the site has a configured domain, the request Origin must match it.
    if (site.domain && ctx.origin && !originMatches(ctx.origin, site.domain)) {
        return { accepted: 0, rejected: payload.events.length, reason: 'origin_mismatch' };
    }

    const events = payload.events.slice(0, MAX_BATCH);
    const normalized = [];
    for (const raw of events) {
        // Drop events for modules this site hasn't enabled — keeps stored data to
        // exactly what the tenant opted into.
        const evt = normalize(raw, site, ctx);
        if (!registry.moduleEnabled(site, evt.module)) continue;
        // Consent enforcement (GA-style consent mode; per-site 'implied' | 'strict').
        if (!consentService.isAdmissible(evt.consentState, site.consentMode)) continue;
        // Replay / duplicate suppression (fail-open on Redis error).
        const key = dedupeService.computeDedupeKey(evt);
        evt.dedupeKey = key;
        if (await dedupeService.isDuplicate(key)) continue;
        normalized.push(evt);
    }

    if (normalized.length) await enqueueIngestBatch(normalized);
    return { accepted: normalized.length, rejected: events.length - normalized.length };
}

/** Loose origin match: the request Origin's host must equal or be a subdomain of the site domain. */
function originMatches(origin, domain) {
    try {
        const host = new URL(origin).hostname.toLowerCase();
        const d = String(domain).replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
        return host === d || host.endsWith(`.${d}`);
    } catch {
        return false;
    }
}

/**
 * Server-side ingest for internal producers (CMS hooks, connectors) that already
 * know the tenant — bypasses site resolution but reuses the same envelope + queue.
 */
async function ingestServerEvent(event) {
    if (!event || !event.websiteId || !event.organizationId || !event.event) {
        throw new AppError('BAD_REQUEST', 'websiteId, organizationId and event are required', 400);
    }
    const normalized = {
        eventId: uuidv4(),
        occurredAt: event.occurredAt || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        provider: event.provider || 'internal_cms',
        module: event.module || inferModule(event.event),
        campaign: event.campaign || {},
        geo: event.geo || {},
        device: event.device || {},
        metadata: event.metadata || {},
        ...event,
    };
    await enqueueIngestBatch([normalized]);
    return { accepted: 1 };
}

module.exports = { collect, normalize, ingestServerEvent, inferModule, MAX_BATCH };
