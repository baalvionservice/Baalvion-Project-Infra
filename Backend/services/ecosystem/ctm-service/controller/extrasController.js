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

// Public-safe projection of a profile for the anonymous candidate marketing page.
// Excludes PII / account fields: email, company_id, is_active, is_verified,
// consent_*, onboarding_*, metadata.
const PUBLIC_PROFILE_FIELDS = [
    'user_id', 'name', 'role', 'avatar_url', 'bio', 'location',
    'experience_level', 'skills', 'github_url', 'linkedin_url', 'portfolio_links', 'ranking',
];

function publicProfile(shaped) {
    const out = {};
    for (const f of PUBLIC_PROFILE_FIELDS) if (shaped[f] !== undefined) out[f] = shaped[f];
    out.completed_tasks = shaped.completed_tasks ?? 0;
    out.average_score = shaped.average_score ?? 0;
    if (shaped.badges !== undefined) out.badges = shaped.badges;
    return out;
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
        // Tenant scoping: admins may query any org; everyone else is locked to their own
        // company (company members) or just their own profile (no org context).
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin) {
            const callerOrgId = req.auth?.orgId;
            if (callerOrgId) where.company_id = callerOrgId;
            else where.user_id = req.auth?.userId ?? null;
        } else if (req.query.company_id) {
            where.company_id = req.query.company_id;
        }
        if (req.query.role) where.role = req.query.role;
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
        const shaped = shapeUser(profile, perf, badges);
        // PII guard: only the profile owner or an admin receives the full record
        // (email, company_id, verification/consent flags, metadata). Everyone else —
        // including the anonymous public candidate page — gets a public-safe projection.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const isSelf = String(req.auth?.userId || '') === String(profile.user_id);
        sendSuccess(res, (isAdmin || isSelf) ? shaped : publicProfile(shaped));
    } catch (err) { next(err); }
};

