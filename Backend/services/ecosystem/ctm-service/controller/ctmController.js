'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const events = require('../service/events');

function page(req) {
    return { offset: (Number(req.query.page || 1) - 1) * Number(req.query.limit || 20), limit: Number(req.query.limit || 20) };
}

// ── Companies ─────────────────────────────────────────────────────────────────

exports.listCompanies = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.search) where.name = { [Op.iLike]: `%${req.query.search}%` };
        const { count, rows } = await db.companies.findAndCountAll({ where, offset, limit, order: [['created_at', 'DESC']] });
        sendPaginated(res, rows, count, Number(req.query.page || 1), limit);
    } catch (err) { next(err); }
};

exports.getCompany = async (req, res, next) => {
    try {
        const company = await db.companies.findByPk(req.params.id, { include: [{ association: 'teams' }] });
        if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404);
        sendSuccess(res, company);
    } catch (err) { next(err); }
};

exports.createCompany = async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
        const { id, name, description, website, logo_url, tier } = req.body;
        if (!name) throw new AppError('VALIDATION_ERROR', 'name is required', 400);
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
        // Optional explicit id lets a signup align company.id with the caller's orgId
        // (so the frontend's companyId === orgId resolves the company). Idempotent on re-signup.
        if (id) {
            const [company] = await db.companies.findOrCreate({
                where: { id },
                defaults: { id, owner_user_id: userId, name, description, website, logo_url, tier: tier || 'free', slug },
            });
            return sendSuccess(res, company, 201);
        }
        const company = await db.companies.create({ owner_user_id: userId, name, description, website, logo_url, tier: tier || 'free', slug });
        sendSuccess(res, company, 201);
    } catch (err) { next(err); }
};

exports.updateCompany = async (req, res, next) => {
    try {
        const company = await db.companies.findByPk(req.params.id);
        if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404);
        // IDOR guard: caller must own this company (via orgId or userId) unless admin/super_admin.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin) {
            const callerOrgId = req.auth?.orgId;
            const callerUserId = String(req.auth?.userId || '');
            const ownsViaOrg = callerOrgId && String(company.id) === String(callerOrgId);
            const ownsViaUser = callerUserId && String(company.owner_user_id) === callerUserId;
            if (!ownsViaOrg && !ownsViaUser) {
                throw new AppError('FORBIDDEN', 'You do not have permission to update this company', 403);
            }
        }
        // Mass-assignment guard: explicit allowlist only; org_id/owner_user_id/slug never writeable.
        const fields = ['name', 'description', 'website', 'logo_url', 'tier', 'status', 'settings'];
        fields.forEach(f => { if (req.body[f] !== undefined) company[f] = req.body[f]; });
        await company.save();
        sendSuccess(res, company);
    } catch (err) { next(err); }
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

exports.listTasks = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.company_id) where.company_id = req.query.company_id;
        if (req.query.difficulty) where.difficulty = req.query.difficulty;
        if (req.query.search) where.title = { [Op.iLike]: `%${req.query.search}%` };
        const { count, rows } = await db.tasks.findAndCountAll({ where, offset, limit, order: [['created_at', 'DESC']], include: [{ association: 'company', attributes: ['id', 'name', 'logo_url'] }] });
        sendPaginated(res, rows, count, Number(req.query.page || 1), limit);
    } catch (err) { next(err); }
};

exports.getTask = async (req, res, next) => {
    try {
        const task = await db.tasks.findByPk(req.params.id, { include: [{ association: 'company' }] });
        if (!task) throw new AppError('NOT_FOUND', 'Task not found', 404);
        sendSuccess(res, task);
    } catch (err) { next(err); }
};

exports.createTask = async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
        const { company_id, title, description, requirements, tech_stack, difficulty, reward, currency, deadline, tags } = req.body;
        if (!company_id || !title) throw new AppError('VALIDATION_ERROR', 'company_id and title are required', 400);
        const task = await db.tasks.create({ company_id, created_by: userId, title, description, requirements, tech_stack, difficulty: difficulty || 'medium', reward: reward || 0, currency: currency || 'USD', deadline, tags });
        sendSuccess(res, task, 201);
    } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
    try {
        const task = await db.tasks.findByPk(req.params.id);
        if (!task) throw new AppError('NOT_FOUND', 'Task not found', 404);
        // IDOR guard: caller's org must own the company that owns this task, or caller created it.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin) {
            const callerOrgId = req.auth?.orgId;
            const callerUserId = String(req.auth?.userId || '');
            const ownsViaOrg = callerOrgId && String(task.company_id) === String(callerOrgId);
            const ownsViaCreator = callerUserId && String(task.created_by) === callerUserId;
            if (!ownsViaOrg && !ownsViaCreator) {
                throw new AppError('FORBIDDEN', 'You do not have permission to update this task', 403);
            }
        }
        // Mass-assignment guard: company_id and created_by are never writeable.
        const fields = ['title', 'description', 'requirements', 'tech_stack', 'difficulty', 'status', 'reward', 'currency', 'deadline', 'tags', 'max_submissions', 'metadata'];
        fields.forEach(f => { if (req.body[f] !== undefined) task[f] = req.body[f]; });
        await task.save();
        sendSuccess(res, task);
    } catch (err) { next(err); }
};

