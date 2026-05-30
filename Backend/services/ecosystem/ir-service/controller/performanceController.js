'use strict';
const { sendSuccess } = require('../utils/response');
const db = require('../models');

const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';
const orgOf = (req) => req.user?.orgId || req.query.org_id || DEFAULT_ORG_ID;

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

module.exports = { metrics };