// Upsert from an authenticated client (called by the frontend after login/signup to
// mirror the identity user into CTM with name/email the token does not carry).
exports.upsertUser = async (req, res, next) => {
    try {
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        // Identity comes from the VERIFIED token, not the body: a non-admin can only ever upsert
        // their OWN profile. Admins may target an explicit id. (Closes the profile-takeover IDOR
        // where any caller could write an arbitrary user_id.)
        const targetId = isAdmin ? (req.body.id ?? req.body.user_id ?? req.auth?.userId) : req.auth?.userId;
        if (!targetId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);

        // Self-writable fields only. Privileged fields (role, company_id, is_verified) are
        // admin-only — a user can never self-elevate role, move orgs, or self-verify.
        const selfFields = {
            name: req.body.name,
            email: req.body.email,
            avatar_url: req.body.avatar_url ?? req.body.avatarUrl,
        };
        const adminFields = isAdmin ? {
            role: req.body.role,
            company_id: req.body.company_id ?? req.body.companyId,
            is_verified: req.body.is_verified ?? req.body.isVerified,
        } : {};
        const fields = { ...selfFields, ...adminFields };
        Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);

        // On first create for a non-admin, pin role + company_id from the VERIFIED claims so the
        // mirror lands in the right tenant with the right role (never from the body).
        const claimRole = callerRoles.includes('candidate') ? 'candidate' : (isAdmin ? 'admin' : 'company');
        const defaults = { user_id: targetId, ...fields };
        if (!isAdmin) { defaults.role = claimRole; defaults.company_id = req.auth?.orgId ?? null; }

        const [profile, created] = await db.user_profiles.findOrCreate({
            where: { user_id: targetId },
            defaults,
        });
        if (!created && Object.keys(fields).length) { Object.assign(profile, fields); await profile.save(); }
        _seen.add(String(targetId));
        if (created) events.emit('user.created', { id: String(targetId), name: profile.name, email: profile.email, role: profile.role }, { companyId: profile.company_id, related: { type: 'User', id: String(targetId) } });
        sendSuccess(res, profile, 201);
    } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
    try {
        const profile = await db.user_profiles.findByPk(req.params.id);
        if (!profile) throw new AppError('NOT_FOUND', 'User not found', 404);
        // IDOR + privilege-escalation guard: a caller may only edit their OWN profile
        // unless they hold admin/super_admin. And privileged fields (role, company_id,
        // is_active, is_verified) may ONLY be written by an admin — never via self-update.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const isSelf = String(req.auth?.userId || '') === String(req.params.id);
        if (!isAdmin && !isSelf) {
            throw new AppError('FORBIDDEN', 'You do not have permission to edit this user', 403);
        }
        const selfFields = [
            'name', 'email', 'avatar_url', 'bio', 'location',
            'experience_level', 'skills', 'github_url', 'linkedin_url', 'portfolio_links',
            'consent_accepted', 'consent_accepted_at',
            'onboarding_completed', 'candidate_onboarding_completed', 'metadata',
        ];
        const adminOnlyFields = ['role', 'company_id', 'is_active', 'is_verified'];
        const fields = isAdmin ? [...selfFields, ...adminOnlyFields] : selfFields;
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
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const wantsAll = req.query.scope === 'all';
        // `?scope=all` (and reading another user's feed) is an admin-only firehose.
        if (wantsAll || (req.query.user_id && String(req.query.user_id) !== String(req.auth?.userId || ''))) {
            if (!isAdmin) throw new AppError('FORBIDDEN', 'You do not have permission to view all notifications', 403);
            if (req.query.user_id) where.user_id = req.query.user_id;
        } else {
            // Default: the caller's own notifications + broadcasts only.
            const callerId = req.auth?.userId;
            if (!callerId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
            where[Op.or] = [{ user_id: callerId }, { user_id: null }];
        }
        if (req.query.company_id && isAdmin) where.company_id = req.query.company_id;
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
        const { type, priority, title, description, related_entity } = req.body;
        if (!type || !title) throw new AppError('VALIDATION_ERROR', 'type and title are required', 400);
        // Cross-tenant-injection guard: only admins may target an arbitrary user/company.
        // Everyone else is pinned to their own verified identity + org.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const user_id = isAdmin ? req.body.user_id : (req.auth?.userId ?? null);
        const company_id = isAdmin ? req.body.company_id : (req.auth?.orgId ?? null);
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
        // IDOR guard: a user may only mutate their OWN notification; broadcasts (null
        // user_id) and other users' notifications are admin-only.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin && String(n.user_id || '') !== String(req.auth?.userId || '')) {
            throw new AppError('FORBIDDEN', 'You do not have permission to modify this notification', 403);
        }
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
        // Templates are org-owned — pin to the caller's own org; admins may target an explicit
        // company. A client-supplied company_id is ignored for non-admins (closes the IDOR).
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const callerOrgId = req.auth?.orgId;
        const company_id = isAdmin ? (b.company_id ?? b.createdBy ?? callerOrgId) : callerOrgId;
        if (!company_id || !b.title) throw new AppError('VALIDATION_ERROR', 'organization context and title are required', 400);
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
        // IDOR guard: only the owning org (orgId === template.company_id) or an admin
        // may delete a task template.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin && String(t.company_id) !== String(req.auth?.orgId || '')) {
            throw new AppError('FORBIDDEN', 'You do not have permission to delete this template', 403);
        }
        await t.destroy();
        sendSuccess(res, { id: req.params.id, deleted: true });
    } catch (err) { next(err); }
};

// ── Invoices ─────────────────────────────────────────────────────────────────────

exports.listInvoices = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        // Tenant scoping: non-admins are locked to their own org; the query param is ignored.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (isAdmin) {
            if (req.query.company_id) where.company_id = req.query.company_id;
        } else {
            const callerOrgId = req.auth?.orgId;
            if (!callerOrgId) throw new AppError('FORBIDDEN', 'Organization context required', 403);
            where.company_id = callerOrgId;
        }
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
        // IDOR guard: invoices are billing PII — only the owning org or an admin may read one.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin && String(inv.company_id) !== String(req.auth?.orgId || '')) {
            throw new AppError('FORBIDDEN', 'You do not have permission to view this invoice', 403);
        }
        sendSuccess(res, inv);
    } catch (err) { next(err); }
};

exports.createInvoice = async (req, res, next) => {
    try {
        const b = req.body;
        // Invoices bill a tenant — pin to the caller's own org; admins may bill an explicit
        // company. A client-supplied company_id is ignored for non-admins (closes the IDOR).
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const callerOrgId = req.auth?.orgId;
        const company_id = isAdmin ? (b.company_id ?? b.companyId ?? callerOrgId) : callerOrgId;
        if (!company_id) throw new AppError('FORBIDDEN', 'Organization context required', 403);
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
