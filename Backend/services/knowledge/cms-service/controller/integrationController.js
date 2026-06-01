'use strict';
const svc = require('../service/integrationService');
const { sendSuccess } = require('../utils/response');

const list = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await svc.list(req.params.websiteId, req.user.orgId));
    } catch (err) { return next(err); }
};

const upsert = async (req, res, next) => {
    try {
        const result = await svc.upsert(req.params.websiteId, req.user.orgId, req.params.provider, req.validated, req.user.id);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        await svc.remove(req.params.websiteId, req.user.orgId, req.params.provider);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

const test = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await svc.test(req.params.websiteId, req.user.orgId, req.params.provider));
    } catch (err) { return next(err); }
};

const summary = async (req, res, next) => {
    try {
        return sendSuccess(req, res, await svc.summary(req.user.orgId));
    } catch (err) { return next(err); }
};

// INTERNAL — service-to-service resolver (decrypted). Guarded by internalAuth.
const resolve = async (req, res, next) => {
    try {
        const result = await svc.resolve(req.params.websiteSlug, { provider: req.query.provider, category: req.query.category });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { list, upsert, remove, test, resolve, summary };
