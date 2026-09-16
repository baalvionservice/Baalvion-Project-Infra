'use strict';
const websiteService = require('../service/websiteService');
const invitationService = require('../service/invitationService');
const { sendSuccess, sendPaginated } = require('../utils/response');
// Shared scope helper — platform principals (super_admin/owner/admin) operate across
// ALL orgs, everyone else is org-scoped. Single source of truth in cmsAccess so the
// website, content, taxonomy, and integration paths all scope identically.
const { callerScope } = require('../middleware/cmsAccess');
const { AppError } = require('../utils/errors');

const list = async (req, res, next) => {
    try {
        const result = await websiteService.listWebsites(callerScope(req), req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const website = await websiteService.createWebsite(req.user.orgId, req.user.id, req.validated);
        return sendSuccess(req, res, website, 201);
    } catch (err) { return next(err); }
};

const getOne = async (req, res, next) => {
    try {
        const website = await websiteService.getWebsite(req.params.websiteId, callerScope(req));
        return sendSuccess(req, res, website);
    } catch (err) { return next(err); }
};

const getStats = async (req, res, next) => {
    try {
        const stats = await websiteService.getStats(req.params.websiteId);
        return sendSuccess(req, res, stats);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const website = await websiteService.updateWebsite(req.params.websiteId, callerScope(req), req.validated);
        return sendSuccess(req, res, website);
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        await websiteService.deleteWebsite(req.params.websiteId, callerScope(req));
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

const listMembers = async (req, res, next) => {
    try {
        const members = await websiteService.listMembers(req.params.websiteId, callerScope(req));
        return sendSuccess(req, res, members);
    } catch (err) { return next(err); }
};

/**
 * Grant one person access to several websites at once. Platform administrators only —
 * deciding who works on which publication is an owner-level call, not a per-site one.
 */
/** Read every site grant across all websites — powers the console's People view. */
const listAllGrants = async (req, res, next) => {
    try {
        const scope = callerScope(req);
        if (!scope.isPlatformAdmin) {
            return next(new AppError('FORBIDDEN', 'Only platform administrators can list site access', 403));
        }
        const userId = req.query.userId != null ? Number(req.query.userId) : undefined;
        if (userId !== undefined && !Number.isFinite(userId)) {
            return next(new AppError('VALIDATION', 'userId must be a number', 422));
        }

        // ?userIds=1,2,3 — annotate one page of people without pulling every grant.
        // Bounded so a crafted query cannot turn into an unbounded IN (...) scan.
        let userIds;
        if (typeof req.query.userIds === 'string' && req.query.userIds.trim() !== '') {
            userIds = req.query.userIds.split(',').map((v) => Number(v.trim()));
            if (userIds.some((v) => !Number.isFinite(v))) {
                return next(new AppError('VALIDATION', 'userIds must be a comma-separated list of numbers', 422));
            }
            if (userIds.length > 500) {
                return next(new AppError('VALIDATION', 'userIds accepts at most 500 ids', 422));
            }
        }

        const grants = await websiteService.listAllGrants(scope, { userId, userIds, websiteId: req.query.websiteId });
        return sendSuccess(req, res, grants);
    } catch (err) { return next(err); }
};

/** Remove one person from every website at once — the offboarding action. */
const revokeAllAccess = async (req, res, next) => {
    try {
        const scope = callerScope(req);
        if (!scope.isPlatformAdmin) {
            return next(new AppError('FORBIDDEN', 'Only platform administrators can revoke site access', 403));
        }
        const userId = Number(req.query.userId);
        if (!Number.isFinite(userId)) {
            return next(new AppError('VALIDATION', 'A numeric userId is required', 422));
        }
        const result = await websiteService.revokeAllAccess(scope, userId, req.user.id);
        // 200 even when nothing was found: "this person now has no access" is the same
        // outcome whether or not they had any, and the caller gets the list either way.
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const grantAccess = async (req, res, next) => {
    try {
        const scope = callerScope(req);
        if (!scope.isPlatformAdmin) {
            return next(new AppError('FORBIDDEN', 'Only platform administrators can grant site access', 403));
        }
        const result = await websiteService.grantAccess(scope, req.validated, req.user.id);
        // 207-style payload: some sites may have been skipped (already a member, not found)
        // while others succeeded, and the console shows both.
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

const addMember = async (req, res, next) => {
    try {
        const member = await websiteService.addMember(req.params.websiteId, callerScope(req), req.validated, req.user.id);
        return sendSuccess(req, res, member, 201);
    } catch (err) { return next(err); }
};

const searchUsers = async (req, res, next) => {
    try {
        const users = await websiteService.searchUsers(req.params.websiteId, callerScope(req), req.query.q);
        return sendSuccess(req, res, users);
    } catch (err) { return next(err); }
};

const updateMemberRole = async (req, res, next) => {
    try {
        const member = await websiteService.updateMemberRole(req.params.websiteId, callerScope(req), parseInt(req.params.userId), req.validated.role);
        return sendSuccess(req, res, member);
    } catch (err) { return next(err); }
};

const removeMember = async (req, res, next) => {
    try {
        await websiteService.removeMember(req.params.websiteId, callerScope(req), parseInt(req.params.userId));
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

// Admin-facing pending-invitation management — surfaces status (sent/not sent/expired)
// so a mail delivery failure is visible on the Members page instead of only a one-time
// toast at creation time.
const listInvitations = async (req, res, next) => {
    try {
        const invitations = await invitationService.listInvitations(req.params.websiteId);
        return sendSuccess(req, res, invitations);
    } catch (err) { return next(err); }
};

const resendInvitation = async (req, res, next) => {
    try {
        const website = await websiteService.getWebsite(req.params.websiteId, callerScope(req));
        const result = await invitationService.resendInvitation(website, req.params.invitationId, req.user.id);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const revokeInvitation = async (req, res, next) => {
    try {
        await invitationService.revokeInvitation(req.params.websiteId, req.params.invitationId);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

module.exports = {
    grantAccess, listAllGrants, revokeAllAccess,
    list, create, getStats, getOne, update, remove,
    listMembers, addMember, updateMemberRole, removeMember, searchUsers,
    listInvitations, resendInvitation, revokeInvitation,
};
