'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const realtime = require('../service/realtime');
const storage = require('../service/storage');
const video = require('../service/video');
const { guardUpload } = require('@baalvion/upload/validate.js');

const listMessages = async (req, res, next) => {
    try {
        const { case_id, booking_id, page = 1, limit = 50 } = req.query;
        const where = {
            [Op.or]: [
                { sender_id: String(req.user.id) },
                { receiver_id: String(req.user.id) },
            ],
        };
        if (case_id) where.case_id = Number(case_id);
        if (booking_id) where.booking_id = Number(booking_id);
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Message.findAndCountAll({
            where,
            order: [['created_at', 'ASC']],
            limit: Number(limit),
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

// Resolve the counterparty's legal.users id for a case/booking thread, given the sender.
const deriveReceiver = async (req, caseId, bookingId) => {
    let clientId = null;
    let lawyerId = null;
    if (caseId) {
        const c = await db.Case.findByPk(caseId, { attributes: ['client_id', 'lawyer_id'] });
        if (c) { clientId = c.client_id; lawyerId = c.lawyer_id; }
    } else if (bookingId) {
        const b = await db.Booking.findByPk(bookingId, { attributes: ['client_id', 'lawyer_id'] });
        if (b) { clientId = b.client_id; lawyerId = b.lawyer_id; }
    }
    if (!clientId && !lawyerId) return null;
    const myLawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) }, attributes: ['id'] });
    // If I'm the lawyer on this matter, the receiver is the client; otherwise the lawyer.
    if (myLawyer && lawyerId === myLawyer.id) {
        const cl = clientId ? await db.Client.findByPk(clientId, { attributes: ['user_id'] }) : null;
        return cl ? cl.user_id : null;
    }
    const lw = lawyerId ? await db.Lawyer.findByPk(lawyerId, { attributes: ['user_id'] }) : null;
    return lw ? lw.user_id : null;
};

// Shared create-and-deliver path used by sendMessage/uploadFile/startCall so
// realtime push + payload shape stay identical across every message type.
async function deliverMessage(req, { receiver_id, content, type, file_url, case_id, booking_id }) {
    const message = await db.Message.create({
        sender_id: String(req.user.id),
        receiver_id: String(receiver_id),
        content,
        type,
        file_url: file_url || null,
        case_id: case_id ? Number(case_id) : null,
        booking_id: booking_id ? Number(booking_id) : null,
    });
    const payload = { type: 'message', message: message.toJSON() };
    realtime.pushToUser(String(receiver_id), payload);
    realtime.pushToUser(String(req.user.id), payload);
    return message;
}

const sendMessage = async (req, res, next) => {
    try {
        let { receiver_id, content, type = 'text', file_url, case_id, booking_id } = req.body;
        // Thread messages don't need an explicit receiver — derive the counterparty from the matter.
        if (!receiver_id && (case_id || booking_id)) {
            receiver_id = await deriveReceiver(req, case_id ? Number(case_id) : null, booking_id ? Number(booking_id) : null);
        }
        if (!content) return next(new AppError('BAD_REQUEST', 'content is required', 400));
        if (!receiver_id) return next(new AppError('BAD_REQUEST', 'receiver_id is required (or a case/booking with an assigned counterparty)', 400));
        const message = await deliverMessage(req, { receiver_id, content, type, file_url, case_id, booking_id });
        return sendSuccess(req, res, message, 201);
    } catch (err) { return next(err); }
};

// Real binary chat attachment: multipart file -> MinIO object -> a `type:'file'`
// message holding the key (never a public URL). Mirrors documentController's
// guarded-upload pattern exactly.
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) return next(new AppError('BAD_REQUEST', 'file is required (multipart field "file")', 400));
        let { receiver_id, case_id, booking_id } = req.body;
        if (!receiver_id && (case_id || booking_id)) {
            receiver_id = await deriveReceiver(req, case_id ? Number(case_id) : null, booking_id ? Number(booking_id) : null);
        }
        if (!receiver_id) return next(new AppError('BAD_REQUEST', 'receiver_id is required (or a case/booking with an assigned counterparty)', 400));

        const guard = await guardUpload(req.file.buffer, { declaredMime: req.file.mimetype, filename: req.file.originalname });
        if (!guard.ok) return next(new AppError(guard.code, guard.message, guard.status));

        const safeName = (req.file.originalname || 'file').replace(/[^\w.\-]+/g, '_');
        const key = `chat/${req.user.id}/${Date.now()}-${safeName}`;
        await storage.putObject(key, req.file.buffer, req.file.mimetype);

        const message = await deliverMessage(req, {
            receiver_id, content: req.file.originalname || 'Attachment', type: 'file', file_url: key,
            case_id, booking_id,
        });
        return sendSuccess(req, res, message, 201);
    } catch (err) { return next(err); }
};

// Short-lived presigned download URL for a file message's attachment.
const downloadFile = async (req, res, next) => {
    try {
        const message = await db.Message.findOne({
            where: {
                id: req.params.id,
                [Op.or]: [{ sender_id: String(req.user.id) }, { receiver_id: String(req.user.id) }],
            },
        });
        if (!message || message.type !== 'file' || !message.file_url) {
            return next(new AppError('NOT_FOUND', 'File message not found', 404));
        }
        if (!storage.isStorageKey(message.file_url)) {
            return next(new AppError('NOT_FOUND', 'No stored file for this message', 404));
        }
        const url = await storage.presignedGetUrl(message.file_url, 900);
        return sendSuccess(req, res, { url, name: message.content });
    } catch (err) { return next(err); }
};

// Ad-hoc video/voice call: mints a room for this conversation (no booking
// required — see service/video.js's conversationKey) and drops a `type:'call'`
// invite message so the counterpart sees it appear in the thread in real time.
const startCall = async (req, res, next) => {
    try {
        let { receiver_id, case_id, booking_id, audioOnly } = req.body;
        if (!receiver_id && (case_id || booking_id)) {
            receiver_id = await deriveReceiver(req, case_id ? Number(case_id) : null, booking_id ? Number(booking_id) : null);
        }
        if (!receiver_id) return next(new AppError('BAD_REQUEST', 'receiver_id is required (or a case/booking with an assigned counterparty)', 400));

        const room = await video.getRoomForConversation(req.user.id, receiver_id, {
            userName: req.user.email || 'Participant',
            audioOnly: !!audioOnly,
        });
        const message = await deliverMessage(req, {
            receiver_id,
            content: audioOnly ? 'Voice call started' : 'Video call started',
            type: 'call',
            file_url: room.roomUrl,
            case_id, booking_id,
        });
        return sendSuccess(req, res, { message, room }, 201);
    } catch (err) { return next(err); }
};

const markRead = async (req, res, next) => {
    try {
        const message = await db.Message.findOne({
            where: { id: req.params.id, receiver_id: String(req.user.id) },
        });
        if (!message) return next(new AppError('NOT_FOUND', 'Message not found', 404));
        await message.update({ read_at: new Date() });
        return sendSuccess(req, res, message);
    } catch (err) { return next(err); }
};

// "New Messages" dashboard widget — a real count, not derived from mock data.
const unreadCount = async (req, res, next) => {
    try {
        const count = await db.Message.count({
            where: { receiver_id: String(req.user.id), read_at: null },
        });
        return sendSuccess(req, res, { count });
    } catch (err) { return next(err); }
};

module.exports = { listMessages, sendMessage, uploadFile, downloadFile, startCall, markRead, unreadCount };
