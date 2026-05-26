const teamService = require('../service/teamService');
const schemas = require('../validators/schemas');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

exports.listOrgs = async (req, res, next) => {
    try {
        const orgs = await teamService.listOrgs(req.auth.userId);
        sendSuccess(req, res, orgs);
    } catch (err) { next(err); }
};

exports.createOrg = async (req, res, next) => {
    try {
        const parsed = schemas.createOrg.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const org = await teamService.createOrg({ userId: req.auth.userId, name: parsed.data.name, ipAddress: req.ip });
        sendSuccess(req, res, org, 201);
    } catch (err) { next(err); }
};

exports.getMembers = async (req, res, next) => {
    try {
        const members = await teamService.getMembers(req.params.orgId, req.auth.userId);
        sendSuccess(req, res, members);
    } catch (err) { next(err); }
};

exports.inviteMember = async (req, res, next) => {
    try {
        const parsed = schemas.inviteMember.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await teamService.inviteMember({ orgId: req.params.orgId, ...parsed.data, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, result, 201);
    } catch (err) { next(err); }
};

exports.acceptInvitation = async (req, res, next) => {
    try {
        const result = await teamService.acceptInvitation({ token: req.params.token, userId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.removeMember = async (req, res, next) => {
    try {
        await teamService.removeMember({ orgId: req.params.orgId, targetUserId: req.params.userId, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, { message: 'Member removed' });
    } catch (err) { next(err); }
};

exports.updateMemberRole = async (req, res, next) => {
    try {
        const parsed = schemas.updateMemberRole.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await teamService.updateMemberRole({ orgId: req.params.orgId, targetUserId: req.params.userId, ...parsed.data, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.getAuditLogs = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const result = await teamService.getAuditLogs({ orgId: req.auth.orgId, page, limit });
        sendPaginated(req, res, result);
    } catch (err) { next(err); }
};
