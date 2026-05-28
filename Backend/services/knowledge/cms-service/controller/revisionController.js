'use strict';
const revisionService = require('../service/revisionService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const list = async (req, res, next) => {
    try {
        const result = await revisionService.listRevisions(req.params.websiteId, req.params.contentId, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getOne = async (req, res, next) => {
    try {
        const revision = await revisionService.getRevision(req.params.websiteId, req.params.contentId, req.params.revisionId);
        return sendSuccess(req, res, revision);
    } catch (err) { return next(err); }
};

const restore = async (req, res, next) => {
    try {
        const content = await revisionService.restoreRevision(req.params.websiteId, req.params.contentId, req.params.revisionId, req.user.id);
        return sendSuccess(req, res, content);
    } catch (err) { return next(err); }
};

module.exports = { list, getOne, restore };
