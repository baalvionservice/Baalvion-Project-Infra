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
