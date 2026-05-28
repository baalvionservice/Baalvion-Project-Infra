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

const sendMessage = async (req, res, next) => {
    try {
        const { receiver_id, content, type = 'text', file_url, case_id, booking_id } = req.body;
        if (!receiver_id || !content) return next(new AppError('BAD_REQUEST', 'receiver_id and content are required', 400));
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
