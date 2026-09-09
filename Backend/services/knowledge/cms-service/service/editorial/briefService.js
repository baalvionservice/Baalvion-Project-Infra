'use strict';

/**
 * Stage 3 — the brief. Turns one cluster of wire signals into a corroborated
 * account of the event, with a URL against every fact, before any prose exists.
 *
 * The stage's real job is the sourcing decision. A cluster that cannot be
 * sourced never reaches the drafter, and is recorded as
 * `status = 'insufficient_sources'` rather than dropped -- an editor needs to see
 * the stories the desk declined to write, not just the ones it wrote.
 */

const { Op } = require('sequelize');
const { CmsStorySignal, CmsStoryBrief } = require('../../models');
const charterService = require('./charterService');
const clusterService = require('./clusterService');
const llmClient = require('./llmClient');
const { AppError } = require('../../utils/errors');
const { logger } = require('../../platform/logger');

const log = logger('editorial-brief');

/**
 * Source types that are the document rather than a report of it. A regulator's
 * own announcement is the record; a second outlet repeating it adds no
 * verification. Kept in step with intakeService's source-tier scoring.
 */
const PRIMARY_SOURCE_TYPES = new Set(['government', 'press_release']);

const BRIEF_SCHEMA = {
    type: 'OBJECT',
    properties: {
        workingTitle: { type: 'STRING' },
        angle: { type: 'STRING' },
        whyItMatters: { type: 'STRING' },
        facts: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    statement: { type: 'STRING' },
                    sourceUrl: { type: 'STRING' },
                    figure: { type: 'STRING' },
                },
                required: ['statement', 'sourceUrl'],
            },
        },
        disputed: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    claim: { type: 'STRING' },
                    readings: { type: 'ARRAY', items: { type: 'STRING' } },
                },
                required: ['claim'],
            },
        },
        quotes: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    text: { type: 'STRING' },
                    speaker: { type: 'STRING' },
                    sourceUrl: { type: 'STRING' },
                },
                required: ['text', 'sourceUrl'],
            },
        },
        entities: { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['workingTitle', 'angle', 'facts'],
};

/**
 * Whether a cluster may be written, and on what basis.
 *
 * Two independent outlets is the default rule. The primary-document exception
 * exists because the wire does not carry overlapping coverage: a live pull
 * produced 66 clusters and not one had two distinct outlets, while 30 of the 69
 * accepted signals were regulators publishing their own notices. Under a flat
 * rule the desk writes nothing, permanently.
 *
 * The exception is opt-in per charter (`singlePrimarySourceOk`) and the basis is
 * stored on the brief, so a piece sourced to one document is auditable as such
 * rather than indistinguishable from a corroborated one.
 */
function sourcingVerdict(charter, members) {
    const outlets = new Set(members.map((m) => m.sourceName).filter(Boolean));
    const required = Number(charter.minSources) || 2;

    if (outlets.size >= required) {
        return { ok: true, basis: 'multi_outlet', outletCount: outlets.size, primarySource: null };
    }

    const primary = members.find((m) => PRIMARY_SOURCE_TYPES.has(String(m.sourceType || '')));
    if (primary && charter.singlePrimarySourceOk) {
        return {
            ok: true,
            basis: 'verified_primary',
            outletCount: outlets.size,
            primarySource: { name: primary.sourceName, url: primary.url, type: primary.sourceType },
        };
    }

    return {
        ok: false,
        basis: null,
        outletCount: outlets.size,
        reason: primary
            ? `Only ${outlets.size} outlet(s); the charter requires ${required} and has the primary-document exception switched off.`
            : `Only ${outlets.size} outlet(s) and no primary document; the charter requires ${required}.`,
    };
}

