'use strict';
const { z } = require('zod');
const dmService = require('../service/directMessageService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const startConversationSchema = z.object({
    recipientUserId: z.string().uuid(),
    contextLabel: z.string().max(200).optional(),
});
const sendMessageSchema = z.object({ content: z.string().min(1).max(4000) });

const startConversation = async (req, res, next) => {
    try {
        const parsed = startConversationSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const conversation = await dmService.getOrCreateConversation(req.auth.userId, parsed.data.recipientUserId, parsed.data.contextLabel);
        return sendSuccess(req, res, conversation, 201);
    } catch (err) { return next(err); }
};

const listConversations = async (req, res, next) => {
    try {
        const conversations = await dmService.listConversations(req.auth.userId);
        return sendSuccess(req, res, conversations);
    } catch (err) { return next(err); }
};

const listMessages = async (req, res, next) => {
    try {
        const { before, limit } = req.query;
        const messages = await dmService.listMessages(req.params.conversationId, req.auth.userId, { before, limit });
        return sendSuccess(req, res, messages);
    } catch (err) { return next(err); }
};

const sendMessage = async (req, res, next) => {
    try {
        const parsed = sendMessageSchema.safeParse(req.body || {});
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 422);
        const message = await dmService.sendMessage(req.params.conversationId, req.auth.userId, parsed.data.content);
        return sendSuccess(req, res, message, 201);
    } catch (err) { return next(err); }
};

module.exports = { startConversation, listConversations, listMessages, sendMessage };
