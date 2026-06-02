'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { ensureClient } = require('../utils/provision');
const mailer = require('../service/mailer');
const video = require('../service/video');

const listBookings = async (req, res, next) => {
    try {
        const { page = 1, status, role } = req.query;
        // Cap pagination limit to prevent large data dumps.
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const where = {};
        if (status) where.status = status;

        if (!req.user.isAdmin) {
            // Find client or lawyer profile for current user
            const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
            const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
            const conditions = [];
            if (client) conditions.push({ client_id: client.id });
            if (lawyer) conditions.push({ lawyer_id: lawyer.id });
            if (conditions.length === 0) return sendPaginated(req, res, { items: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } });
            if (conditions.length === 1) Object.assign(where, conditions[0]);
            else where[Op.or] = conditions;
        }

        const offset = (Number(page) - 1) * limit;
        const { count, rows } = await db.Booking.findAndCountAll({
            where,
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email', 'specializations'] },
            ],
            order: [['scheduled_at', 'DESC']],
            limit,
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit, totalPages: Math.ceil(count / limit) },
        });
    } catch (err) { return next(err); }
};

const getBooking = async (req, res, next) => {
    try {
        const booking = await db.Booking.findByPk(req.params.id, {
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email', 'phone', 'user_id'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email', 'specializations', 'hourly_rate', 'user_id'] },
                { model: db.Case, as: 'case', attributes: ['id', 'title', 'status'] },
            ],
        });
        if (!booking) return next(new AppError('NOT_FOUND', 'Booking not found', 404));
        // IDOR: non-admin callers may only view bookings where they are the client or the lawyer.
        if (!req.user.isAdmin) {
            const uid = String(req.user.id);
            const isParticipant =
                (booking.client && String(booking.client.user_id) === uid) ||
                (booking.lawyer && String(booking.lawyer.user_id) === uid);
            if (!isParticipant) return next(new AppError('FORBIDDEN', 'Not authorised to view this booking', 403));
        }
        return sendSuccess(req, res, booking);
    } catch (err) { return next(err); }
};

const createBooking = async (req, res, next) => {
    try {
        const { lawyer_id, type, scheduled_at, duration, notes, case_id } = req.body;
        const client = await ensureClient(req);
        if (!client) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
        const lawyer = await db.Lawyer.findOne({ where: { id: lawyer_id, status: 'active' } });
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found or not active', 404));
        const durationMins = Number(duration) || 60;
        const totalAmount = (Number(lawyer.hourly_rate) * durationMins / 60).toFixed(2);
        const booking = await db.Booking.create({
            client_id: client.id,
            lawyer_id: lawyer.id,
            case_id: case_id || null,
            type,
            scheduled_at,
            duration: durationMins,
            notes,
            total_amount: totalAmount,
            status: 'pending',
        });
        // Confirmation email to the client (non-blocking, best-effort).
        mailer.sendTemplate('bookingConfirmation', client.email, {
            clientName: client.name, lawyerName: lawyer.name,
            scheduledAt: scheduled_at ? new Date(scheduled_at).toLocaleString() : 'To be scheduled',
            type, amount: totalAmount, currency: 'USD',
        }).catch(() => {});
        return sendSuccess(req, res, booking, 201);
    } catch (err) { return next(err); }
};

const updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!allowed.includes(status)) return next(new AppError('BAD_REQUEST', 'Invalid status value', 400));
        const booking = await db.Booking.findByPk(req.params.id, {
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'user_id'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'user_id'] },
            ],
        });
        if (!booking) return next(new AppError('NOT_FOUND', 'Booking not found', 404));
        // IDOR: only the booking's client or lawyer (or an admin) may change the status.
        if (!req.user.isAdmin) {
            const uid = String(req.user.id);
            const isParticipant =
                (booking.client && String(booking.client.user_id) === uid) ||
                (booking.lawyer && String(booking.lawyer.user_id) === uid);
            if (!isParticipant) return next(new AppError('FORBIDDEN', 'Not authorised to update this booking', 403));
        }
        await booking.update({ status });
        return sendSuccess(req, res, booking);
    } catch (err) { return next(err); }
};

const cancelBooking = async (req, res, next) => {
    try {
        const booking = await db.Booking.findByPk(req.params.id, {
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'user_id'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'user_id'] },
            ],
        });
        if (!booking) return next(new AppError('NOT_FOUND', 'Booking not found', 404));
        // IDOR: only the booking's client or lawyer (or an admin) may cancel.
        if (!req.user.isAdmin) {
            const uid = String(req.user.id);
            const isParticipant =
                (booking.client && String(booking.client.user_id) === uid) ||
                (booking.lawyer && String(booking.lawyer.user_id) === uid);
            if (!isParticipant) return next(new AppError('FORBIDDEN', 'Not authorised to cancel this booking', 403));
        }
        if (booking.status === 'completed') return next(new AppError('BAD_REQUEST', 'Cannot cancel a completed booking', 400));
        await booking.update({ status: 'cancelled' });
        return sendSuccess(req, res, booking);
    } catch (err) { return next(err); }
};

// GET /bookings/:id/video — a join link for the consultation room. Only the
// booking's client or lawyer (or an admin) may obtain it.
const getVideoRoom = async (req, res, next) => {
    try {
        const booking = await db.Booking.findByPk(req.params.id, {
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'user_id'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'user_id'] },
            ],
        });
        if (!booking) return next(new AppError('NOT_FOUND', 'Booking not found', 404));

        const uid = String(req.user.id);
        const isClient = booking.client && String(booking.client.user_id) === uid;
        const isLawyer = booking.lawyer && String(booking.lawyer.user_id) === uid;
        if (!isClient && !isLawyer && !req.user.isAdmin) {
            return next(new AppError('FORBIDDEN', 'Not a participant of this consultation', 403));
        }
        const userName = isLawyer ? (booking.lawyer?.name || 'Counsel') : (booking.client?.name || 'Client');
        const room = await video.getRoomForBooking(booking.id, { userName, isOwner: isLawyer });
        return sendSuccess(req, res, { bookingId: booking.id, ...room });
    } catch (err) { return next(err); }
};

module.exports = { listBookings, getBooking, createBooking, updateBookingStatus, cancelBooking, getVideoRoom };
