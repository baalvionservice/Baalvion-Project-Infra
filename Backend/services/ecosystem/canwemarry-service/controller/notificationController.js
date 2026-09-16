'use strict';
const notificationService = require('../service/notificationService');
const participantService = require('../service/participantService');
const { asyncHandler, q } = require('./asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');

const ctx = (req) => ({ actor: req.actor });

const list = asyncHandler(async (req, res) => {
    const { page, pageSize, unreadOnly } = q(req);
    const { items, total } = await notificationService.list(ctx(req), { page, pageSize, unreadOnly });
    return sendPaginated(req, res, { items, total, page, pageSize });
});

const unreadCount = asyncHandler(async (req, res) =>
    sendSuccess(req, res, { unread: await notificationService.unreadCount(ctx(req)) }));

const markRead = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await notificationService.markRead(ctx(req), req.params.id)));

const markAllRead = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await notificationService.markAllRead(ctx(req))));

/** Pending case invitations addressed to the caller — the consent inbox. */
const myInvitations = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await participantService.listMyInvitations(ctx(req))));

module.exports = { list, unreadCount, markRead, markAllRead, myInvitations };
