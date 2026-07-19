'use strict';
const { z } = require('zod');
const chatService = require('../service/chatService');
const { decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const postMessageSchema = z.object({ content: z.string().min(1).max(2000) });

const listMessages = async (req, res, next) => {
    try {
        const { before, limit } = req.query;
        const result = await chatService.listMessages(req.params.slug, { before, limit });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const postMessage = async (req, res, next) => {
    try {
        const parsed = postMessageSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const email = decodeEmailFromRequest(req);
        const username = email ? email.split('@')[0] : null;
        const result = await chatService.postMessage(req.params.slug, req.auth.userId, username, parsed.data.content);
        return sendSuccess(req, res, result, 201);
    } catch (err) { return next(err); }
};

module.exports = { listMessages, postMessage };
