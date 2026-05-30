'use strict';
// Comprehensive admin surface for the Law Elite Network console.
// A small resource registry drives generic CRUD ("admin to everything") while
// dedicated handlers cover dashboards, analytics, moderation and broadcasts.
// Every mutation is recorded in legal.audit_logs.
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

// ── Resource registry ────────────────────────────────────────────────────────
// model     : key in db
// search    : text columns matched (iLike) by ?search=
// filters   : query params allowed as exact-match WHERE clauses (bool/num coerced)
// include   : associations eager-loaded on list/get
// order     : default ordering
// readonly  : disallow create/update/delete (audit trails, derived rows)
const C = (as) => ({ model: 'Client', as, attributes: ['id', 'name', 'email'] });
const L = (as) => ({ model: 'Lawyer', as, attributes: ['id', 'name', 'email'] });
const CAT = (as) => ({ model: 'Category', as, attributes: ['id', 'name', 'slug'] });

const RESOURCES = {
    lawyers:       { model: 'Lawyer',       search: ['name', 'email', 'bar_number', 'bio'], filters: ['status', 'verified'], order: [['created_at', 'DESC']] },
    clients:       { model: 'Client',       search: ['name', 'email', 'phone', 'location'], filters: ['subscription_tier'], order: [['created_at', 'DESC']] },
    users:         { model: 'User',         search: ['email', 'full_name'], filters: ['role', 'is_active'], order: [['created_at', 'DESC']] },
    cases:         { model: 'Case',         search: ['title', 'description', 'category'], filters: ['status', 'priority', 'lawyer_id', 'client_id'], include: [C('client'), L('lawyer')], order: [['created_at', 'DESC']] },
    bookings:      { model: 'Booking',      search: ['notes'], filters: ['status', 'type', 'lawyer_id', 'client_id'], include: [C('client'), L('lawyer')], order: [['scheduled_at', 'DESC']] },
    payments:      { model: 'Payment',      search: ['provider', 'provider_tx_id'], filters: ['status', 'currency', 'lawyer_id', 'client_id'], include: [C('client'), L('lawyer')], order: [['created_at', 'DESC']] },
    subscriptions: { model: 'Subscription', search: [], filters: ['tier', 'status', 'client_id'], include: [C('client')], order: [['created_at', 'DESC']] },
    reviews:       { model: 'Review',       search: ['comment'], filters: ['rating', 'lawyer_id', 'client_id'], include: [C('client'), L('lawyer')], order: [['created_at', 'DESC']] },
    articles:      { model: 'Article',      search: ['title', 'slug', 'excerpt'], filters: ['status', 'category_id', 'subcategory_id'], order: [['created_at', 'DESC']] },
    categories:    { model: 'Category',     search: ['name', 'slug', 'description'], filters: ['is_active'], order: [['name', 'ASC']] },
    subcategories: { model: 'Subcategory',  search: ['name', 'slug'], filters: ['is_active', 'category_id'], include: [CAT('category')], order: [['name', 'ASC']] },
    notifications: { model: 'Notification', search: ['title', 'message'], filters: ['type', 'read', 'user_id'], order: [['created_at', 'DESC']] },
    referrals:     { model: 'Referral',     search: ['code'], filters: ['status'], order: [['created_at', 'DESC']] },
    messages:      { model: 'Message',      search: ['content'], filters: ['type', 'case_id', 'booking_id'], order: [['created_at', 'DESC']] },
    documents:     { model: 'Document',     search: ['name', 'type'], filters: ['category', 'case_id'], order: [['created_at', 'DESC']] },
    audit:         { model: 'AuditLog',     search: ['actor_email', 'resource', 'action'], filters: ['action', 'resource'], order: [['created_at', 'DESC']], readonly: true },
};

const resolve = (name) => {
    const cfg = RESOURCES[name];
    if (!cfg) return null;
    return { ...cfg, Model: db[cfg.model] };
};

