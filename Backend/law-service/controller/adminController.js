'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const getDashboardStats = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Admin only', 403));

        const [
            totalLawyers, activeLawyers, pendingLawyers,
            totalClients,
            totalBookings, pendingBookings, completedBookings,
            totalCases, openCases,
            totalPayments, succeededPayments,
            totalArticles, publishedArticles,
        ] = await Promise.all([
            db.Lawyer.count(),
            db.Lawyer.count({ where: { status: 'active' } }),
            db.Lawyer.count({ where: { status: 'pending' } }),
            db.Client.count(),
            db.Booking.count(),
            db.Booking.count({ where: { status: 'pending' } }),
            db.Booking.count({ where: { status: 'completed' } }),
            db.Case.count(),
            db.Case.count({ where: { status: 'open' } }),
            db.Payment.count(),
            db.Payment.count({ where: { status: 'succeeded' } }),
            db.Article.count(),
            db.Article.count({ where: { status: 'published' } }),
        ]);

        const revenueRaw = await db.Payment.sum('amount', { where: { status: 'succeeded' } });

        return sendSuccess(req, res, {
            lawyers: { total: totalLawyers, active: activeLawyers, pending: pendingLawyers },
            clients: { total: totalClients },
            bookings: { total: totalBookings, pending: pendingBookings, completed: completedBookings },
            cases: { total: totalCases, open: openCases },
            payments: { total: totalPayments, succeeded: succeededPayments, totalRevenue: revenueRaw || 0 },
            articles: { total: totalArticles, published: publishedArticles },
        });
    } catch (err) { return next(err); }
};

const getPendingLawyers = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const { page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Lawyer.findAndCountAll({
            where: { status: 'pending' },
            order: [['created_at', 'ASC']],
            limit: Number(limit),
            offset,
        });
        return sendSuccess(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) },
        });
    } catch (err) { return next(err); }
};

const suspendLawyer = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        await lawyer.update({ status: 'suspended' });
        return sendSuccess(req, res, lawyer);
    } catch (err) { return next(err); }
};

const getAnalytics = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const { from, to } = req.query;
        const dateFilter = {};
        if (from) dateFilter[Op.gte] = new Date(from);
        if (to) dateFilter[Op.lte] = new Date(to);

        const bookingsByStatus = await db.Booking.findAll({
            attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            where: Object.keys(dateFilter).length ? { created_at: dateFilter } : {},
            group: ['status'],
            raw: true,
        });

        const casesByCategory = await db.Case.findAll({
            attributes: ['category', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            where: Object.keys(dateFilter).length ? { created_at: dateFilter } : {},
            group: ['category'],
            order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']],
            raw: true,
        });

        const revenueByMonth = await db.Payment.findAll({
            attributes: [
                [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'month'],
                [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'revenue'],
            ],
            where: { status: 'succeeded', ...(Object.keys(dateFilter).length ? { created_at: dateFilter } : {}) },
            group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at'))],
            order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'ASC']],
            raw: true,
        });

        return sendSuccess(req, res, { bookingsByStatus, casesByCategory, revenueByMonth });
    } catch (err) { return next(err); }
};

const listAllUsers = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const { page = 1, limit = 20, type } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        if (type === 'lawyer') {
            const { count, rows } = await db.Lawyer.findAndCountAll({ order: [['created_at', 'DESC']], limit: Number(limit), offset });
            return sendSuccess(req, res, { items: rows, pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) } });
        }
        if (type === 'client') {
            const { count, rows } = await db.Client.findAndCountAll({ order: [['created_at', 'DESC']], limit: Number(limit), offset });
            return sendSuccess(req, res, { items: rows, pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) } });
        }

        // Both
        const [lawyers, clients] = await Promise.all([
            db.Lawyer.findAll({ attributes: ['id', 'user_id', 'name', 'email', 'status', 'created_at'], order: [['created_at', 'DESC']], limit: 100 }),
            db.Client.findAll({ attributes: ['id', 'user_id', 'name', 'email', 'subscription_tier', 'created_at'], order: [['created_at', 'DESC']], limit: 100 }),
        ]);
        return sendSuccess(req, res, { lawyers, clients });
    } catch (err) { return next(err); }
};

module.exports = { getDashboardStats, getPendingLawyers, suspendLawyer, getAnalytics, listAllUsers };