exports.publishTask = async (req, res, next) => {
    try {
        const task = await db.tasks.findByPk(req.params.id);
        if (!task) throw new AppError('NOT_FOUND', 'Task not found', 404);
        // IDOR guard: only the owning company or an admin may publish.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin) {
            const callerOrgId = req.auth?.orgId;
            const callerUserId = String(req.auth?.userId || '');
            const ownsViaOrg = callerOrgId && String(task.company_id) === String(callerOrgId);
            const ownsViaCreator = callerUserId && String(task.created_by) === callerUserId;
            if (!ownsViaOrg && !ownsViaCreator) {
                throw new AppError('FORBIDDEN', 'You do not have permission to publish this task', 403);
            }
        }
        task.status = 'open';
        await task.save();
        events.emit('task.published', { id: task.id, title: task.title, company_id: task.company_id }, { companyId: task.company_id, related: { type: 'Task', id: task.id, name: task.title } });
        sendSuccess(res, task);
    } catch (err) { next(err); }
};

exports.closeTask = async (req, res, next) => {
    try {
        const task = await db.tasks.findByPk(req.params.id);
        if (!task) throw new AppError('NOT_FOUND', 'Task not found', 404);
        // IDOR guard: only the owning company or an admin may close.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin) {
            const callerOrgId = req.auth?.orgId;
            const callerUserId = String(req.auth?.userId || '');
            const ownsViaOrg = callerOrgId && String(task.company_id) === String(callerOrgId);
            const ownsViaCreator = callerUserId && String(task.created_by) === callerUserId;
            if (!ownsViaOrg && !ownsViaCreator) {
                throw new AppError('FORBIDDEN', 'You do not have permission to close this task', 403);
            }
        }
        task.status = 'closed';
        await task.save();
        sendSuccess(res, task);
    } catch (err) { next(err); }
};

// ── Submissions ───────────────────────────────────────────────────────────────

exports.listSubmissions = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        if (req.query.task_id)   where.task_id   = req.query.task_id;
        if (req.query.status)    where.status     = req.query.status;
        // Tenant scoping: admins see everything; a candidate sees only their own
        // submissions; a company member sees only submissions on their org's tasks.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const taskWhere = {};
        if (!isAdmin) {
            const callerUserId = req.auth?.userId;
            const callerOrgId = req.auth?.orgId;
            if (callerOrgId) taskWhere.company_id = callerOrgId; // company-scoped review queue
            else if (callerUserId != null) where.user_id = callerUserId; // candidate's own work
            else throw new AppError('FORBIDDEN', 'Authentication context required', 403);
        } else if (req.query.user_id) {
            where.user_id = req.query.user_id;
        }
        const { count, rows } = await db.submissions.findAndCountAll({
            where, offset, limit, order: [['submitted_at', 'DESC']],
            include: [{ association: 'task', attributes: ['id', 'title', 'company_id'], where: Object.keys(taskWhere).length ? taskWhere : undefined, required: Object.keys(taskWhere).length > 0 }],
        });
        sendPaginated(res, rows, count, Number(req.query.page || 1), limit);
    } catch (err) { next(err); }
};

exports.getSubmission = async (req, res, next) => {
    try {
        const submission = await db.submissions.findByPk(req.params.id, { include: [{ association: 'task' }, { association: 'evaluation' }] });
        if (!submission) throw new AppError('NOT_FOUND', 'Submission not found', 404);
        // IDOR guard: candidate code + scores are sensitive — only the submitter, the
        // owning company, or an admin may view a submission.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const isOwner = String(submission.user_id) === String(req.auth?.userId || '');
        const isCompany = req.auth?.orgId && submission.task && String(submission.task.company_id) === String(req.auth.orgId);
        if (!isAdmin && !isOwner && !isCompany) {
            throw new AppError('FORBIDDEN', 'You do not have permission to view this submission', 403);
        }
        sendSuccess(res, submission);
    } catch (err) { next(err); }
};

