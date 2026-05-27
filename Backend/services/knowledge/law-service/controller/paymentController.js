'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listPayments = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const where = {};
        if (status) where.status = status;

        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r))) {
            const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
            const lawyer = await db.Lawyer.findOne({ where: { user_id: String(req.user.id) } });
            const conditions = [];
            if (client) conditions.push({ client_id: client.id });
            if (lawyer) conditions.push({ lawyer_id: lawyer.id });
            if (conditions.length === 0) return sendPaginated(req, res, { items: [], pagination: { total: 0, page: 1, limit: Number(limit), totalPages: 0 } });
            if (conditions.length === 1) Object.assign(where, conditions[0]);
            else where[Op.or] = conditions;
        }

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Payment.findAndCountAll({
            where,
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email'], required: false },
            ],
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

const createPayment = async (req, res, next) => {
    try {
        const { booking_id, lawyer_id, amount, currency = 'USD', provider, provider_tx_id } = req.body;
        const client = await db.Client.findOne({ where: { user_id: String(req.user.id) } });
        if (!client) return next(new AppError('NOT_FOUND', 'Client profile not found', 404));
        const payment = await db.Payment.create({
            booking_id: booking_id ? Number(booking_id) : null,
            client_id: client.id,
            lawyer_id: lawyer_id ? Number(lawyer_id) : null,
            amount: Number(amount),
            currency,
            status: 'pending',
            provider: provider || null,
            provider_tx_id: provider_tx_id || null,
        });
        return sendSuccess(req, res, payment, 201);
    } catch (err) { return next(err); }
};

const webhookHandler = async (req, res, next) => {
    try {
        // Webhook handler for payment provider callbacks
        // In production, verify webhook signature from req.headers before processing
        const { provider_tx_id, status, amount } = req.body;
        if (!provider_tx_id) return next(new AppError('BAD_REQUEST', 'provider_tx_id required', 400));
        const payment = await db.Payment.findOne({ where: { provider_tx_id } });
        if (!payment) return next(new AppError('NOT_FOUND', 'Payment not found for this transaction ID', 404));
        await payment.update({ status: status || 'succeeded' });

        // If succeeded, confirm the related booking
        if (payment.status === 'succeeded' && payment.booking_id) {
            await db.Booking.update({ status: 'confirmed' }, { where: { id: payment.booking_id } });
        }
        return sendSuccess(req, res, { received: true, paymentId: payment.id, status: payment.status });
    } catch (err) { return next(err); }
};

const getPayment = async (req, res, next) => {
    try {
        const payment = await db.Payment.findByPk(req.params.id, {
            include: [
                { model: db.Client, as: 'client', attributes: ['id', 'name', 'email'] },
                { model: db.Lawyer, as: 'lawyer', attributes: ['id', 'name', 'email'], required: false },
            ],
        });
        if (!payment) return next(new AppError('NOT_FOUND', 'Payment not found', 404));
        return sendSuccess(req, res, payment);
    } catch (err) { return next(err); }
};

module.exports = { listPayments, createPayment, webhookHandler, getPayment };
