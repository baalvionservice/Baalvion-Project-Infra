const teamService = require('../service/teamService');
const schemas = require('../validators/schemas');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

function parse(schema, body) {
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
    return parsed.data;
}

exports.listOrgs = async (req, res, next) => {
    try {
        sendSuccess(req, res, await teamService.listOrgs(req.auth.userId));
    } catch (err) { next(err); }
};

exports.createOrg = async (req, res, next) => {
    try {
        const data = parse(schemas.createOrg, req.body);
        const org = await teamService.createOrg({ userId: req.auth.userId, name: data.name, ipAddress: req.ip });
        sendSuccess(req, res, org, 201);
    } catch (err) { next(err); }
};

exports.getOrg = async (req, res, next) => {
    try {
        sendSuccess(req, res, await teamService.getOrg(req.params.orgId, req.auth.userId));
    } catch (err) { next(err); }
};

exports.updateOrg = async (req, res, next) => {
    try {
        const fields = parse(schemas.updateOrg, req.body);
        const org = await teamService.updateOrgProfile({ orgId: req.params.orgId, fields, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, org);
    } catch (err) { next(err); }
};

exports.getMembers = async (req, res, next) => {
    try {
        const includeInactive = req.query.includeInactive === 'true' || req.query.all === 'true';
        sendSuccess(req, res, await teamService.getMembers(req.params.orgId, req.auth.userId, { includeInactive }));
    } catch (err) { next(err); }
};

exports.inviteMember = async (req, res, next) => {
    try {
        const data = parse(schemas.inviteMember, req.body);
        const result = await teamService.inviteMember({ orgId: req.params.orgId, ...data, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, result, 201);
    } catch (err) { next(err); }
};

exports.bulkInvite = async (req, res, next) => {
    try {
        const data = parse(schemas.bulkInvite, req.body);
        const result = await teamService.bulkInvite({ orgId: req.params.orgId, invites: data.invites, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, result, 201);
    } catch (err) { next(err); }
};

exports.listInvitations = async (req, res, next) => {
    try {
        sendSuccess(req, res, await teamService.listInvitations({ orgId: req.params.orgId, requesterId: req.auth.userId }));
    } catch (err) { next(err); }
};

exports.resendInvitation = async (req, res, next) => {
    try {
        const result = await teamService.resendInvitation({ orgId: req.params.orgId, invitationId: req.params.invitationId, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.revokeInvitation = async (req, res, next) => {
    try {
        await teamService.revokeInvitation({ orgId: req.params.orgId, invitationId: req.params.invitationId, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, { message: 'Invitation revoked' });
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

exports.suspendMember = async (req, res, next) => {
    try {
        await teamService.suspendMember({ orgId: req.params.orgId, targetUserId: req.params.userId, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, { message: 'Member suspended' });
    } catch (err) { next(err); }
};

exports.reactivateMember = async (req, res, next) => {
    try {
        await teamService.reactivateMember({ orgId: req.params.orgId, targetUserId: req.params.userId, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, { message: 'Member reactivated' });
    } catch (err) { next(err); }
};

exports.updateMemberRole = async (req, res, next) => {
    try {
        const data = parse(schemas.updateMemberRole, req.body);
        const result = await teamService.updateMemberRole({ orgId: req.params.orgId, targetUserId: req.params.userId, ...data, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.transferOwnership = async (req, res, next) => {
    try {
        const data = parse(schemas.transferOwnership, req.body);
        const result = await teamService.transferOwnership({ orgId: req.params.orgId, newOwnerUserId: data.newOwnerUserId, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.forcePasswordReset = async (req, res, next) => {
    try {
        const result = await teamService.forcePasswordReset({ orgId: req.params.orgId, targetUserId: req.params.userId, requesterId: req.auth.userId, ipAddress: req.ip });
        sendSuccess(req, res, { message: 'Password reset email sent', email: result.email });
    } catch (err) { next(err); }
};

exports.forceMfa = async (req, res, next) => {
    try {
        const required = req.body?.required !== false;  // default true
        const result = await teamService.forceMfa({ orgId: req.params.orgId, targetUserId: req.params.userId, required, requesterId: req.auth.userId, ipAddress: req.ip });
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