function buildPrompt(charter, members, verdict) {
    const sources = members.map((m, i) => [
        `[${i + 1}] ${m.sourceName || 'unknown outlet'} (${m.sourceType || 'rss'})`,
        `    url: ${m.url}`,
        `    headline: ${m.title}`,
        m.summary ? `    summary: ${m.summary}` : null,
    ].filter(Boolean).join('\n')).join('\n\n');

    return [
        `PUBLICATION: ${charter.niche}`,
        `AUDIENCE: ${charter.audience}`,
        `HOUSE ANGLE: ${charter.houseAngle}`,
        '',
        verdict.basis === 'verified_primary'
            ? 'SOURCING: this story rests on a single primary document (a regulator, court or agency publishing its own announcement). Attribute every fact to it by name. Do not attribute anything to outlets that are not listed.'
            : 'SOURCING: multiple independent outlets. Where they disagree, record the disagreement rather than picking a side.',
        '',
        'SOURCES:',
        sources,
        '',
        'Build a story brief from ONLY the material above.',
        '- Every fact must carry the sourceUrl it came from. Never state a fact no source supports.',
        '- If the sources do not establish something the angle would need, leave it out. Do not infer it.',
        '- Quotes must be verbatim from a source. If none are quoted, return an empty list.',
        '- `angle` is this publication\'s specific reason for covering it, in one sentence.',
        '- `whyItMatters` explains the consequence for the audience named above, or says plainly that there is none yet.',
    ].join('\n');
}

/** Signals in one cluster, oldest first so the story that broke first leads. */
async function clusterMembers(websiteId, clusterKey) {
    return CmsStorySignal.findAll({
        where: { websiteId, clusterKey, decision: { [Op.in]: ['clustered', 'accepted'] } },
        order: [['publishedAt', 'ASC']],
    });
}

/**
 * Builds (or rebuilds) the brief for one cluster.
 *
 * Idempotent on (websiteId, clusterKey), which the table enforces. A cluster
 * that has already produced a draft is left alone unless `force` is set -- a
 * later intake run that widens the cluster must not silently rewrite the brief a
 * draft was built from.
 */
async function buildBrief(websiteId, clusterKey, { force = false } = {}) {
    const charter = await charterService.requireCharter(websiteId);

    const existing = await CmsStoryBrief.findOne({ where: { websiteId, clusterKey } });
    if (existing && existing.status === 'ready' && !force) return { brief: existing, created: false };

    const members = await clusterMembers(websiteId, clusterKey);
    if (!members.length) throw new AppError('NOT_FOUND', `No signals in cluster ${clusterKey}`, 404);

    const verdict = sourcingVerdict(charter, members);
    const sources = members.map((m) => ({
        signalId: m.id,
        name: m.sourceName,
        url: m.url,
        type: m.sourceType,
        publishedAt: m.publishedAt,
        isPrimary: PRIMARY_SOURCE_TYPES.has(String(m.sourceType || '')),
    }));

    const base = {
        websiteId,
        clusterKey,
        workingTitle: members[0].title,
        sources,
        sourcingBasis: verdict.basis,
    };

    if (!verdict.ok) {
        const row = existing
            ? await existing.update({ ...base, status: 'insufficient_sources', failureReason: verdict.reason })
            : await CmsStoryBrief.create({ ...base, status: 'insufficient_sources', failureReason: verdict.reason });
        return { brief: row, created: !existing, skipped: 'insufficient_sources' };
    }

    let data;
    let model;
    try {
        ({ data, model } = await llmClient.generateJson(websiteId, {
            system: 'You are a wire editor building a story brief. You record only what the supplied sources state, each against its URL. You never add background knowledge, never estimate, and never soften an absence of evidence into a claim.',
            prompt: buildPrompt(charter, members, verdict),
            schema: BRIEF_SCHEMA,
            temperature: 0.2,
            maxOutputTokens: 3072,
        }));
    } catch (err) {
        // A model failure holds the story rather than producing a thin brief:
        // the next run retries it, and the reason is visible in the queue.
        const row = existing
            ? await existing.update({ ...base, status: 'failed', failureReason: err.message })
            : await CmsStoryBrief.create({ ...base, status: 'failed', failureReason: err.message });
        log.warn({ clusterKey, err: err.message }, 'brief generation failed');
        return { brief: row, created: !existing, skipped: 'llm_failed' };
    }

    // A fact whose sourceUrl is not one of this cluster's URLs is a fabricated
    // citation. Dropping it here is what stops it reaching the drafter, where it
    // would be indistinguishable from a real one.
    const knownUrls = new Set(members.map((m) => m.url));
    const facts = (data.facts || []).filter((f) => f && f.statement && knownUrls.has(f.sourceUrl));
    const quotes = (data.quotes || []).filter((q) => q && q.text && knownUrls.has(q.sourceUrl));
    const droppedFacts = (data.facts || []).length - facts.length;
    if (droppedFacts > 0) log.warn({ clusterKey, droppedFacts }, 'dropped facts citing unknown URLs');

    if (!facts.length) {
        const row = existing
            ? await existing.update({ ...base, status: 'failed', failureReason: 'No fact survived source verification.' })
            : await CmsStoryBrief.create({ ...base, status: 'failed', failureReason: 'No fact survived source verification.' });
        return { brief: row, created: !existing, skipped: 'no_verified_facts' };
    }

    const payload = {
        ...base,
        workingTitle: data.workingTitle || members[0].title,
        facts,
        quotes,
        disputed: Array.isArray(data.disputed) ? data.disputed : [],
        entities: Array.isArray(data.entities) ? data.entities : [],
        angle: data.angle || null,
        whyItMatters: data.whyItMatters || null,
        status: 'ready',
        failureReason: null,
    };

    const row = existing ? await existing.update(payload) : await CmsStoryBrief.create(payload);
    log.info({ clusterKey, facts: facts.length, basis: verdict.basis, model }, 'brief ready');
    return { brief: row, created: !existing };
}

