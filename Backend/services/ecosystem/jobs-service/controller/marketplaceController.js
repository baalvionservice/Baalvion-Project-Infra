'use strict';
/**
 * The project marketplace.
 *
 * Two audiences meet here. A client posts work and makes it public; people bid to do
 * it, either alone or as a team they bring with them. The public half needs no session
 * — browsing work you might do shouldn't require an account — while bidding does, so
 * that a bid is attached to a real candidate record with a Candidate ID.
 */
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { ensureCandidateCode } = require('../utils/referenceCodes');
const { sendMail, companyNameFor } = require('../service/candidateLifecycle');

const slugify = (value) =>
    String(value)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 160);

/** Slug that doesn't collide, since it's the project's public URL. */
async function uniqueSlug(title, id) {
    const base = slugify(title) || `project-${id}`;
    const taken = await db.Project.findOne({ where: { slug: base, id: { [Op.ne]: id || 0 } } });
    return taken ? `${base}-${id}` : base;
}

// What a public visitor is allowed to see. Deliberately excludes client_id,
// contractor_id and the org's internal identifiers.
const publicProjectFields = (p) => ({
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    description: p.description,
    category: p.category,
    status: p.status,
    requiredSkills: p.required_skills || [],
    budget: p.budget !== null && p.budget !== undefined ? Number(p.budget) : null,
    currency: p.currency,
    country: p.country,
    collaborationMode: p.collaboration_mode,
    maxTeamSize: p.max_team_size,
    roles: p.roles || [],
    deadline: p.deadline,
    applicationsCount: p.applications_count || 0,
    publishedAt: p.published_at,
    createdAt: p.created_at || p.createdAt,
});

// ─── Public browsing ──────────────────────────────────────────────────────────

/** Published, open projects. No auth: this is the shop window. */
const listPublicProjects = async (req, res, next) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 12, 50);

        const where = { is_public: true, status: { [Op.in]: ['OPEN', 'ACTIVE'] } };
        if (req.query.category && req.query.category !== 'All') where.category = req.query.category;
        if (req.query.mode && req.query.mode !== 'All') {
            // "Show me what I can do alone" must still include projects open to either.
            where.collaboration_mode = { [Op.in]: [req.query.mode, 'either'] };
        }
        if (req.query.search) {
            where[Op.or] = [
                { title:       { [Op.iLike]: `%${req.query.search}%` } },
                { summary:     { [Op.iLike]: `%${req.query.search}%` } },
                { description: { [Op.iLike]: `%${req.query.search}%` } },
            ];
        }
        if (req.query.skill) {
            where.required_skills = { [Op.contains]: [req.query.skill] };
        }

        const { rows, count } = await db.Project.findAndCountAll({
            where,
            limit,
            offset: (page - 1) * limit,
            order: [['published_at', 'DESC'], ['created_at', 'DESC']],
        });

        return sendPaginated(req, res, {
            items: rows.map(publicProjectFields),
            pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
        });
    } catch (err) { return next(err); }
};

/** One public project by slug or id. */
const getPublicProject = async (req, res, next) => {
    try {
        const key = req.params.slug;
        const where = /^\d+$/.test(key) ? { id: key } : { slug: key };
        const project = await db.Project.findOne({ where: { ...where, is_public: true } });
        if (!project) throw new AppError('NOT_FOUND', 'Project not found', 404);
        return sendSuccess(req, res, publicProjectFields(project));
    } catch (err) { return next(err); }
};

/** Distinct categories and skills across live projects — real filter options only. */
const listProjectFacets = async (req, res, next) => {
    try {
        const rows = await db.Project.findAll({
            where: { is_public: true, status: { [Op.in]: ['OPEN', 'ACTIVE'] } },
            attributes: ['category', 'required_skills', 'collaboration_mode'],
            raw: true,
        });
        const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
        const skills = [...new Set(rows.flatMap((r) => r.required_skills || []).filter(Boolean))].sort();
        const modes = [...new Set(rows.map((r) => r.collaboration_mode).filter(Boolean))];
        return sendSuccess(req, res, { categories, skills, modes });
    } catch (err) { return next(err); }
};

