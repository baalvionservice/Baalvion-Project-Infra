'use strict';
/**
 * Connector runner — registers built-in connectors and executes a sync job:
 * resolve tenant → resolve vault credentials → connector.sync() → persist the
 * returned metrics into analytics.provider_metrics (idempotent upsert).
 *
 * Runs in the analytics-sync worker. Fail-open per job: a single provider/site
 * failure is retried by BullMQ and never blocks other syncs.
 */
const { QueryTypes } = require('sequelize');
const registry = require('./registry');
const websiteRegistry = require('../service/analytics/websiteRegistry');
const credentialService = require('../service/analytics/credentialService');
const quotaService = require('../service/analytics/quotaService');
const { AppError } = require('../utils/errors');
const { logger } = require('../platform/logger');

const BACKFILL_DAYS = {
    gsc: 480, 'google-news': 480,                      // GSC/News ~16 months (GSC's own retention cap)
    ga4: 90, adsense: 90, 'google-ads': 90, 'merchant-center': 90, cloudflare: 90,
    'meta-pixel': 90, 'linkedin-insight': 90, 'pinterest-tag': 90, 'tiktok-pixel': 90, 'x-pixel': 90,
    clarity: 3,   // hard Clarity API cap — see connectors/clarity.js
    gtm: 1,       // config snapshot, no history to backfill
};

// ── Register built-in connectors ─────────────────────────────────────────────
registry.register(require('./internalCms'));
registry.register(require('./server'));
registry.register(require('./gsc'));
registry.register(require('./adsense'));
registry.register(require('./ga4'));
registry.register(require('./gtm'));
registry.register(require('./googleAds'));
registry.register(require('./merchantCenter'));
registry.register(require('./googleNews'));
registry.register(require('./clarity'));
registry.register(require('./bingWebmaster'));
registry.register(require('./cloudflare'));
registry.register(require('./metaPixel'));
registry.register(require('./linkedinInsight'));
registry.register(require('./pinterestTag'));
registry.register(require('./tiktokPixel'));
registry.register(require('./xPixel'));
// Remaining provider connectors (ga4, meta-pixel, …) are registered by their own
// files as each is implemented; PROVIDER_CATALOG already advertises them.

const dayStr = (d) => d.toISOString().slice(0, 10);

/** Execute one hardened sync job: { websiteId, provider, window }. */
async function runSync(job = {}) {
    const { websiteId, provider } = job;
    const connector = registry.get(provider);
    if (!connector) throw new AppError('NOT_IMPLEMENTED', `No connector registered for provider "${provider}"`, 501);

    const site = await websiteRegistry.resolve(websiteId);
    if (!site) throw new AppError('NOT_FOUND', 'Website not found for sync', 404);
    const external = (connector.requiredCreds || []).length > 0;

    let creds = null;
    if (external) {
        creds = await credentialService.getProviderCredentials(site.slug, provider);
        if (!creds) {
            logger('analytics-sync').info({ websiteId, provider }, 'sync skipped — provider not configured');
            return { provider, skipped: true, reason: 'not_configured' };
        }
        // Cost/quota governance — skip into degraded mode when the daily budget is spent.
        const q = await quotaService.consume(provider, websiteId);
        if (!q.allowed) {
            await recordState(websiteId, provider, { lastStatus: 'quota_exceeded' });
            logger('analytics-sync').warn({ websiteId, provider, used: q.used, budget: q.budget }, 'sync skipped — quota exceeded');
            return { provider, skipped: true, reason: 'quota', used: q.used, budget: q.budget };
        }
    }

    // Watermarked, backfill-aware window.
    const state = await loadState(websiteId, provider);
    const until = new Date();
    const backfill = BACKFILL_DAYS[provider] || 90;
    let since;
    if (job.window === 'backfill') {
        since = new Date(until.getTime() - backfill * 86_400_000);
    } else if (state && state.watermark) {
        // Resume just before the last synced date to catch late/adjusted data.
        since = new Date(new Date(state.watermark).getTime() - 2 * 86_400_000);
    } else {
        since = new Date(until.getTime() - Number(process.env.ANALYTICS_SYNC_LOOKBACK_DAYS || 2) * 86_400_000);
    }

    try {
        const metrics = await connector.sync({ website: site, creds, since, until, logger: logger('connector') });
        const written = await writeMetrics(site, provider, Array.isArray(metrics) ? metrics : []);
        await recordState(websiteId, provider, {
            watermark: until.toISOString().slice(0, 10),
            lastSyncedAt: new Date(),
            lastStatus: 'ok',
            lastError: null,
            rowsWritten: written,
        });
        logger('analytics-sync').debug({ websiteId, provider, written }, 'provider sync complete');
        return { provider, written };
    } catch (err) {
        // Partial-failure tolerance: record the error, DO NOT advance the watermark,
        // and rethrow so BullMQ retries with backoff (eventually dead-letters).
        await recordState(websiteId, provider, { lastStatus: 'error', lastError: String((err && err.message) || err).slice(0, 500) });
        throw err;
    }
}

