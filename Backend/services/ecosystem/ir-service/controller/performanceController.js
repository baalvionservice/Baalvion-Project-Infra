'use strict';
const { sendSuccess } = require('../utils/response');
const db = require('../models');

// orgId is derived exclusively from the verified token; never from the request (IDOR prevention).
const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';
const orgOf = (req) => req.user?.orgId || DEFAULT_ORG_ID;

// GET /performance/metrics — institutional performance snapshot (UI-shaped).
const metrics = async (req, res, next) => {
    try {
        const [row] = await db.IrPerformance.findOrCreate({ where: { org_id: orgOf(req) }, defaults: { org_id: orgOf(req) } });
        return sendSuccess(req, res, {
            navHistory: row.nav_history || [],
            metrics: row.metrics || {},
            spvPerformance: row.spv_performance || [],
            capitalTimeline: row.capital_timeline || [],
            documents: row.documents || [],
        });
    } catch (err) { return next(err); }
};

// PUT /performance/metrics — admin updates the snapshot (accepts the UI camelCase shape).
const update = async (req, res, next) => {
    try {
        const b = req.body || {};
        const [row] = await db.IrPerformance.findOrCreate({ where: { org_id: req.user.orgId }, defaults: { org_id: req.user.orgId } });
        await row.update({
            nav_history: b.navHistory ?? row.nav_history,
            metrics: b.metrics ?? row.metrics,
            spv_performance: b.spvPerformance ?? row.spv_performance,
            capital_timeline: b.capitalTimeline ?? row.capital_timeline,
            documents: b.documents ?? row.documents,
        });
        return sendSuccess(req, res, {
            navHistory: row.nav_history || [],
            metrics: row.metrics || {},
            spvPerformance: row.spv_performance || [],
            capitalTimeline: row.capital_timeline || [],
            documents: row.documents || [],
        });
    } catch (err) { return next(err); }
};

module.exports = { metrics, update };