// ─── Publishing (staff / client side) ─────────────────────────────────────────

const publishProject = async (req, res, next) => {
    try {
        const project = await db.Project.findOne({ where: { id: req.params.id, org_id: req.auth.orgId } });
        if (!project) throw new AppError('NOT_FOUND', 'Project not found', 404);
        if (!project.description) {
            throw new AppError('VALIDATION_ERROR', 'A project needs a description before it can be listed publicly', 422);
        }
        await project.update({
            is_public: true,
            slug: project.slug || (await uniqueSlug(project.title, project.id)),
            published_at: project.published_at || new Date(),
            status: project.status === 'DRAFT' ? 'OPEN' : project.status,
        });
        return sendSuccess(req, res, publicProjectFields(project));
    } catch (err) { return next(err); }
};

const unpublishProject = async (req, res, next) => {
    try {
        const project = await db.Project.findOne({ where: { id: req.params.id, org_id: req.auth.orgId } });
        if (!project) throw new AppError('NOT_FOUND', 'Project not found', 404);
        await project.update({ is_public: false });
        return sendSuccess(req, res, publicProjectFields(project));
    } catch (err) { return next(err); }
};

// ─── Bidding ──────────────────────────────────────────────────────────────────

const MAX_TEAM_MEMBERS = 12;

/** Trim a submitted team roster to the fields we store, and sanity-check it. */
function normaliseTeam(members, maxTeamSize) {
    if (!Array.isArray(members)) return [];
    const cleaned = members
        .map((m) => ({
            name: String(m.name || '').trim().slice(0, 160),
            email: String(m.email || '').trim().slice(0, 255),
            role: String(m.role || '').trim().slice(0, 160),
        }))
        .filter((m) => m.name);

    const cap = Math.min(maxTeamSize || MAX_TEAM_MEMBERS, MAX_TEAM_MEMBERS);
    // The lead counts towards the team size, so the roster may hold cap - 1 others.
    if (cleaned.length > cap - 1) {
        throw new AppError(
            'VALIDATION_ERROR',
            `This project takes teams of up to ${cap}, including you`,
            422,
        );
    }
    return cleaned;
}

/** The signed-in caller's candidate row, created on first use like everywhere else. */
async function candidateForCaller(req) {
    const email = req.portal && req.portal.email;
    if (!email) throw new AppError('UNAUTHORIZED', 'Sign in to apply', 401);
    let candidate = await db.Candidate.findOne({ where: { email }, order: [['created_at', 'DESC']] });
    if (!candidate) {
        candidate = await db.Candidate.create({ email, org_id: req.auth.orgId || null, source: 'direct' });
    }
    await ensureCandidateCode(db.sequelize, candidate);
    return candidate;
}

