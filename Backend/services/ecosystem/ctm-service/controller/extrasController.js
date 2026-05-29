'use strict';
const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const events = require('../service/events');

function page(req) {
    return {
        offset: (Number(req.query.page || 1) - 1) * Number(req.query.limit || 20),
        limit: Number(req.query.limit || 20),
    };
}

// ── Performance computation (from finalized submission scores) ──────────────────

async function computePerformance(userId) {
    const row = await db.submissions.findOne({
        where: { user_id: userId, score: { [Op.ne]: null } },
        attributes: [
            [fn('COUNT', col('id')), 'completed'],
            [fn('AVG', col('score')), 'avg'],
        ],
        raw: true,
    });
    return {
        completed_tasks: Number(row?.completed || 0),
        average_score: row?.avg != null ? Math.round(Number(row.avg) * 10) / 10 : 0,
    };
}

function shapeUser(profile, perf, badges) {
    const p = profile.toJSON ? profile.toJSON() : profile;
    return {
        ...p,
        completed_tasks: perf?.completed_tasks ?? 0,
        average_score: perf?.average_score ?? 0,
        badges: badges || undefined,
    };
}

// ── Lazy profile provisioning (safety net on authenticated routes) ──────────────
// Guarded by an in-process Set so we issue at most one findOrCreate per user per
// process lifetime instead of a write on every request.
const _seen = new Set();

async function ensureProfileFromClaims(auth) {
    if (!auth || !auth.userId || _seen.has(String(auth.userId))) return;
    _seen.add(String(auth.userId));
    const roles = Array.isArray(auth.roles) ? auth.roles : [];
    const role = roles.includes('admin') || roles.includes('super_admin')
        ? 'admin'
        : roles.includes('candidate') ? 'candidate' : 'company';
    try {
        await db.user_profiles.findOrCreate({
            where: { user_id: auth.userId },
            defaults: { user_id: auth.userId, role, company_id: auth.orgId || null },
        });
    } catch { _seen.delete(String(auth.userId)); /* allow retry next request */ }
}

// Middleware: best-effort provisioning, never blocks the request.
const ensureUserProfile = (req, _res, next) => {
    if (req.auth) ensureProfileFromClaims(req.auth).finally(() => next());
    else next();
};

// ── Users / Profiles ────────────────────────────────────────────────────────────

