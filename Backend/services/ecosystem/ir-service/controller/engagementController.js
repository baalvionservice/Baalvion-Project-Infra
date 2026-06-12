'use strict';
// Compact CRUD for the IR "engagement" resources (notifications, subscriptions, votes) and a
// singleton settings record. IR is single-tenant, so org scoping defaults to IR_DEFAULT_ORG_ID
// when no authenticated org is present — the frontend never has to pass org_id.
// orgId is derived exclusively from the verified token; never from the request (IDOR prevention).
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';
const orgOf = (req) => req.user?.orgId || DEFAULT_ORG_ID;

function makeCrud(Model) {
    return {
        list: async (req, res, next) => {
            try {
                const rows = await Model.findAll({ where: { org_id: orgOf(req) }, order: [['created_at', 'DESC']] });
                return sendPaginated(req, res, { items: rows, total: rows.length });
            } catch (err) { return next(err); }
        },
        get: async (req, res, next) => {
            try {
                const row = await Model.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
                if (!row) return next(new AppError('NOT_FOUND', 'Resource not found', 404));
                return sendSuccess(req, res, row);
            } catch (err) { return next(err); }
        },
        create: async (req, res, next) => {
            try {
                const row = await Model.create({ ...req.body, org_id: orgOf(req), created_by: req.user?.id });
                return sendSuccess(req, res, row, 201);
            } catch (err) { return next(err); }
        },
        update: async (req, res, next) => {
            try {
                const row = await Model.findOne({ where: { id: req.params.id, org_id: orgOf(req) } });
                if (!row) return next(new AppError('NOT_FOUND', 'Resource not found', 404));
                const { id, org_id, ...patch } = req.body || {};
                await row.update(patch);
                return sendSuccess(req, res, row);
            } catch (err) { return next(err); }
        },
        remove: async (req, res, next) => {
            try {
                const n = await Model.destroy({ where: { id: req.params.id, org_id: orgOf(req) } });
                return sendSuccess(req, res, { deleted: n > 0 });
            } catch (err) { return next(err); }
        },
    };
}

// Singleton (settings): one row per org; GET returns (creating defaults if absent), PUT upserts.
function makeSingleton(Model) {
    return {
        get: async (req, res, next) => {
            try {
                const [row] = await Model.findOrCreate({ where: { org_id: orgOf(req) }, defaults: { org_id: orgOf(req) } });
                return sendSuccess(req, res, row);
            } catch (err) { return next(err); }
        },
        put: async (req, res, next) => {
            try {
                const [row] = await Model.findOrCreate({ where: { org_id: orgOf(req) }, defaults: { org_id: orgOf(req) } });
                const { id, org_id, ...patch } = req.body || {};
                await row.update(patch);
                return sendSuccess(req, res, row);
            } catch (err) { return next(err); }
        },
    };
}

module.exports = { makeCrud, makeSingleton, DEFAULT_ORG_ID, orgOf };