exports.createSubmission = async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
        const { task_id, code_url, demo_url, description, notes } = req.body;
        if (!task_id) throw new AppError('VALIDATION_ERROR', 'task_id is required', 400);
        const task = await db.tasks.findByPk(task_id);
        if (!task || task.status !== 'open') throw new AppError('FORBIDDEN', 'Task is not accepting submissions', 403);
        const submission = await db.submissions.create({ task_id, user_id: userId, code_url, demo_url, description, notes });
        events.emit('submission.created', { id: submission.id, task_id, user_id: String(userId), company_id: task.company_id }, { companyId: task.company_id, related: { type: 'Submission', id: submission.id } });
        sendSuccess(res, submission, 201);
    } catch (err) { next(err); }
};

exports.updateSubmission = async (req, res, next) => {
    try {
        const submission = await db.submissions.findByPk(req.params.id, { include: [{ association: 'task', attributes: ['company_id'] }] });
        if (!submission) throw new AppError('NOT_FOUND', 'Submission not found', 404);
        // IDOR guard: submitter can edit their own; company admin/admin role can edit any submission on their tasks.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin) {
            const callerUserId = String(req.auth?.userId || '');
            const callerOrgId = req.auth?.orgId;
            const isOwner = callerUserId && String(submission.user_id) === callerUserId;
            const isCompanyAdmin = callerOrgId && submission.task && String(submission.task.company_id) === String(callerOrgId);
            if (!isOwner && !isCompanyAdmin) {
                throw new AppError('FORBIDDEN', 'You do not have permission to update this submission', 403);
            }
            // Non-admin submitter can only update their own content fields; score/feedback/rank/status
            // are review fields that only a company admin (or admin) may write.
            if (isOwner && !isCompanyAdmin) {
                const submitterFields = ['code_url', 'demo_url', 'description', 'notes'];
                submitterFields.forEach(f => { if (req.body[f] !== undefined) submission[f] = req.body[f]; });
                await submission.save();
                return sendSuccess(res, submission);
            }
        }
        // Admin or company admin path: allow all review fields too.
        const fields = ['code_url', 'demo_url', 'description', 'notes', 'status', 'score', 'feedback', 'rank'];
        fields.forEach(f => { if (req.body[f] !== undefined) submission[f] = req.body[f]; });
        await submission.save();
        sendSuccess(res, submission);
    } catch (err) { next(err); }
};

exports.updateSubmissionStatus = async (req, res, next) => {
    try {
        const submission = await db.submissions.findByPk(req.params.id, { include: [{ association: 'task', attributes: ['company_id'] }] });
        if (!submission) throw new AppError('NOT_FOUND', 'Submission not found', 404);
        const { status } = req.body;
        if (!status) throw new AppError('VALIDATION_ERROR', 'status is required', 400);
        // IDOR guard: only the owning company or admin may change submission status.
        // Submitter may only withdraw their own (status === 'withdrawn').
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin) {
            const callerUserId = String(req.auth?.userId || '');
            const callerOrgId = req.auth?.orgId;
            const isCompanyAdmin = callerOrgId && submission.task && String(submission.task.company_id) === String(callerOrgId);
            const isSelfWithdraw = callerUserId && String(submission.user_id) === callerUserId && status === 'withdrawn';
            if (!isCompanyAdmin && !isSelfWithdraw) {
                throw new AppError('FORBIDDEN', 'You do not have permission to update this submission status', 403);
            }
        }
        submission.status = status;
        await submission.save();
        sendSuccess(res, submission);
    } catch (err) { next(err); }
};

// ── Evaluations ───────────────────────────────────────────────────────────────

exports.listEvaluations = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        if (req.query.submission_id) where.submission_id = req.query.submission_id;
        if (req.query.evaluator_id)  where.evaluator_id  = req.query.evaluator_id;
        // Tenant scoping: evaluations carry candidate scores/feedback. Admins may list
        // freely; everyone else must scope to a single submission they own (as submitter
        // or owning company) so they cannot enumerate other candidates' evaluations.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin) {
            if (!req.query.submission_id) throw new AppError('VALIDATION_ERROR', 'submission_id is required', 400);
            const sub = await db.submissions.findByPk(req.query.submission_id, { include: [{ association: 'task', attributes: ['company_id'] }] });
            if (!sub) throw new AppError('NOT_FOUND', 'Submission not found', 404);
            const isOwner = String(sub.user_id) === String(req.auth?.userId || '');
            const isCompany = req.auth?.orgId && sub.task && String(sub.task.company_id) === String(req.auth.orgId);
            if (!isOwner && !isCompany) throw new AppError('FORBIDDEN', 'You do not have permission to view these evaluations', 403);
        }
        const { count, rows } = await db.evaluations.findAndCountAll({ where, offset, limit, order: [['created_at', 'DESC']] });
        sendPaginated(res, rows, count, Number(req.query.page || 1), limit);
    } catch (err) { next(err); }
};

