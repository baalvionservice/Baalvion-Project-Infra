'use strict';
const resourceService = require('../service/resourceService');
const { PERMISSIONS, can } = require('../domain/permissions');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');

// Curators see drafts; everyone else sees only what has been published.
const curates = (req) => can(req.actor || {}, PERMISSIONS.RESOURCE_MANAGE);

const list = asyncHandler(async (req, res) => {
    const { page, pageSize, category, countryCode } = q(req);
    const { items, total } = await resourceService.list({
        page, pageSize, category, countryCode, includeUnpublished: curates(req),
    });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const getBySlug = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await resourceService.getBySlug(req.params.slug, { includeUnpublished: curates(req) })));

const create = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await resourceService.create(req, req.body), 201));

const update = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await resourceService.update(req, req.params.id, req.body)));

module.exports = { list, getBySlug, create, update };
