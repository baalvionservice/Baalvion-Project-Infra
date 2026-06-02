'use strict';
// Investor alerts feed (the dashboard alerts bell). Replaces the frontend's static INITIAL_ALERTS.
// Returns a flat array in `data` (matches alertApi.list expectations). Single-tenant org default.
const { sendSuccess } = require('../utils/response');
const db = require('../models');

// orgId is derived exclusively from the verified token; never from the request (IDOR prevention).
const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';
const orgOf = (req) => req.user?.orgId || DEFAULT_ORG_ID;

const mapAlert = (r) => ({
    id: String(r.id), title: r.title, message: r.message, category: r.category, priority: r.priority,
    timestamp: (r.created_at || r.createdAt || new Date()).toISOString ? (r.created_at || r.createdAt).toISOString() : r.created_at,
    targetRoles: r.target_roles || [], read: !!r.read, actionUrl: r.action_url || undefined,
});

const list = async (req, res, next) => {
    try {
        const where = { org_id: orgOf(req) };
        if (req.query.unreadOnly === 'true') where.read = false;
        const rows = await db.IrAlert.findAll({ where, order: [['created_at', 'DESC']] });
        return sendSuccess(req, res, rows.map(mapAlert));
    } catch (err) { return next(err); }
};

const markRead = async (req, res, next) => {
    try {
        await db.IrAlert.update({ read: true }, { where: { id: req.params.id, org_id: orgOf(req) } });
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

const markAllRead = async (req, res, next) => {
    try {
        await db.IrAlert.update({ read: true }, { where: { org_id: orgOf(req) } });
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

module.exports = { list, markRead, markAllRead };