const buildInclude = (cfg) => (cfg.include || []).map((i) => ({ model: db[i.model], as: i.as, attributes: i.attributes }));

const coerce = (v) => (v === 'true' ? true : v === 'false' ? false : v);

// Best-effort audit; never blocks the request path.
const audit = async (req, action, resource, resourceId, changes = {}) => {
    try {
        await db.AuditLog.create({
            actor_id: req.auth ? String(req.auth.userId) : null,
            actor_email: req.auth ? req.auth.email : null,
            action, resource, resource_id: resourceId != null ? String(resourceId) : null, changes,
        });
    } catch (_) { /* audit is non-critical */ }
};

// ── Generic CRUD ─────────────────────────────────────────────────────────────
const listResource = async (req, res, next) => {
    try {
        const cfg = resolve(req.params.resource);
        if (!cfg) return next(new AppError('NOT_FOUND', `Unknown resource '${req.params.resource}'`, 404));
        const { page = 1, limit = 20, search, sort, order } = req.query;
        const where = {};
        if (search && cfg.search.length) where[Op.or] = cfg.search.map((f) => ({ [f]: { [Op.iLike]: `%${search}%` } }));
        (cfg.filters || []).forEach((f) => {
            if (req.query[f] !== undefined && req.query[f] !== '') where[f] = coerce(req.query[f]);
        });
        const limitN = Math.min(Number(limit) || 20, 200);
        const offset = (Number(page) - 1) * limitN;
        const validSort = sort && cfg.Model.rawAttributes[sort];
        const orderClause = validSort ? [[sort, String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC']] : cfg.order;
        const { count, rows } = await cfg.Model.findAndCountAll({
            where, include: buildInclude(cfg), limit: limitN, offset, order: orderClause, distinct: true,
        });
        return sendPaginated(req, res, {
            items: rows,
            pagination: { total: count, page: Number(page), limit: limitN, totalPages: Math.ceil(count / limitN) },
        });
    } catch (err) { return next(err); }
};

const getResource = async (req, res, next) => {
    try {
        const cfg = resolve(req.params.resource);
        if (!cfg) return next(new AppError('NOT_FOUND', `Unknown resource '${req.params.resource}'`, 404));
        const row = await cfg.Model.findByPk(req.params.id, { include: buildInclude(cfg) });
        if (!row) return next(new AppError('NOT_FOUND', `${cfg.model} not found`, 404));
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
};

const createResource = async (req, res, next) => {
    try {
        const cfg = resolve(req.params.resource);
        if (!cfg) return next(new AppError('NOT_FOUND', `Unknown resource '${req.params.resource}'`, 404));
        if (cfg.readonly) return next(new AppError('FORBIDDEN', `${req.params.resource} is read-only`, 403));
        const row = await cfg.Model.create(req.body);
        await audit(req, 'create', req.params.resource, row.id, req.body);
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
};

const updateResource = async (req, res, next) => {
    try {
        const cfg = resolve(req.params.resource);
        if (!cfg) return next(new AppError('NOT_FOUND', `Unknown resource '${req.params.resource}'`, 404));
        if (cfg.readonly) return next(new AppError('FORBIDDEN', `${req.params.resource} is read-only`, 403));
        const row = await cfg.Model.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', `${cfg.model} not found`, 404));
        await row.update(req.body);
        await audit(req, 'update', req.params.resource, row.id, req.body);
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
};

const deleteResource = async (req, res, next) => {
    try {
        const cfg = resolve(req.params.resource);
        if (!cfg) return next(new AppError('NOT_FOUND', `Unknown resource '${req.params.resource}'`, 404));
        if (cfg.readonly) return next(new AppError('FORBIDDEN', `${req.params.resource} is read-only`, 403));
        const row = await cfg.Model.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', `${cfg.model} not found`, 404));
        await row.destroy();
        await audit(req, 'delete', req.params.resource, req.params.id, {});
        return sendSuccess(req, res, { deleted: true, id: req.params.id });
    } catch (err) { return next(err); }
};

// ── Dashboard + analytics ────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
    try {
        const [
            totalLawyers, activeLawyers, pendingLawyers,
            totalClients,
            totalBookings, pendingBookings, completedBookings,
            totalCases, openCases,
            totalPayments, succeededPayments,
            totalArticles, publishedArticles,
            totalReviews, totalSubscriptions, activeSubscriptions,
        ] = await Promise.all([
            db.Lawyer.count(), db.Lawyer.count({ where: { status: 'active' } }), db.Lawyer.count({ where: { status: 'pending' } }),
            db.Client.count(),
            db.Booking.count(), db.Booking.count({ where: { status: 'pending' } }), db.Booking.count({ where: { status: 'completed' } }),
            db.Case.count(), db.Case.count({ where: { status: 'open' } }),
            db.Payment.count(), db.Payment.count({ where: { status: 'succeeded' } }),
            db.Article.count(), db.Article.count({ where: { status: 'published' } }),
            db.Review.count(), db.Subscription.count(), db.Subscription.count({ where: { status: 'active' } }),
        ]);
        const revenueRaw = await db.Payment.sum('amount', { where: { status: 'succeeded' } });
        return sendSuccess(req, res, {
            lawyers: { total: totalLawyers, active: activeLawyers, pending: pendingLawyers },
            clients: { total: totalClients },
            bookings: { total: totalBookings, pending: pendingBookings, completed: completedBookings },
            cases: { total: totalCases, open: openCases },
            payments: { total: totalPayments, succeeded: succeededPayments, totalRevenue: Number(revenueRaw || 0) },
            articles: { total: totalArticles, published: publishedArticles },
            reviews: { total: totalReviews },
            subscriptions: { total: totalSubscriptions, active: activeSubscriptions },
        });
    } catch (err) { return next(err); }
};

const getAnalytics = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const dateFilter = {};
        if (from) dateFilter[Op.gte] = new Date(from);
        if (to) dateFilter[Op.lte] = new Date(to);
        const df = Object.keys(dateFilter).length ? { created_at: dateFilter } : {};

        const bookingsByStatus = await db.Booking.findAll({
            attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            where: df, group: ['status'], raw: true,
        });
        const casesByCategory = await db.Case.findAll({
            attributes: ['category', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            where: df, group: ['category'], order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']], raw: true,
        });
        const revenueByMonth = await db.Payment.findAll({
            attributes: [
                [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'month'],
                [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'revenue'],
            ],
            where: { status: 'succeeded', ...df },
            group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at'))],
            order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'ASC']], raw: true,
        });
        return sendSuccess(req, res, { bookingsByStatus, casesByCategory, revenueByMonth });
    } catch (err) { return next(err); }
};

// ── Users (legal.users) + status toggle ──────────────────────────────────────
const setUserStatus = async (req, res, next) => {
    try {
        const user = await db.User.findByPk(req.params.id);
        if (!user) return next(new AppError('NOT_FOUND', 'User not found', 404));
        const isActive = !['suspended', 'inactive', 'disabled', 'false'].includes(String(req.body.status).toLowerCase());
        await user.update({ is_active: isActive });
        await audit(req, 'status', 'users', user.id, { is_active: isActive });
        return sendSuccess(req, res, user);
    } catch (err) { return next(err); }
};

// ── Lawyer moderation ─────────────────────────────────────────────────────────
const setLawyerState = (patch, action) => async (req, res, next) => {
    try {
        const lawyer = await db.Lawyer.findByPk(req.params.id);
        if (!lawyer) return next(new AppError('NOT_FOUND', 'Lawyer not found', 404));
        await lawyer.update(patch);
        await audit(req, action, 'lawyers', lawyer.id, patch);
        return sendSuccess(req, res, lawyer);
    } catch (err) { return next(err); }
};
const verifyLawyer  = setLawyerState({ verified: true, status: 'active' }, 'verify');
const suspendLawyer = setLawyerState({ status: 'suspended' }, 'suspend');
const activateLawyer = setLawyerState({ status: 'active' }, 'activate');

// ── Payment refund ─────────────────────────────────────────────────────────────
const refundPayment = async (req, res, next) => {
    try {
        const payment = await db.Payment.findByPk(req.params.id);
        if (!payment) return next(new AppError('NOT_FOUND', 'Payment not found', 404));
        if (payment.status !== 'succeeded') return next(new AppError('CONFLICT', 'Only succeeded payments can be refunded', 409));
        await payment.update({ status: 'refunded' });
        await audit(req, 'refund', 'payments', payment.id, { amount: payment.amount });
        return sendSuccess(req, res, payment);
    } catch (err) { return next(err); }
};

// ── Article publish / archive ────────────────────────────────────────────────
const setArticleState = (status, action) => async (req, res, next) => {
    try {
        const article = await db.Article.findByPk(req.params.id);
        if (!article) return next(new AppError('NOT_FOUND', 'Article not found', 404));
        await article.update({ status, published_at: status === 'published' ? new Date() : article.published_at });
        await audit(req, action, 'articles', article.id, { status });
        return sendSuccess(req, res, article);
    } catch (err) { return next(err); }
};
const publishArticle = setArticleState('published', 'publish');
const archiveArticle = setArticleState('archived', 'archive');

// ── Subscription cancel ────────────────────────────────────────────────────────
const cancelSubscription = async (req, res, next) => {
    try {
        const sub = await db.Subscription.findByPk(req.params.id);
        if (!sub) return next(new AppError('NOT_FOUND', 'Subscription not found', 404));
        await sub.update({ status: 'cancelled' });
        await audit(req, 'cancel', 'subscriptions', sub.id, {});
        return sendSuccess(req, res, sub);
    } catch (err) { return next(err); }
};

// ── Broadcast notification ─────────────────────────────────────────────────────
const broadcast = async (req, res, next) => {
    try {
        const { title, message, type = 'announcement', audience = 'all' } = req.body;
        if (!title || !message) return next(new AppError('VALIDATION_ERROR', 'title and message are required', 422));
        let users;
        if (audience === 'lawyers') users = await db.Lawyer.findAll({ attributes: ['user_id'], raw: true });
        else if (audience === 'clients') users = await db.Client.findAll({ attributes: ['user_id'], raw: true });
        else users = await db.User.findAll({ attributes: [['id', 'user_id']], raw: true });
        const rows = users
            .map((u) => u.user_id)
            .filter(Boolean)
            .map((uid) => ({ user_id: String(uid), type, title, message, data: { broadcast: true, audience } }));
        if (rows.length) await db.Notification.bulkCreate(rows);
        await audit(req, 'broadcast', 'notifications', null, { audience, count: rows.length, title });
        return sendSuccess(req, res, { sent: rows.length, audience });
    } catch (err) { return next(err); }
};

// Start "View as" impersonation: validate the target (a non-admin user) and audit it.
// The frontend then sends X-Impersonate-User-Id to scope subsequent requests to this user.
const impersonate = async (req, res, next) => {
    try {
        const target = await db.User.findByPk(req.params.userId);
        if (!target) return next(new AppError('NOT_FOUND', 'User not found', 404));
        if (target.role === 'admin') return next(new AppError('FORBIDDEN', 'Cannot impersonate an admin', 403));
        await audit(req, 'impersonate', 'users', target.id, { email: target.email, role: target.role });
        return sendSuccess(req, res, { id: target.id, role: target.role, email: target.email, name: target.full_name });
    } catch (err) { return next(err); }
};

module.exports = {
    RESOURCES,
    listResource, getResource, createResource, updateResource, deleteResource,
    getDashboardStats, getAnalytics,
    setUserStatus,
    verifyLawyer, suspendLawyer, activateLawyer,
    refundPayment,
    publishArticle, archiveArticle,
    cancelSubscription,
    broadcast,
    impersonate,
};
