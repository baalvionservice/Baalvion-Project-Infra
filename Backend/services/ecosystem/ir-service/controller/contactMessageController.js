'use strict';
const contactMessageService = require('../service/contactMessageService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const {
    createContactMessageSchema,
    contactMessageQuerySchema,
    updateContactMessageSchema,
} = require('../validators/schemas');

const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';

// Public: anyone can reach the IR team via the contact form. No auth; stamped to the default org.
const createMessage = async (req, res, next) => {
    try {
        const parsed = createContactMessageSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        // Honeypot: a populated `website` field means a bot — ack with 201 but drop the message.
        if (parsed.data.website) return sendSuccess(req, res, { received: true }, 201);
        const { website, ...data } = parsed.data;
        const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim().slice(0, 64);
        const msg = await contactMessageService.createMessage(DEFAULT_ORG_ID, { ...data, ip });
        // Don't echo internal fields back to the public client.
        return sendSuccess(req, res, { received: true, id: msg.id }, 201);
    } catch (err) { return next(err); }
};

// Staff list (auth required) — scoped to the caller's org.
const listMessages = async (req, res, next) => {
    try {
        const parsed = contactMessageQuerySchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendPaginated(req, res, await contactMessageService.listMessages(orgId, parsed.data));
    } catch (err) { return next(err); }
};

// Staff: mark read/archived (auth required).
const updateMessage = async (req, res, next) => {
    try {
        const parsed = updateContactMessageSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        return sendSuccess(req, res, await contactMessageService.updateMessageStatus(req.params.id, orgId, parsed.data.status));
    } catch (err) { return next(err); }
};

module.exports = { createMessage, listMessages, updateMessage };
