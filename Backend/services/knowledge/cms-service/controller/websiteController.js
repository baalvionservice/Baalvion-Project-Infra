'use strict';
const websiteService = require('../service/websiteService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const list = async (req, res, next) => {
    try {
        const result = await websiteService.listWebsites(req.user.orgId, req.query);
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
        const website = await websiteService.getWebsite(req.params.websiteId, req.user.orgId);
        return sendSuccess(req, res, website);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const website = await websiteService.updateWebsite(req.params.websiteId, req.user.orgId, req.validated);
        return sendSuccess(req, res, website);
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        await websiteService.deleteWebsite(req.params.websiteId, req.user.orgId);
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

const listMembers = async (req, res, next) => {
    try {
        const members = await websiteService.listMembers(req.params.websiteId, req.user.orgId);
        return sendSuccess(req, res, members);
    } catch (err) { return next(err); }
};

const addMember = async (req, res, next) => {
    try {
        const member = await websiteService.addMember(req.params.websiteId, req.user.orgId, req.validated, req.user.id);
        return sendSuccess(req, res, member, 201);
    } catch (err) { return next(err); }
};

const searchUsers = async (req, res, next) => {
    try {
        const users = await websiteService.searchUsers(req.params.websiteId, req.user.orgId, req.query.q);
        return sendSuccess(req, res, users);
    } catch (err) { return next(err); }
};

const updateMemberRole = async (req, res, next) => {
    try {
        const member = await websiteService.updateMemberRole(req.params.websiteId, req.user.orgId, parseInt(req.params.userId), req.validated.role);
        return sendSuccess(req, res, member);
    } catch (err) { return next(err); }
};

const removeMember = async (req, res, next) => {
    try {
        await websiteService.removeMember(req.params.websiteId, req.user.orgId, parseInt(req.params.userId));
        return sendSuccess(req, res, null);
    } catch (err) { return next(err); }
};

module.exports = { list, create, getOne, update, remove, listMembers, addMember, updateMemberRole, removeMember, searchUsers };
