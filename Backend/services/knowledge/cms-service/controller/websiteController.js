'use strict';
const websiteService = require('../service/websiteService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { PLATFORM_BYPASS_ROLES } = require('../middleware/cmsAccess');

/**
 * Build the caller's website scope. Platform principals (super_admin/owner/admin)
 * operate across ALL organizations — their token's org_id must NOT scope away
 * websites that belong to other orgs (the platform owner hosts many sites under the
 * platform org). Everyone else is strictly org-scoped. This mirrors the platform
 * bypass already applied by cmsAccess.loadCmsRole, which grants these roles cms_admin
 * on any website — the prior org filter on the list/lookup was inconsistent with that.
 */
const callerScope = (req) => {
    const roles = Array.isArray(req.auth?.roles)
        ? req.auth.roles
        : (req.auth?.role != null ? [req.auth.role] : []);
    return {
        orgId: req.user.orgId,
        isPlatformAdmin: roles.some((r) => PLATFORM_BYPASS_ROLES.includes(r)),
    };
};

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

module.exports = { list, create, getStats, getOne, update, remove, listMembers, addMember, updateMemberRole, removeMember, searchUsers };
