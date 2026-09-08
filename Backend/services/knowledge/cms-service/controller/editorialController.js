'use strict';

/**
 * Admin surface for the editorial pipeline: the two rule records (charter and
 * publication policy), the scored signal queue, and the live quota state the
 * newsroom dashboard reads.
 *
 * Every write goes through the services rather than the models directly, so the
 * clamps and floors in charterService/policyService apply to an API call exactly
 * as they do to a script.
 */

const charterService = require('../service/editorial/charterService');
const policyService = require('../service/editorial/policyService');
const intakeService = require('../service/editorial/intakeService');
const clusterService = require('../service/editorial/clusterService');
const briefService = require('../service/editorial/briefService');
const draftService = require('../service/editorial/draftService');
const gateService = require('../service/editorial/gateService');
const pipelineService = require('../service/editorial/pipelineService');
const coverageService = require('../service/editorial/coverageService');
const artService = require('../service/editorial/artService');
const { CmsStorySignal, CmsCategory } = require('../models');
const { sendSuccess } = require('../utils/response');
const { Op } = require('sequelize');

const siteOf = (req) => req.params.websiteId;
const userOf = (req) => (req.user && req.user.id) || null;

// ── Charter ──────────────────────────────────────────────────────────────────

exports.getCharter = async (req, res, next) => {
    try {
        const charter = await charterService.getCharter(siteOf(req));
        // A missing charter is a normal starting state, not an error -- the panel
        // renders an empty form from it.
        sendSuccess(req, res, charter || null);
    } catch (e) { next(e); }
};

exports.putCharter = async (req, res, next) => {
    try {
        sendSuccess(req, res, await charterService.upsertCharter(siteOf(req), req.body || {}, userOf(req)));
    } catch (e) { next(e); }
};

// ── Publication policy ───────────────────────────────────────────────────────

exports.getPolicy = async (req, res, next) => {
    try {
        const policy = await policyService.getPolicy(siteOf(req));
        // The panel needs the site's real categories to build a beat mix against,
        // and needs to know which of them are publishable.
        const categories = await CmsCategory.findAll({
            where: { websiteId: siteOf(req) },
            attributes: ['id', 'slug', 'name'],
            order: [['name', 'ASC']],
            raw: true,
        });
        const dead = new Set((policy && policy.deadCategorySlugs) || []);
        sendSuccess(req, res, {
            policy: policy || null,
            categories: categories.map((c) => ({ ...c, routeAlive: !dead.has(c.slug) })),
        });
    } catch (e) { next(e); }
};

exports.putPolicy = async (req, res, next) => {
    try {
        sendSuccess(req, res, await policyService.upsertPolicy(siteOf(req), req.body || {}, userOf(req)));
    } catch (e) { next(e); }
};

/**
 * Live quota state: what has gone out today, what each beat still owes, and
 * whether the site is inside a publishing window right now. This is the number
 * the dashboard shows and the same one the publish gate enforces -- read from
 * cms_contents, so hand-published pieces count too.
 */
exports.getQuota = async (req, res, next) => {
    try {
        const plan = await policyService.planTargets(siteOf(req));
        const policy = await policyService.requirePolicy(siteOf(req));
        const window = policyService.insidePublishWindow(policy);
        sendSuccess(req, res, {
            ...plan,
            windowOpen: window.open,
            currentWindow: window.window,
            autoPublishEnabled: policy.autoPublishEnabled,
            autoPublishDelayMinutes: policy.autoPublishDelayMinutes,
            notifyEmails: policy.notifyEmails,
        });
    } catch (e) { next(e); }
};

// ── Signals ──────────────────────────────────────────────────────────────────

exports.listSignals = async (req, res, next) => {
    try {
        const { decision, limit = 100, sinceHours = 72 } = req.query;
        const where = {
            websiteId: siteOf(req),
            publishedAt: { [Op.gte]: new Date(Date.now() - Number(sinceHours) * 3600 * 1000) },
        };
        if (decision) where.decision = decision;
        const rows = await CmsStorySignal.findAll({
            where,
            order: [['relevanceScore', 'DESC'], ['publishedAt', 'DESC']],
            limit: Math.min(Number(limit) || 100, 500),
        });
        sendSuccess(req, res, rows);
    } catch (e) { next(e); }
};

exports.runIntake = async (req, res, next) => {
    try {
        const result = await intakeService.runIntake(siteOf(req), {
            limit: Number(req.body && req.body.limit) || 200,
            sinceHours: Number(req.body && req.body.sinceHours) || 72,
        });
        sendSuccess(req, res, result);
    } catch (e) { next(e); }
};

exports.runClustering = async (req, res, next) => {
    try {
        const clusters = await clusterService.clusterSignals(siteOf(req), {
            windowHours: Number(req.body && req.body.windowHours) || 72,
        });
        // The member rows are heavy and the caller only needs the shape.
        sendSuccess(req, res, clusters.map(({ members, ...rest }) => rest));
    } catch (e) { next(e); }
};

