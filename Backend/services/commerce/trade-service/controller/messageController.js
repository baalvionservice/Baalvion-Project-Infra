'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { isDealParticipant } = require('../middleware/participantAuth');

// A deal-room message is only accessible to participants of its parent deal.
const assertRoomAccess = async (req, dealId) => {
    if (!dealId) throw new AppError('BAD_REQUEST', 'dealId is required', 400);
    const deal = await db.Deal.findByPk(dealId);
    if (!deal || !isDealParticipant(req, deal)) throw new AppError('NOT_FOUND', 'Deal room not found', 404);
    return deal;
};

const listMessages = async (req, res, next) => {
    try {
        const { dealId, type, page = 1, limit = 200 } = req.query;
        await assertRoomAccess(req, dealId); // participant gate
        const where = { dealId };
        if (type) where.type = type;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Message.findAndCountAll({
            where, limit: Number(limit), offset, order: [['createdAt', 'ASC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

const createMessage = async (req, res, next) => {
    try {
        const deal = await assertRoomAccess(req, req.body && req.body.dealId); // participant gate
        const message = await db.Message.create(req.body);
        // Realtime push to the deal room (best-effort, non-blocking).
        require('../realtime').publish(`deal:${message.dealId}`, 'message', message).catch(() => {});
        // Notify the other participant (spec: new-message notifications). Best-effort —
        // a notification failure must never fail the message send itself.
        const recipient = deal.buyer_org_id === message.sender ? deal.seller_org_id : deal.buyer_org_id;
        if (recipient && recipient !== message.sender) {
            db.Notification.create({
                tenant_id: deal.tenant_id || 'T-DEMO', recipient_org_id: recipient, type: 'new_message',
                title: 'New message', message: message.content ? message.content.slice(0, 200) : 'New deal-room message',
                entity_type: 'deal', entity_id: String(deal.id),
            }).catch(() => {});
        }
        return sendSuccess(req, res, message, 201);
    } catch (err) {
        return next(err);
    }
};

// Read receipt: the recipient marks a message as read (spec: read receipts).
const markMessageRead = async (req, res, next) => {
    try {
        const message = await db.Message.findByPk(req.params.id);
        if (!message) return next(new AppError('NOT_FOUND', 'Message not found', 404));
        await assertRoomAccess(req, message.dealId); // participant gate
        if (!message.isRead) await message.update({ isRead: true, readAt: new Date() });
        return sendSuccess(req, res, message);
    } catch (err) {
        return next(err);
    }
};

module.exports = { listMessages, createMessage, markMessageRead };
