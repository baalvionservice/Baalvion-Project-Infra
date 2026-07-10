'use strict';
/**
 * Warehouse Management System, Phase A — putaway tasks. Thin controller over
 * service/warehouse/putaway/engine (mirrors controller/logisticsController.js's
 * relationship to service/logistics/logisticsEngine.js).
 */
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { suggestPutawaySchema, assignBinSchema } = require('../validators/putawayTask.schema');
const { auditLogistics } = require('../utils/logisticsAudit');
const { engine } = require('../service/warehouse/putaway');
const { PutawayError } = require('../service/warehouse/putaway/schema');

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function actorOf(req) {
    return (req.auth && (req.auth.userId || req.auth.email)) || 'system';
}

const suggest = async (req, res, next) => {
    try {
        const parsed = suggestPutawaySchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const { result, task } = await engine.suggestPutaway({
            ...parsed.data,
            tenantId,
            actor: actorOf(req),
        });
        await auditLogistics(req, 'putaway_task.suggested', 'putaway_task', task.id, {
            suggestedBinId: task.suggestedBinId, status: task.status,
        });
        return sendSuccess(req, res, { task, suggestions: result.suggestions, warnings: result.warnings }, 201);
    } catch (err) {
        if (err instanceof PutawayError) return next(new AppError('VALIDATION_ERROR', err.message, 400, err.detail));
        return next(err);
    }
};

const list = async (req, res, next) => {
    try {
        const tenantId = callerTenantId(req);
        const { items, total, page, limit } = await engine.listTasks({
            tenantId, warehouseId: req.query.warehouseId, status: req.query.status,
            page: req.query.page, limit: req.query.limit,
        });
        return sendPaginated(req, res, { items, total, page, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const tenantId = callerTenantId(req);
        const row = await engine.fetchTaskOwned(req.params.id, { tenantId });
        return sendSuccess(req, res, engine.toView(row));
    } catch (err) { return next(err); }
};

const assign = async (req, res, next) => {
    try {
        const parsed = assignBinSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const task = await engine.assignBin(req.params.id, {
            binId: parsed.data.binId, overrideReason: parsed.data.overrideReason,
            tenantId, actor: actorOf(req),
        });
        await auditLogistics(req, 'putaway_task.assigned', 'putaway_task', task.id, {
            assignedBinId: task.assignedBinId, strategy: task.strategy,
        });
        return sendSuccess(req, res, task);
    } catch (err) { return next(err); }
};

const complete = async (req, res, next) => {
    try {
        const tenantId = callerTenantId(req);
        const { task, movementId } = await engine.completeTask(req.params.id, { tenantId, actor: actorOf(req) });
        await auditLogistics(req, 'putaway_task.completed', 'putaway_task', task.id, { movementId });
        return sendSuccess(req, res, task);
    } catch (err) { return next(err); }
};

module.exports = { suggest, list, get, assign, complete };