// ── Briefs (stage 3) ─────────────────────────────────────────────────────────

exports.listBriefs = async (req, res, next) => {
    try {
        sendSuccess(req, res, await briefService.listBriefs(siteOf(req), {
            status: req.query.status || null,
            limit: req.query.limit,
        }));
    } catch (e) { next(e); }
};

exports.getBrief = async (req, res, next) => {
    try { sendSuccess(req, res, await briefService.getBrief(siteOf(req), req.params.briefId)); } catch (e) { next(e); }
};

exports.runBriefing = async (req, res, next) => {
    try {
        const body = req.body || {};
        sendSuccess(req, res, await briefService.runBriefing(siteOf(req), {
            windowHours: Number(body.windowHours) || 72,
            limit: Number(body.limit) || 10,
            force: Boolean(body.force),
        }));
    } catch (e) { next(e); }
};

// ── Drafts (stage 4) ─────────────────────────────────────────────────────────

exports.listDrafts = async (req, res, next) => {
    try {
        sendSuccess(req, res, await draftService.listDrafts(siteOf(req), {
            status: req.query.status || null,
            gateStatus: req.query.gateStatus || null,
            limit: req.query.limit,
        }));
    } catch (e) { next(e); }
};

exports.getDraft = async (req, res, next) => {
    try { sendSuccess(req, res, await draftService.getDraft(siteOf(req), req.params.draftId)); } catch (e) { next(e); }
};

exports.runDrafting = async (req, res, next) => {
    try {
        const body = req.body || {};
        // A brief id drafts exactly that story; without one the stage works the queue.
        if (body.briefId) {
            const draft = await draftService.buildDraft(siteOf(req), body.briefId, {
                format: body.format || 'news',
                authorSlug: body.authorSlug || null,
            });
            return sendSuccess(req, res, draft, 201);
        }
        sendSuccess(req, res, await draftService.runDrafting(siteOf(req), {
            limit: Number(body.limit) || 5,
            format: body.format || 'news',
            authorSlug: body.authorSlug || null,
        }));
    } catch (e) { next(e); }
};

// ── Gates and approval (stage 5) ─────────────────────────────────────────────

exports.gateDraft = async (req, res, next) => {
    try {
        sendSuccess(req, res, await gateService.evaluateDraft(siteOf(req), req.params.draftId, {
            reviewerSlug: (req.body && req.body.reviewerSlug) || null,
        }));
    } catch (e) { next(e); }
};

exports.approveDraft = async (req, res, next) => {
    try {
        const body = req.body || {};
        sendSuccess(req, res, await gateService.approveDraft(siteOf(req), req.params.draftId, userOf(req), {
            reviewerSlug: body.reviewerSlug || null,
            overrideNotes: body.notes || null,
        }));
    } catch (e) { next(e); }
};

exports.rejectDraft = async (req, res, next) => {
    try {
        sendSuccess(req, res, await gateService.rejectDraft(siteOf(req), req.params.draftId, userOf(req), {
            notes: (req.body && req.body.notes) || null,
        }));
    } catch (e) { next(e); }
};

// ── Whole pipeline ───────────────────────────────────────────────────────────

exports.preflight = async (req, res, next) => {
    try { sendSuccess(req, res, await pipelineService.preflight(siteOf(req))); } catch (e) { next(e); }
};

exports.runPipeline = async (req, res, next) => {
    try {
        const body = req.body || {};
        sendSuccess(req, res, await pipelineService.runPipeline(siteOf(req), {
            sinceHours: Number(body.sinceHours) || 72,
            windowHours: Number(body.windowHours) || 72,
            intakeLimit: Number(body.intakeLimit) || 200,
            briefLimit: Number(body.briefLimit) || 10,
            draftLimit: Number(body.draftLimit) || 5,
            authorSlug: body.authorSlug || null,
            stopAfter: body.stopAfter || null,
        }));
    } catch (e) { next(e); }
};

// ── Coverage ─────────────────────────────────────────────────────────────────

exports.getCoverage = async (req, res, next) => {
    try {
        sendSuccess(req, res, await coverageService.getCoverage(siteOf(req), {
            days: Math.min(Number(req.query.days) || 7, 90),
        }));
    } catch (e) { next(e); }
};

// ── Art (stage 4b) ───────────────────────────────────────────────────────────

exports.runArt = async (req, res, next) => {
    try {
        const draftId = req.body && req.body.draftId;
        if (draftId) return sendSuccess(req, res, await artService.generateForDraft(siteOf(req), draftId), 201);
        sendSuccess(req, res, await artService.runArt(siteOf(req), { limit: Number(req.body && req.body.limit) || 20 }));
    } catch (e) { next(e); }
};