exports.createEvaluation = async (req, res, next) => {
    try {
        const userId = req.auth?.userId;
        const { submission_id, score, feedback, criteria, is_final } = req.body;
        if (!submission_id || score === undefined) throw new AppError('VALIDATION_ERROR', 'submission_id and score are required', 400);
        // Authorize BEFORE writing: only the company that owns the evaluated submission's
        // task (matched by orgId) — or an admin — may score it.
        const sub = await db.submissions.findByPk(submission_id, { include: [{ association: 'task', attributes: ['company_id'] }] });
        if (!sub) throw new AppError('NOT_FOUND', 'Submission not found', 404);
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const isCompanyOwner = req.auth?.orgId && sub.task && String(sub.task.company_id) === String(req.auth.orgId);
        if (!isAdmin && !isCompanyOwner) {
            throw new AppError('FORBIDDEN', 'You do not have permission to evaluate this submission', 403);
        }
        const evaluation = await db.evaluations.create({ submission_id, evaluator_id: userId, score, feedback, criteria: criteria || {}, is_final: is_final || false });
        if (is_final) {
            await db.submissions.update({ score, feedback, status: 'under_review' }, { where: { id: submission_id } });
        }
        events.emit('submission.evaluated', { id: evaluation.id, submission_id, score, user_id: String(sub.user_id) }, { companyId: sub.task?.company_id, related: { type: 'Submission', id: submission_id } });
        sendSuccess(res, evaluation, 201);
    } catch (err) { next(err); }
};

exports.getEvaluationSchemas = async (req, res, next) => {
    try {
        // Rich EvaluationSchema[] shape (criteria as weighted objects) matching the frontend
        // EvaluationSchema/EvaluationCriterion contract so the evaluation form renders directly.
        const schemas = [
            {
                id: 'schema-standard',
                name: 'Standard Technical Evaluation',
                description: 'A balanced schema for evaluating core technical roles.',
                isActive: true,
                criteria: [
                    { id: 'crit-tech', name: 'Technical Skills', description: 'Mastery of required technologies and tools.', maxPoints: 10, weight: 0.3 },
                    { id: 'crit-problem', name: 'Problem Solving', description: 'Ability to analyze problems and devise effective solutions.', maxPoints: 10, weight: 0.3 },
                    { id: 'crit-quality', name: 'Code Quality', description: 'Readability, structure, and best practices.', maxPoints: 10, weight: 0.2 },
                    { id: 'crit-comm', name: 'Communication', description: 'Clarity of explanations and thought process.', maxPoints: 10, weight: 0.2 },
                ],
            },
            {
                id: 'schema-frontend',
                name: 'Frontend Specialist Evaluation',
                description: 'Focused on frontend skills and user experience.',
                isActive: true,
                criteria: [
                    { id: 'crit-react', name: 'Framework Proficiency', description: 'Correct use of components, hooks, and state management.', maxPoints: 10, weight: 0.4 },
                    { id: 'crit-uiux', name: 'UI/UX Implementation', description: 'Attention to detail implementing the design.', maxPoints: 10, weight: 0.3 },
                    { id: 'crit-responsive', name: 'Responsiveness', description: 'Adapts well across screen sizes.', maxPoints: 10, weight: 0.2 },
                    { id: 'crit-perf', name: 'Performance', description: 'Rendering efficiency and awareness.', maxPoints: 10, weight: 0.1 },
                ],
            },
        ];
        sendSuccess(res, schemas);
    } catch (err) { next(err); }
};

// ── Badges ────────────────────────────────────────────────────────────────────

exports.listBadges = async (req, res, next) => {
    try {
        const badges = await db.badges.findAll({ where: { is_active: true }, order: [['rarity', 'ASC']] });
        sendSuccess(res, badges);
    } catch (err) { next(err); }
};

exports.getUserBadges = async (req, res, next) => {
    try {
        const badges = await db.user_badges.findAll({ where: { user_id: req.params.userId }, include: [{ association: 'badge' }] });
        sendSuccess(res, badges);
    } catch (err) { next(err); }
};

// ── Teams ─────────────────────────────────────────────────────────────────────

exports.listTeams = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        if (req.query.company_id) where.company_id = req.query.company_id;
        const { count, rows } = await db.teams.findAndCountAll({ where, offset, limit });
        sendPaginated(res, rows, count, Number(req.query.page || 1), limit);
    } catch (err) { next(err); }
};