exports.listUsers = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        if (req.query.role) where.role = req.query.role;
        if (req.query.company_id) where.company_id = req.query.company_id;
        if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';
        if (req.query.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${req.query.search}%` } },
                { email: { [Op.iLike]: `%${req.query.search}%` } },
            ];
        }
        const { count, rows } = await db.user_profiles.findAndCountAll({
            where, offset, limit, order: [['created_at', 'DESC']],
        });
        const withPerf = await Promise.all(rows.map(async (u) => shapeUser(u, await computePerformance(u.user_id))));
        sendPaginated(res, withPerf, count, Number(req.query.page || 1), limit);
    } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
    try {
        const profile = await db.user_profiles.findByPk(req.params.id);
        if (!profile) throw new AppError('NOT_FOUND', 'User not found', 404);
        const [perf, badges] = await Promise.all([
            computePerformance(profile.user_id),
            db.user_badges.findAll({ where: { user_id: profile.user_id }, include: [{ association: 'badge' }] }),
        ]);
        sendSuccess(res, shapeUser(profile, perf, badges));
    } catch (err) { next(err); }
};

// Upsert from an authenticated client (called by the frontend after login/signup to
// mirror the identity user into CTM with name/email the token does not carry).
exports.upsertUser = async (req, res, next) => {
    try {
        const id = req.body.id || req.body.user_id || req.auth?.userId;
        if (!id) throw new AppError('VALIDATION_ERROR', 'id is required', 400);
        const fields = {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            company_id: req.body.company_id ?? req.body.companyId,
            avatar_url: req.body.avatar_url ?? req.body.avatarUrl,
            is_verified: req.body.is_verified ?? req.body.isVerified,
        };
        Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
        const [profile, created] = await db.user_profiles.findOrCreate({
            where: { user_id: id },
            defaults: { user_id: id, ...fields },
        });
        if (Object.keys(fields).length) { Object.assign(profile, fields); await profile.save(); }
        _seen.add(String(id));
        if (created) events.emit('user.created', { id: String(id), name: profile.name, email: profile.email, role: profile.role }, { companyId: profile.company_id, related: { type: 'User', id: String(id) } });
        sendSuccess(res, profile, 201);
    } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
    try {
        const profile = await db.user_profiles.findByPk(req.params.id);
        if (!profile) throw new AppError('NOT_FOUND', 'User not found', 404);
        const fields = [
            'name', 'email', 'role', 'company_id', 'avatar_url', 'bio', 'location',
            'experience_level', 'skills', 'github_url', 'linkedin_url', 'portfolio_links',
            'is_active', 'is_verified', 'consent_accepted', 'consent_accepted_at',
            'onboarding_completed', 'candidate_onboarding_completed', 'metadata',
        ];
        fields.forEach((f) => { if (req.body[f] !== undefined) profile[f] = req.body[f]; });
        await profile.save();
        sendSuccess(res, profile);
    } catch (err) { next(err); }
};

exports.getLeaderboard = async (req, res, next) => {
    try {
        const limit = Number(req.query.limit || 50);
        // Ranked aggregate over finalized submission scores.
        const perf = await db.submissions.findAll({
            where: { score: { [Op.ne]: null } },
            attributes: [
                'user_id',
                [fn('COUNT', col('id')), 'completed_tasks'],
                [fn('AVG', col('score')), 'average_score'],
            ],
            group: ['user_id'],
            order: [[literal('AVG(score)'), 'DESC']],
            limit,
            raw: true,
        });
        const ids = perf.map((p) => p.user_id);
        const profiles = ids.length
            ? await db.user_profiles.findAll({ where: { user_id: { [Op.in]: ids } } })
            : [];
        const byId = new Map(profiles.map((p) => [String(p.user_id), p]));
        const ranked = perf.map((p, i) => {
            const profile = byId.get(String(p.user_id));
            return {
                rank: i + 1,
                user_id: p.user_id,
                completed_tasks: Number(p.completed_tasks || 0),
                average_score: p.average_score != null ? Math.round(Number(p.average_score) * 10) / 10 : 0,
                ...(profile ? profile.toJSON() : {}),
            };
        });
        sendSuccess(res, ranked);
    } catch (err) { next(err); }
};

// ── Notifications ────────────────────────────────────────────────────────────────

exports.listNotifications = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        // Default: the caller's notifications + broadcasts, unless explicitly filtered.
        if (req.query.user_id) where.user_id = req.query.user_id;
        else if (req.auth?.userId && req.query.scope !== 'all') {
            where[Op.or] = [{ user_id: req.auth.userId }, { user_id: null }];
        }
        if (req.query.company_id) where.company_id = req.query.company_id;
        if (req.query.status) where.status = req.query.status;
        if (req.query.type) where.type = req.query.type;
        const { count, rows } = await db.notifications.findAndCountAll({
            where, offset, limit, order: [['created_at', 'DESC']],
        });
        sendPaginated(res, rows, count, Number(req.query.page || 1), limit);
    } catch (err) { next(err); }
};

exports.createNotification = async (req, res, next) => {
    try {
        const { user_id, company_id, type, priority, title, description, related_entity } = req.body;
        if (!type || !title) throw new AppError('VALIDATION_ERROR', 'type and title are required', 400);
        const n = await db.notifications.create({
            user_id, company_id, type, priority, title, description,
            related_entity: related_entity || {},
        });
        sendSuccess(res, n, 201);
    } catch (err) { next(err); }
};

exports.updateNotification = async (req, res, next) => {
    try {
        const n = await db.notifications.findByPk(req.params.id);
        if (!n) throw new AppError('NOT_FOUND', 'Notification not found', 404);
        if (req.body.status !== undefined) n.status = req.body.status;
        if (req.body.priority !== undefined) n.priority = req.body.priority;
        await n.save();
        sendSuccess(res, n);
    } catch (err) { next(err); }
};

// ── Task Templates ───────────────────────────────────────────────────────────────

exports.listTemplates = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.company_id) where.company_id = req.query.company_id;
        const templates = await db.task_templates.findAll({ where, order: [['created_at', 'DESC']] });
        sendSuccess(res, templates);
    } catch (err) { next(err); }
};

exports.createTemplate = async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        const b = req.body;
        const company_id = b.company_id ?? b.createdBy;
        if (!company_id || !b.title) throw new AppError('VALIDATION_ERROR', 'company_id and title are required', 400);
        const t = await db.task_templates.create({
            company_id, created_by: userId,
            title: b.title, description: b.description,
            role_category: b.role_category ?? b.roleCategory,
            difficulty: b.difficulty,
            task_types: b.task_types ?? b.taskTypes ?? [],
            instructions: b.instructions,
            expected_outputs: b.expected_outputs ?? b.expectedOutputs,
            time_limit_minutes: b.time_limit_minutes ?? b.timeLimitMinutes,
            multi_round: b.multi_round ?? b.multiRound ?? false,
            rounds: b.rounds ?? [],
            is_private: b.is_private ?? b.isPrivate ?? false,
        });
        sendSuccess(res, t, 201);
    } catch (err) { next(err); }
};

exports.deleteTemplate = async (req, res, next) => {
    try {
        const t = await db.task_templates.findByPk(req.params.id);
        if (!t) throw new AppError('NOT_FOUND', 'Template not found', 404);
        await t.destroy();
        sendSuccess(res, { id: req.params.id, deleted: true });
    } catch (err) { next(err); }
};

// ── Invoices ─────────────────────────────────────────────────────────────────────

exports.listInvoices = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        if (req.query.company_id) where.company_id = req.query.company_id;
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.invoices.findAndCountAll({
            where, offset, limit, order: [['issued_at', 'DESC']],
            include: [{ association: 'company', attributes: ['id', 'name'] }],
        });
        sendPaginated(res, rows, count, Number(req.query.page || 1), limit);
    } catch (err) { next(err); }
};

exports.getInvoice = async (req, res, next) => {
    try {
        const inv = await db.invoices.findByPk(req.params.id, { include: [{ association: 'company', attributes: ['id', 'name'] }] });
        if (!inv) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
        sendSuccess(res, inv);
    } catch (err) { next(err); }
};

exports.createInvoice = async (req, res, next) => {
    try {
        const b = req.body;
        const company_id = b.company_id ?? b.companyId;
        if (!company_id) throw new AppError('VALIDATION_ERROR', 'company_id is required', 400);
        const subtotal = Number(b.subtotal ?? b.amount ?? 0);
        const tax = Number(b.tax ?? 0);
        const amount = Number(b.amount ?? subtotal + tax);
        const inv = await db.invoices.create({
            company_id,
            subscription_id: b.subscription_id ?? b.subscriptionId,
            amount, subtotal, tax,
            currency: b.currency ?? 'USD',
            status: b.status ?? 'Pending',
            plan_name: b.plan_name ?? b.planName,
            issued_at: b.issued_at ?? b.date ?? new Date(),
            due_date: b.due_date ?? b.dueDate,
            billing_period_start: b.billing_period_start ?? b.billingPeriod?.start,
            billing_period_end: b.billing_period_end ?? b.billingPeriod?.end,
            line_items: b.line_items ?? b.lineItems ?? [],
        });
        sendSuccess(res, inv, 201);
    } catch (err) { next(err); }
};

exports.ensureUserProfile = ensureUserProfile;
