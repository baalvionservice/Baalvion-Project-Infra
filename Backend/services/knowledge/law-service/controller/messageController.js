'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

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

const sendMessage = async (req, res, next) => {
    try {
        let { receiver_id, content, type = 'text', file_url, case_id, booking_id } = req.body;
        // Thread messages don't need an explicit receiver — derive the counterparty from the matter.
        if (!receiver_id && (case_id || booking_id)) {
            receiver_id = await deriveReceiver(req, case_id ? Number(case_id) : null, booking_id ? Number(booking_id) : null);
        }
        if (!content) return next(new AppError('BAD_REQUEST', 'content is required', 400));
        if (!receiver_id) return next(new AppError('BAD_REQUEST', 'receiver_id is required (or a case/booking with an assigned counterparty)', 400));
        const message = await db.Message.create({
            sender_id: String(req.user.id),
            receiver_id: String(receiver_id),
            content,
            type,
            file_url: file_url || null,
            case_id: case_id ? Number(case_id) : null,
            booking_id: booking_id ? Number(booking_id) : null,
        });
        return sendSuccess(req, res, message, 201);
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

module.exports = { listMessages, sendMessage, markRead };
