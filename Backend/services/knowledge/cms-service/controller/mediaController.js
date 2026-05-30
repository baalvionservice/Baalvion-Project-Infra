'use strict';
const media = require('../service/mediaService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const { readRawBody, parseMultipart } = require('../utils/multipart');

const orgOf = (req) => req.auth && req.auth.orgId;
const userOf = (req) => req.auth && req.auth.userId;

// Files
exports.listFiles = async (req, res, next) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const { rows, count } = await media.listFiles({
            orgId: orgOf(req), page, limit, offset,
            folderId: req.query.folderId, mimeType: req.query.mimeType,
        });
        sendPaginated(req, res, buildPaginated(rows, count, { page, limit }));
    } catch (e) { next(e); }
};

exports.getFile = async (req, res, next) => {
    try { sendSuccess(req, res, await media.getFile(orgOf(req), req.params.id)); } catch (e) { next(e); }
};

exports.upload = async (req, res, next) => {
    try {
        const raw = await readRawBody(req);
        const parts = parseMultipart(raw, req.headers['content-type']);
        const filePart = parts.find((p) => p.name === 'file' && p.filename) || parts.find((p) => p.filename);
        const folderField = parts.find((p) => p.name === 'folderId' && !p.filename);
        const file = await media.saveUpload({
            filePart,
            folderId: folderField ? folderField.data.toString('utf8').trim() || null : null,
            orgId: orgOf(req),
            uploadedBy: userOf(req),
        });
        sendSuccess(req, res, file, 201);
    } catch (e) { next(e); }
};

exports.updateFile = async (req, res, next) => {
    try { sendSuccess(req, res, await media.updateFile(orgOf(req), req.params.id, req.body || {})); } catch (e) { next(e); }
};

exports.deleteFile = async (req, res, next) => {
    try { sendSuccess(req, res, await media.deleteFile(orgOf(req), req.params.id)); } catch (e) { next(e); }
};

exports.bulkDelete = async (req, res, next) => {
    try { sendSuccess(req, res, await media.bulkDelete(orgOf(req), (req.body && req.body.ids) || [])); } catch (e) { next(e); }
};

exports.signedUrl = async (req, res, next) => {
    try { sendSuccess(req, res, await media.signedUrl(orgOf(req), req.params.id)); } catch (e) { next(e); }
};

// Folders
exports.listFolders = async (req, res, next) => {
    try { sendSuccess(req, res, await media.listFolders(orgOf(req))); } catch (e) { next(e); }
};
exports.createFolder = async (req, res, next) => {
    try { sendSuccess(req, res, await media.createFolder(orgOf(req), req.body || {}, userOf(req)), 201); } catch (e) { next(e); }
};
exports.deleteFolder = async (req, res, next) => {
    try { sendSuccess(req, res, await media.deleteFolder(orgOf(req), req.params.id)); } catch (e) { next(e); }
};
