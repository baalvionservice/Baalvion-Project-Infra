'use strict';
const service = require('../service/accessRequestService');
const { sendSuccess } = require('../utils/response');
const { callerScope } = require('../middleware/cmsAccess');
const { AppError } = require('../utils/errors');

const requirePlatformAdmin = (scope) => {
    if (!scope.isPlatformAdmin) throw new AppError('FORBIDDEN', 'Only platform administrators can review access requests', 403);
};

const requestable = async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listRequestableWebsites(req.user.id)); } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try { return sendSuccess(req, res, await service.createRequest(req.user, req.validated), 201); } catch (err) { return next(err); }
};

const mine = async (req, res, next) => {
    try { return sendSuccess(req, res, await service.listMine(req.user.id)); } catch (err) { return next(err); }
};

const list = async (req, res, next) => {
    try {
        requirePlatformAdmin(callerScope(req));
        return sendSuccess(req, res, await service.listForAdmin({ status: req.query.status || 'pending' }));
    } catch (err) { return next(err); }
};

const approve = async (req, res, next) => {
    try {
        const scope = callerScope(req);
        requirePlatformAdmin(scope);
        return sendSuccess(req, res, await service.approve(req.params.id, scope, req.user.id, req.validated));
    } catch (err) { return next(err); }
};

const deny = async (req, res, next) => {
    try {
        requirePlatformAdmin(callerScope(req));
        return sendSuccess(req, res, await service.deny(req.params.id, req.user.id, req.validated));
    } catch (err) { return next(err); }
};

module.exports = { requestable, create, mine, list, approve, deny };