const applyToProject = async (req, res, next) => {
    try {
        const project = await db.Project.findOne({ where: { id: req.params.id, is_public: true } });
        if (!project) throw new AppError('NOT_FOUND', 'Project not found', 404);
        if (!['OPEN', 'ACTIVE'].includes(project.status)) {
            throw new AppError('VALIDATION_ERROR', 'This project is no longer taking applications', 422);
        }

        const body = req.body || {};
        const mode = body.mode === 'team' ? 'team' : 'solo';

        // Respect what the poster asked for rather than silently accepting anything.
        if (project.collaboration_mode !== 'either' && project.collaboration_mode !== mode) {
            throw new AppError(
                'VALIDATION_ERROR',
                project.collaboration_mode === 'solo'
                    ? 'This project is for an individual, not a team'
                    : 'This project is for a team, not an individual',
                422,
            );
        }

        const pitch = String(body.pitch || '').trim();
        if (pitch.length < 40) {
            throw new AppError('VALIDATION_ERROR', 'Tell them a little more — at least 40 characters', 422);
        }
        if (pitch.length > 5000) {
            throw new AppError('VALIDATION_ERROR', 'Your pitch is too long (max 5000 characters)', 422);
        }

        const teamMembers = mode === 'team' ? normaliseTeam(body.teamMembers, project.max_team_size) : [];
        if (mode === 'team' && teamMembers.length === 0) {
            throw new AppError('VALIDATION_ERROR', 'Add at least one teammate, or apply on your own', 422);
        }

        const candidate = await candidateForCaller(req);

        const existing = await db.ProjectApplication.findOne({
            where: { project_id: project.id, lead_candidate_id: candidate.id },
        });
        if (existing) throw new AppError('CONFLICT', 'You have already applied to this project', 409);

        const application = await db.ProjectApplication.create({
            project_id: project.id,
            org_id: project.org_id,
            lead_candidate_id: candidate.id,
            mode,
            team_name: mode === 'team' ? String(body.teamName || '').trim().slice(0, 160) || null : null,
            team_members: teamMembers,
            role_applied: body.role ? String(body.role).slice(0, 160) : null,
            pitch,
            portfolio_url: body.portfolioUrl ? String(body.portfolioUrl).slice(0, 2000) : null,
            expected_rate: body.expectedRate ? Number(body.expectedRate) : null,
            currency: body.currency || project.currency || null,
            availability: body.availability ? String(body.availability).slice(0, 120) : null,
        });

        await project.increment('applications_count');

        const companyName = await companyNameFor(project.org_id);
        sendMail('project.application_submitted', candidate.email, {
            candidateName: candidate.full_name || candidate.email,
            projectTitle: project.title,
            companyName,
            referenceCode: candidate.reference_code,
            mode,
            teamSize: mode === 'team' ? teamMembers.length + 1 : 1,
        });

        return sendSuccess(req, res, application, 201);
    } catch (err) { return next(err); }
};

/** The caller's own project bids, for their dashboard. */
const listMyProjectApplications = async (req, res, next) => {
    try {
        const email = req.portal && req.portal.email;
        if (!email) return sendSuccess(req, res, []);
        const candidates = await db.Candidate.findAll({ where: { email }, attributes: ['id'] });
        const ids = candidates.map((c) => c.id);
        if (!ids.length) return sendSuccess(req, res, []);

        const rows = await db.ProjectApplication.findAll({
            where: { lead_candidate_id: { [Op.in]: ids } },
            include: [{
                model: db.Project, as: 'project',
                attributes: ['id', 'slug', 'title', 'status', 'category', 'currency', 'budget'],
            }],
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

/** Bids on one project — org-scoped, for whoever posted it. */
const listProjectApplications = async (req, res, next) => {
    try {
        const project = await db.Project.findOne({ where: { id: req.params.id, org_id: req.auth.orgId } });
        if (!project) throw new AppError('NOT_FOUND', 'Project not found', 404);
        const rows = await db.ProjectApplication.findAll({
            where: { project_id: project.id },
            include: [{
                model: db.Candidate, as: 'lead',
                attributes: ['id', 'full_name', 'email', 'reference_code', 'headline'],
            }],
            order: [['created_at', 'DESC']],
        });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
};

const updateProjectApplicationStatus = async (req, res, next) => {
    try {
        const application = await db.ProjectApplication.findOne({
            where: { id: req.params.id, org_id: req.auth.orgId },
            include: [
                { model: db.Candidate, as: 'lead', attributes: ['email', 'full_name', 'reference_code'] },
                { model: db.Project, as: 'project', attributes: ['title', 'org_id'] },
            ],
        });
        if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);

        const status = String(req.body.status || '').toLowerCase();
        if (!['submitted', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
            throw new AppError('VALIDATION_ERROR', 'Invalid status', 422);
        }
        const previous = application.status;
        await application.update({ status });

        if (status !== previous && application.lead && application.lead.email) {
            sendMail('project.status_changed', application.lead.email, {
                candidateName: application.lead.full_name || application.lead.email,
                projectTitle: application.project ? application.project.title : 'your project application',
                companyName: await companyNameFor(application.org_id),
                status,
                referenceCode: application.lead.reference_code,
            });
        }

        return sendSuccess(req, res, application);
    } catch (err) { return next(err); }
};

module.exports = {
    listPublicProjects,
    getPublicProject,
    listProjectFacets,
    publishProject,
    unpublishProject,
    applyToProject,
    listMyProjectApplications,
    listProjectApplications,
    updateProjectApplicationStatus,
};