// ── Plans ─────────────────────────────────────────────────────────────────────

exports.listPlans = async (req, res, next) => {
    try {
        const plans = await db.plans.findAll({ where: { is_active: true }, order: [['monthly_price', 'ASC']] });
        sendSuccess(res, plans);
    } catch (err) { next(err); }
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

exports.listSubscriptions = async (req, res, next) => {
    try {
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        const where = {};
        if (isAdmin) {
            // Admins may query any company.
            if (req.query.company_id) where.company_id = req.query.company_id;
        } else {
            // Non-admins are locked to their own org; query param is ignored.
            const callerOrgId = req.auth?.orgId;
            if (!callerOrgId) throw new AppError('FORBIDDEN', 'Organization context required', 403);
            where.company_id = callerOrgId;
        }
        const subs = await db.subscriptions.findAll({ where, include: [{ association: 'company', attributes: ['id', 'name'] }] });
        sendSuccess(res, subs);
    } catch (err) { next(err); }
};

exports.createSubscription = async (req, res, next) => {
    try {
        const { plan_id, billing_cycle } = req.body;
        // company_id is derived from the caller's verified org; body-supplied value is
        // accepted only when the caller is an admin (prevents mass-assignment of company_id).
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        let company_id;
        if (isAdmin) {
            // Admin may supply an explicit company_id or their own orgId.
            company_id = req.body.company_id || req.auth?.orgId;
        } else {
            // Non-admins are locked to their verified orgId; body company_id is ignored.
            company_id = req.auth?.orgId;
        }
        if (!company_id || !plan_id) throw new AppError('VALIDATION_ERROR', 'company_id and plan_id are required', 400);
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + (billing_cycle === 'annual' ? 12 : 1));
        const sub = await db.subscriptions.create({ company_id, plan_id, billing_cycle: billing_cycle || 'monthly', status: 'active', current_period_start: now, current_period_end: periodEnd });
        sendSuccess(res, sub, 201);
    } catch (err) { next(err); }
};

exports.updateSubscription = async (req, res, next) => {
    try {
        const sub = await db.subscriptions.findByPk(req.params.id);
        if (!sub) throw new AppError('NOT_FOUND', 'Subscription not found', 404);
        // IDOR guard: caller's org must own this subscription, or caller is admin.
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (!isAdmin) {
            const callerOrgId = req.auth?.orgId;
            if (!callerOrgId || String(sub.company_id) !== String(callerOrgId)) {
                throw new AppError('FORBIDDEN', 'You do not have permission to update this subscription', 403);
            }
        }
        // Mass-assignment guard: company_id is never writeable.
        const fields = ['status', 'plan_id', 'billing_cycle', 'gateway', 'gateway_subscription_id'];
        fields.forEach(f => { if (req.body[f] !== undefined) sub[f] = req.body[f]; });
        await sub.save();
        sendSuccess(res, sub);
    } catch (err) { next(err); }
};

// ── Activities ────────────────────────────────────────────────────────────────

exports.listActivities = async (req, res, next) => {
    try {
        const { offset, limit } = page(req);
        const where = {};
        // Tenant scoping: admins may query any user/company feed; everyone else is locked
        // to their own company feed (company members) or their own activity (candidates).
        const callerRoles = req.auth?.roles || [];
        const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');
        if (isAdmin) {
            if (req.query.user_id)    where.user_id    = req.query.user_id;
            if (req.query.company_id) where.company_id = req.query.company_id;
        } else {
            const callerOrgId = req.auth?.orgId;
            const callerUserId = req.auth?.userId;
            if (callerOrgId) where.company_id = callerOrgId;
            else if (callerUserId != null) where.user_id = callerUserId;
            else throw new AppError('FORBIDDEN', 'Authentication context required', 403);
        }
        const { count, rows } = await db.activities.findAndCountAll({ where, offset, limit, order: [['created_at', 'DESC']] });
        sendPaginated(res, rows, count, Number(req.query.page || 1), limit);
    } catch (err) { next(err); }
};

// ── Analytics ─────────────────────────────────────────────────────────────────

exports.getAnalytics = async (req, res, next) => {
    try {
        const [totalCompanies, totalTasks, totalSubmissions] = await Promise.all([
            db.companies.count(),
            db.tasks.count(),
            db.submissions.count(),
        ]);
        const tasksByStatus = await db.tasks.findAll({ attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']], group: ['status'], raw: true });
        sendSuccess(res, { totalCompanies, totalTasks, totalSubmissions, tasksByStatus });
    } catch (err) { next(err); }
};
