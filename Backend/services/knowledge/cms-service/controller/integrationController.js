'use strict';
const svc = require('../service/integrationService');
const { sendSuccess } = require('../utils/response');
const { callerScope } = require('../middleware/cmsAccess');
const { logger } = require('../platform/logger');

const list = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await svc.list(req.params.websiteId, callerScope(req)));
    } catch (err) { return next(err); }
};

const upsert = async (req, res, next) => {
    try {
        const result = await svc.upsert(req.params.websiteId, callerScope(req), req.params.provider, req.validated, req.user.id);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        await svc.remove(req.params.websiteId, callerScope(req), req.params.provider);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

const test = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await svc.test(req.params.websiteId, callerScope(req), req.params.provider));
    } catch (err) { return next(err); }
};

const summary = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await svc.summary(callerScope(req)));
    } catch (err) { return next(err); }
};

// INTERNAL — service-to-service resolver (decrypted secrets). Guarded by internalAuth.
// Every secret-resolution is audit-logged (caller + slug + count) for traceability;
// this is the platform's most sensitive read path.
const resolve = async (req, res, next) => {
    try {
        const result = await svc.resolve(req.params.websiteSlug, { provider: req.query.provider, category: req.query.category });
        logger('resolver').warn({
            audit: true,
            caller: req.headers['x-internal-service'] || null,
            websiteSlug: req.params.websiteSlug,
            provider: req.query.provider || null,
            category: req.query.category || null,
            count: Array.isArray(result) ? result.length : 0,
        }, 'internal integrations resolved (decrypted secrets returned)');
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { list, upsert, remove, test, resolve, summary };
