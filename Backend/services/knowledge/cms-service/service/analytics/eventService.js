'use strict';
/**
 * Event persistence — runs in the ingest worker (off the request path).
 *
 * Writes the raw event, then maintains the derived session + visitor rows with
 * atomic ON CONFLICT upserts so concurrent workers never race. Session/visitor
 * semantics here are intentionally minimal for Phase 0 (pageview counting,
 * first/last-seen, returning flag); the richer bounce/engagement model lands with
 * the Traffic module in Phase 1.
 */
const { QueryTypes } = require('sequelize');
const { logger } = require('../../platform/logger');
const fraudService = require('./fraudService');
const attributionService = require('./attributionService');
const realtimeService = require('./realtimeService');

const ENGAGED_EVENTS = new Set(['engagement', 'scroll', 'reading']);

async function persist(evt) {
    const db = require('../../models');
    const { sequelize } = db;

    // 0) Fraud/bot scoring. A blocking score is dropped entirely (not stored);
    // a flag is stored but excluded from metric rollups (still counted in Security).
    const fraud = fraudService.scoreEvent(evt);
    if (fraud.action === 'block') {
        logger('analytics-fraud').debug({ event: evt.event, score: fraud.score, reasons: fraud.reasons }, 'event blocked');
        return { dropped: true, reason: 'fraud_block', score: fraud.score };
    }
    evt.fraudScore = fraud.score;

    // 0b) Attribution for conversion events → stamps attribution_id + credits channels.
    if (attributionService.CONVERSION_EVENTS.has(evt.event)) {
        try { evt.attributionId = await attributionService.attributeConversion(evt); }
        catch (err) { logger('analytics-attribution').warn({ err: err && err.message }, 'attribution failed'); }
    }

    // 1) Raw, append-only event (schema v2).
    await db.AnalyticsEvent.create({
        eventId: evt.eventId,
        occurredAt: evt.occurredAt,
        receivedAt: evt.receivedAt || new Date().toISOString(),
        websiteId: evt.websiteId,
        organizationId: evt.organizationId,
        provider: evt.provider || 'first_party',
        event: evt.event,
        module: evt.module || 'traffic',
        userId: evt.userId != null ? String(evt.userId) : null,
        sessionId: evt.sessionId || null,
        visitorId: evt.visitorId || null,
        page: evt.page || null,
        url: evt.url || null,
        referrer: evt.referrer || null,
        campaign: evt.campaign || {},
        geo: evt.geo || {},
        device: evt.device || {},
        valueNum: evt.valueNum != null ? evt.valueNum : null,
        currency: evt.currency || null,
        metadata: evt.metadata || {},
        consentState: evt.consentState || {},
        fraudScore: evt.fraudScore,
        attributionId: evt.attributionId || null,
        dedupeKey: evt.dedupeKey || null,
        eventSchemaVersion: evt.eventSchemaVersion || 2,
    });

    // 2) Derived session (first-party events carrying a session id).
    if (evt.sessionId) await upsertSession(sequelize, evt);

    // 3) Derived visitor.
    if (evt.visitorId) await upsertVisitor(sequelize, evt);

    // 4) Realtime fanout (fail-open).
    realtimeService.publish(evt);

    // 5) v3 streaming seam — no-op until a stream sink is configured (dual-write path).
    require('./streamSink').emit(evt);

    return { persisted: true, score: fraud.score };
}

async function upsertSession(sequelize, evt) {
    const pv = evt.event === 'page_view' ? 1 : 0;
    const engaged = ENGAGED_EVENTS.has(evt.event);
    await sequelize.query(
        `INSERT INTO analytics.sessions
            (website_id, session_id, organization_id, visitor_id, started_at, ended_at,
             duration_s, pageviews, landing_page, exit_page, bounced, engaged, geo, device, campaign,
             created_at, updated_at)
         VALUES
            (:websiteId, :sessionId, :organizationId, :visitorId, :occurredAt, :occurredAt,
             0, :pv, :page, :page, true, :engaged, CAST(:geo AS jsonb), CAST(:device AS jsonb), CAST(:campaign AS jsonb),
             now(), now())
         ON CONFLICT (website_id, session_id) DO UPDATE SET
            started_at = LEAST(analytics.sessions.started_at, EXCLUDED.started_at),
            ended_at   = GREATEST(analytics.sessions.ended_at, EXCLUDED.ended_at),
            pageviews  = analytics.sessions.pageviews + EXCLUDED.pageviews,
            exit_page  = COALESCE(EXCLUDED.exit_page, analytics.sessions.exit_page),
            visitor_id = COALESCE(analytics.sessions.visitor_id, EXCLUDED.visitor_id),
            engaged    = analytics.sessions.engaged OR EXCLUDED.engaged,
            bounced    = (analytics.sessions.pageviews + EXCLUDED.pageviews) <= 1,
            duration_s = GREATEST(0, EXTRACT(EPOCH FROM (
                            GREATEST(analytics.sessions.ended_at, EXCLUDED.ended_at)
                            - LEAST(analytics.sessions.started_at, EXCLUDED.started_at)))::int),
            updated_at = now()`,
        {
            type: QueryTypes.INSERT,
            replacements: {
                websiteId: evt.websiteId,
                sessionId: evt.sessionId,
                organizationId: evt.organizationId,
                visitorId: evt.visitorId || null,
                occurredAt: evt.occurredAt,
                page: evt.page || null,
                pv,
                engaged,
                geo: JSON.stringify(evt.geo || {}),
                device: JSON.stringify(evt.device || {}),
                campaign: JSON.stringify(evt.campaign || {}),
            },
        },
    );
}

async function upsertVisitor(sequelize, evt) {
    const sc = evt.event === 'session_start' ? 1 : 0;
    await sequelize.query(
        `INSERT INTO analytics.visitors
            (website_id, visitor_id, organization_id, first_seen, last_seen, sessions_count, is_returning, created_at, updated_at)
         VALUES
            (:websiteId, :visitorId, :organizationId, :occurredAt, :occurredAt, :sc, false, now(), now())
         ON CONFLICT (website_id, visitor_id) DO UPDATE SET
            first_seen     = LEAST(analytics.visitors.first_seen, EXCLUDED.first_seen),
            last_seen      = GREATEST(analytics.visitors.last_seen, EXCLUDED.last_seen),
            sessions_count = analytics.visitors.sessions_count + EXCLUDED.sessions_count,
            is_returning   = (analytics.visitors.sessions_count + EXCLUDED.sessions_count) > 1,
            updated_at     = now()`,
        {
            type: QueryTypes.INSERT,
            replacements: {
                websiteId: evt.websiteId,
                visitorId: evt.visitorId,
                organizationId: evt.organizationId,
                occurredAt: evt.occurredAt,
                sc,
            },
        },
    );
}

module.exports = { persist, upsertSession, upsertVisitor };
