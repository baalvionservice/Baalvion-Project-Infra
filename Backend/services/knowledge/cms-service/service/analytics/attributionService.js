'use strict';
/**
 * Attribution engine.
 *
 * On a conversion event (purchase/signup/subscribe/lead) we look back over the
 * visitor's recent sessions, read each session's acquisition channel, and credit
 * the conversion's revenue across those touchpoints under two models:
 *   - last_click (default): 100% to the final touchpoint
 *   - linear: revenue / N split evenly across distinct touchpoints
 *
 * Results accumulate into rollup_daily(module='attribution', dims={channel,model})
 * with SUM semantics so the dashboard can show revenue-by-channel per model. Each
 * conversion event is stamped with an attribution_id for traceability.
 */
const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');

const CONVERSION_EVENTS = new Set(['purchase', 'signup', 'subscribe', 'lead']);
const LOOKBACK_DAYS = Number(process.env.ANALYTICS_ATTRIBUTION_LOOKBACK_DAYS || 30);

/** Attribute a conversion; returns the generated attribution_id (or null). */
async function attributeConversion(evt) {
    if (!CONVERSION_EVENTS.has(evt.event)) return null;
    const db = require('../../models');
    const { sequelize } = db;
    const revenue = Number(evt.valueNum) || 0;
    const day = String(evt.occurredAt || new Date().toISOString()).slice(0, 10);

    // Touchpoint channels from the visitor's recent sessions (chronological).
    let channels = [];
    if (evt.visitorId) {
        const rows = await sequelize.query(`
            SELECT COALESCE(NULLIF(campaign->>'channel', ''), 'direct') AS channel
            FROM analytics.sessions
            WHERE website_id = :websiteId AND visitor_id = :visitorId
              AND started_at >= now() - make_interval(days => :days)
            ORDER BY started_at ASC`,
            { type: QueryTypes.SELECT, replacements: { websiteId: evt.websiteId, visitorId: evt.visitorId, days: LOOKBACK_DAYS } });
        channels = rows.map((r) => r.channel);
    }
    // Fall back to the conversion event's own channel when no session history exists.
    if (channels.length === 0) {
        channels = [(evt.campaign && evt.campaign.channel) || 'direct'];
    }

    const attributionId = uuidv4();
    const distinct = [...new Set(channels)];

    // last_click → final touchpoint gets full revenue.
    await creditChannel(sequelize, evt, day, channels[channels.length - 1], 'last_click', revenue, 1);
    // linear → split revenue + conversion credit across distinct touchpoints.
    const share = distinct.length ? revenue / distinct.length : revenue;
    const convShare = distinct.length ? 1 / distinct.length : 1;
    for (const ch of distinct) {
        await creditChannel(sequelize, evt, day, ch, 'linear', share, convShare);
    }
    return attributionId;
}

async function creditChannel(sequelize, evt, day, channel, model, revenue, conversions) {
    // Per-model module name ('attribution_last_click' | 'attribution_linear') so the
    // generic breakdown/moduleTotals readers can query one model without double-counting.
    await sequelize.query(`
        INSERT INTO analytics.rollup_daily (website_id, organization_id, module, day, dims, metrics)
        VALUES (:websiteId, :organizationId, :module, :day::date,
                jsonb_build_object('channel', :channel),
                jsonb_build_object('revenue', :revenue::numeric, 'conversions', :conversions::numeric))
        ON CONFLICT (website_id, module, day, dims_hash) DO UPDATE SET
            metrics = jsonb_build_object(
                'revenue', COALESCE((analytics.rollup_daily.metrics->>'revenue')::numeric, 0) + :revenue::numeric,
                'conversions', COALESCE((analytics.rollup_daily.metrics->>'conversions')::numeric, 0) + :conversions::numeric
            ),
            updated_at = now()`,
        {
            type: QueryTypes.INSERT,
            replacements: {
                websiteId: evt.websiteId, organizationId: evt.organizationId,
                module: `attribution_${model}`,
                day, channel: channel || 'direct', revenue, conversions,
            },
        });
}

module.exports = { attributeConversion, CONVERSION_EVENTS, LOOKBACK_DAYS };