/**
 * Clusters the window and briefs the strongest ones.
 *
 * `limit` exists because every brief is a model call: an unbounded run over a
 * busy wire is a real bill. Clusters arrive already sorted by source count then
 * score, so the limit takes the best-supported stories rather than an arbitrary
 * slice.
 */
async function runBriefing(websiteId, { windowHours = 72, limit = 10, force = false } = {}) {
    await charterService.requireCharter(websiteId);
    const clusters = await clusterService.clusterSignals(websiteId, { windowHours });

    const results = [];
    for (const cluster of clusters.slice(0, limit)) {
        try {
            const { brief, skipped } = await buildBrief(websiteId, cluster.clusterKey, { force });
            results.push({
                clusterKey: cluster.clusterKey,
                status: brief.status,
                sourcingBasis: brief.sourcingBasis,
                skipped: skipped || null,
                briefId: brief.id,
            });
        } catch (err) {
            results.push({ clusterKey: cluster.clusterKey, status: 'error', error: err.message });
        }
    }

    const ready = results.filter((r) => r.status === 'ready').length;
    return {
        clustersFound: clusters.length,
        considered: Math.min(clusters.length, limit),
        ready,
        insufficientSources: results.filter((r) => r.status === 'insufficient_sources').length,
        failed: results.filter((r) => r.status === 'failed' || r.status === 'error').length,
        results,
    };
}

async function listBriefs(websiteId, { status = null, limit = 50 } = {}) {
    const where = { websiteId };
    if (status) where.status = status;
    return CmsStoryBrief.findAll({ where, order: [['createdAt', 'DESC']], limit: Math.min(Number(limit) || 50, 200) });
}

async function getBrief(websiteId, briefId) {
    const brief = await CmsStoryBrief.findOne({ where: { id: briefId, websiteId } });
    if (!brief) throw new AppError('NOT_FOUND', 'Brief not found', 404);
    return brief;
}

module.exports = {
    buildBrief, runBriefing, listBriefs, getBrief,
    sourcingVerdict, clusterMembers, PRIMARY_SOURCE_TYPES,
};
