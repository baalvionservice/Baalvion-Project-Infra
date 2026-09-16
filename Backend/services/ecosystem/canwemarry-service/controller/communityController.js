'use strict';
const communityService = require('../service/communityService');
const accessContext = require('../service/accessContext');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');

const list = asyncHandler(async (req, res) => {
    const { page, pageSize, countryCode, visibility, q: term, sort } = q(req);
    const { items, total } = await communityService.list(await accessContext.build(req), {
        page, pageSize, countryCode, visibility, q: term, sort,
    });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const getBySlug = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await communityService.getBySlug(await accessContext.build(req), req.params.slug)));

const getById = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await communityService.getById(await accessContext.build(req), req.params.id)));

const update = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await communityService.update(await accessContext.build(req), req.params.id, req.body)));

const create = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await communityService.create(await accessContext.build(req), req.body), 201));

const join = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await communityService.join(await accessContext.build(req), req.params.id), 201));

const leave = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await communityService.leave(await accessContext.build(req), req.params.id)));

const listMembers = asyncHandler(async (req, res) => {
    const { page, pageSize, status } = q(req);
    const { items, total } = await communityService.listMembers(await accessContext.build(req), req.params.id, { page, pageSize, status });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

/** Admit a pending member. Community moderators only — the service checks. */
const approveMember = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await communityService.approveMember(await accessContext.build(req), req.params.id, req.params.userId)));

/** Turn down a pending request. The row goes, so they may ask again another time. */
const declineMember = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await communityService.declineMember(await accessContext.build(req), req.params.id, req.params.userId)));

/** End somebody's membership. Community administrators only — the service checks. */
const removeMember = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await communityService.removeMember(await accessContext.build(req), req.params.id, req.params.userId)));

module.exports = {
    list, getBySlug, getById, create, update, join, leave,
    approveMember, declineMember, removeMember, listMembers,
};
