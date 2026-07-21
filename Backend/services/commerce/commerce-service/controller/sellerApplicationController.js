'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const sellerApplicationService = require('../service/sellerApplicationService');

const authCtxOf = (req) => ({
    userId: req.auth.userId,
    orgId: req.auth.orgId,
    token: (req.get && req.get('authorization')) || undefined,
    jwtRoles: Array.isArray(req.auth.roles) ? req.auth.roles : (req.auth.role != null ? [req.auth.role] : []),
});

const createApplication = async (req, res, next) => {
    try {
        const application = await sellerApplicationService.createApplication(authCtxOf(req), req.validated);
        return sendSuccess(req, res, application, 201);
    } catch (err) { return next(err); }
};

const listMyApplications = async (req, res, next) => {
    try {
        const applications = await sellerApplicationService.listMyApplications(req.auth.userId);
        return sendSuccess(req, res, applications);
    } catch (err) { return next(err); }
};

const listApplications = async (req, res, next) => {
    try {
        const result = await sellerApplicationService.listApplications(req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getApplication = async (req, res, next) => {
    try {
        const application = await sellerApplicationService.getApplication(req.params.id);
        return sendSuccess(req, res, application);
    } catch (err) { return next(err); }
};

const approveApplication = async (req, res, next) => {
    try {
        const result = await sellerApplicationService.approveApplication(authCtxOf(req), req.params.id);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const rejectApplication = async (req, res, next) => {
    try {
        const application = await sellerApplicationService.rejectApplication(authCtxOf(req), req.params.id, req.validated.reason);
        return sendSuccess(req, res, application);
    } catch (err) { return next(err); }
};

const verifyIdentity = async (req, res, next) => {
    try {
        const application = await sellerApplicationService.verifyIdentity(req.params.id);
        return sendSuccess(req, res, application);
    } catch (err) { return next(err); }
};

module.exports = { createApplication, listMyApplications, listApplications, getApplication, approveApplication, rejectApplication, verifyIdentity };