/** Load per-(website,provider) sync bookkeeping. */
async function loadState(websiteId, provider) {
    const db = require('../models');
    return db.AnalyticsProviderSyncState.findOne({ where: { websiteId, provider } });
}

/** Upsert sync state + increment the daily API-call counter. */
async function recordState(websiteId, provider, fields) {
    const db = require('../models');
    const today = new Date().toISOString().slice(0, 10);
    const [row] = await db.AnalyticsProviderSyncState.findOrCreate({
        where: { websiteId, provider },
        defaults: { websiteId, provider },
    });
    const patch = { ...fields };
    if (row.callsDate !== today) { patch.callsDate = today; patch.callsToday = 1; }
    else { patch.callsToday = (row.callsToday || 0) + 1; }
    await row.update(patch);
}

/**
 * Upsert provider metrics. Each metric: { metric, value, dims?, granularity?,
 * periodStart, periodEnd }. Idempotent on (website, provider, metric,
 * granularity, period_start, dims_hash).
 */
async function writeMetrics(site, provider, metrics) {
    if (!metrics.length) return 0;
    const db = require('../models');
    let written = 0;
    for (const m of metrics) {
        await db.sequelize.query(`
            INSERT INTO analytics.provider_metrics
                (website_id, organization_id, provider, metric, dims, value, granularity, period_start, period_end, created_at, updated_at)
            VALUES
                (:websiteId, :organizationId, :provider, :metric, CAST(:dims AS jsonb), :value, :granularity, :periodStart, :periodEnd, now(), now())
            ON CONFLICT (website_id, provider, metric, granularity, period_start, dims_hash)
            DO UPDATE SET value = EXCLUDED.value, period_end = EXCLUDED.period_end, updated_at = now()`,
            {
                type: QueryTypes.INSERT,
                replacements: {
                    websiteId: site.websiteId,
                    organizationId: site.organizationId,
                    provider,
                    metric: m.metric,
                    dims: JSON.stringify(m.dims || {}),
                    value: Number(m.value) || 0,
                    granularity: m.granularity || 'day',
                    periodStart: m.periodStart || dayStr(new Date()),
                    periodEnd: m.periodEnd || m.periodStart || dayStr(new Date()),
                },
            });
        written += 1;
    }
    return written;
}

// No-credential connectors snapshotted for every active website (see below).
const INTERNAL_PROVIDERS = ['internal_cms', 'server'];

/**
 * Enqueue a snapshot of every no-credential connector (internal_cms, server) for
 * every active website. Called daily by the maintenance job so CMS operational
 * + infra health metrics stay fresh without per-site config.
 */
async function syncAllInternal() {
    const db = require('../models');
    const { enqueueSync } = require('../queues/analyticsQueue');
    const sites = await db.CmsWebsite.findAll({ where: { status: 'active' }, attributes: ['id'] });
    for (const s of sites) {
        for (const provider of INTERNAL_PROVIDERS) {
            await enqueueSync({ websiteId: s.id, provider, window: 'snapshot' });
        }
    }
    return sites.length;
}

module.exports = { runSync, writeMetrics, syncAllInternal, registry };
