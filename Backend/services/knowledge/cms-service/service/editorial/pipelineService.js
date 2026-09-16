'use strict';

/**
 * The five stages, run in order, for one website.
 *
 * Each stage reports rather than throws. A run that reaches stage 3 and stops
 * because no key is configured is a useful result -- it tells the desk exactly
 * where the pipeline stopped and why -- while an exception would discard the
 * intake and clustering work that did succeed.
 *
 * Nothing here publishes. The run ends at gated drafts waiting for a person;
 * `gateService.approveDraft` is the only path to a live article, and it is
 * called by a human pressing approve.
 */

const charterService = require('./charterService');
const policyService = require('./policyService');
const intakeService = require('./intakeService');
const clusterService = require('./clusterService');
const briefService = require('./briefService');
const draftService = require('./draftService');
const artService = require('./artService');
const gateService = require('./gateService');
const llmClient = require('./llmClient');
const wireClient = require('./wireClient');
const { CmsArticleDraft } = require('../../models');
const { logger } = require('../../platform/logger');

const log = logger('editorial-pipeline');

/**
 * What the pipeline needs before it can run, checked up front so a run reports
 * "no Gemini key" in one line instead of failing on the first brief.
 */
async function preflight(websiteId) {
    const problems = [];
    const charter = await charterService.getCharter(websiteId);
    if (!charter) problems.push({ code: 'CHARTER_MISSING', message: 'No editorial charter. Stages 1–5 all read it; write one first.', blocks: 'all' });
    else if (charter.status !== 'active') problems.push({ code: 'CHARTER_INACTIVE', message: 'The charter is inactive.', blocks: 'all' });

    const policy = await policyService.getPolicy(websiteId);
    if (!policy) problems.push({ code: 'POLICY_MISSING', message: 'No publication policy. Drafting needs its word budget and the gates need its ceilings.', blocks: 'draft' });

    if (!wireClient.isConfigured()) {
        problems.push({
            code: 'WIRE_NOT_CONFIGURED',
            message: 'No internal key for news-service (set INTERNAL_API_KEY or INTERNAL_SERVICE_SECRET). Intake will find nothing.',
            blocks: 'intake',
        });
    }

    if (!(await llmClient.isConfigured(websiteId))) {
        problems.push({
            code: 'LLM_NOT_CONFIGURED',
            message: 'No Gemini key for this website. Add one in the admin console under Integrations → Google Gemini, or set GEMINI_API_KEY. Stages 3 and 4 cannot run without it.',
            blocks: 'brief',
        });
    }

    return { ok: problems.filter((p) => p.blocks === 'all').length === 0, problems };
}

/**
 * One full pass. `stopAfter` lets an operator run the cheap deterministic stages
 * without spending model calls.
 */
async function runPipeline(websiteId, {
    sinceHours = 72, windowHours = 72,
    intakeLimit = 200, briefLimit = 10, draftLimit = 5,
    authorSlug = null, stopAfter = null,
} = {}) {
    const started = Date.now();
    const check = await preflight(websiteId);
    const stages = {};

    if (!check.ok) {
        return { ok: false, preflight: check, stages, ms: Date.now() - started };
    }

    const blocked = new Set(check.problems.map((p) => p.blocks));
    const order = ['intake', 'cluster', 'brief', 'draft', 'gate'];
    const stopIndex = stopAfter ? order.indexOf(stopAfter) : order.length - 1;

    // Stage 1 — intake.
    if (!blocked.has('intake')) {
        try {
            stages.intake = await intakeService.runIntake(websiteId, { limit: intakeLimit, sinceHours });
        } catch (err) {
            stages.intake = { error: err.message };
        }
    } else {
        stages.intake = { skipped: 'WIRE_NOT_CONFIGURED' };
    }
    if (stopIndex < 1) return finish(websiteId, stages, check, started);

    // Stage 2 — clustering.
    try {
        const clusters = await clusterService.clusterSignals(websiteId, { windowHours });
        stages.cluster = {
            clusters: clusters.length,
            multiOutlet: clusters.filter((c) => c.sourceCount >= 2).length,
            withPrimary: clusters.filter((c) => c.hasPrimarySource).length,
        };
    } catch (err) {
        stages.cluster = { error: err.message };
    }
    if (stopIndex < 2) return finish(websiteId, stages, check, started);

    // Stage 3 — briefs.
    if (blocked.has('brief')) {
        stages.brief = { skipped: 'LLM_NOT_CONFIGURED' };
        return finish(websiteId, stages, check, started);
    }
    try {
        stages.brief = await briefService.runBriefing(websiteId, { windowHours, limit: briefLimit });
    } catch (err) {
        stages.brief = { error: err.message };
    }
    if (stopIndex < 3) return finish(websiteId, stages, check, started);

    // Stage 4 — drafts.
    if (blocked.has('draft')) {
        stages.draft = { skipped: 'POLICY_MISSING' };
        return finish(websiteId, stages, check, started);
    }
    try {
        stages.draft = await draftService.runDrafting(websiteId, { limit: draftLimit, authorSlug });
    } catch (err) {
        stages.draft = { error: err.message };
    }
    // Stage 4b — art. Runs before the gates because `requireOriginalArt` is one
    // of them: illustrating after gating would refuse every draft on its first
    // pass and pass it only on a re-run, for no reason a reviewer could see.
    try {
        stages.art = await artService.runArt(websiteId, { limit: 20 });
    } catch (err) {
        stages.art = { error: err.message };
    }
    if (stopIndex < 4) return finish(websiteId, stages, check, started);

    // Stage 5 — gates. Every ungated draft, not just this run's, so a threshold
    // change is reflected across the queue.
    try {
        const pending = await CmsArticleDraft.findAll({
            where: { websiteId, status: 'drafted' },
            order: [['createdAt', 'DESC']],
            limit: 50,
        });
        const gated = [];
        for (const draft of pending) {
            try {
                const verdict = await gateService.evaluateDraft(websiteId, draft.id);
                gated.push({ draftId: draft.id, gateStatus: verdict.gateStatus, failedCount: verdict.failedCount });
            } catch (err) {
                gated.push({ draftId: draft.id, gateStatus: 'error', error: err.message });
            }
        }
        stages.gate = {
            evaluated: gated.length,
            passed: gated.filter((g) => g.gateStatus === 'passed').length,
            failed: gated.filter((g) => g.gateStatus === 'failed').length,
            results: gated,
        };
    } catch (err) {
        stages.gate = { error: err.message };
    }

    return finish(websiteId, stages, check, started);
}

function finish(websiteId, stages, check, started) {
    const ms = Date.now() - started;
    log.info({ websiteId, ms, stages: Object.keys(stages) }, 'pipeline run complete');
    return { ok: true, preflight: check, stages, ms };
}

module.exports = { runPipeline, preflight };
