'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

const NICHE_VALUES = {
    tech: 90, technology: 90, fashion: 85, beauty: 82, lifestyle: 78,
    fitness: 80, health: 78, food: 75, travel: 76, gaming: 88,
    sports: 77, music: 74, education: 72, finance: 85, business: 83,
    entertainment: 70, art: 68, default: 60,
};

function calcScore(lead) {
    const fields = ['company_name', 'niche', 'email', 'instagram_handle', 'website'];
    const filled = fields.filter((f) => lead[f]).length;
    const completeness = Math.round((filled / fields.length) * 100);

    const nicheKey = (lead.niche || '').toLowerCase();
    const niche_value = NICHE_VALUES[nicheKey] || NICHE_VALUES.default;

    const engagement = lead.instagram_handle ? 65 : 40;

    const now = Date.now();
    const lastScored = lead.last_scored_at ? new Date(lead.last_scored_at).getTime() : 0;
    const daysSince = (now - lastScored) / (1000 * 60 * 60 * 24);
    const activity = daysSince < 7 ? 90 : daysSince < 30 ? 70 : 50;

    const score = Math.round(
        completeness * 0.25 + niche_value * 0.30 + engagement * 0.25 + activity * 0.20
    );

    return {
        score,
        score_breakdown: { completeness, niche_value, engagement, activity },
    };
}

exports.listLeads = async (req, res, next) => {
    try {
        const { status, niche, priority, search, page = 1, limit = 20 } = req.query;
        const where = { org_id: req.user.orgId };
        if (status) where.status = status;
        if (niche) where.niche = { [Op.iLike]: `%${niche}%` };
        if (priority) where.priority = priority;
        if (search) {
            where[Op.or] = [
                { company_name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { instagram_handle: { [Op.iLike]: `%${search}%` } },
            ];
        }
        const p = paginate(page, limit);
        const { rows, count } = await db.Lead.findAndCountAll({
            where,
            ...p,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows,
            total: count,
            page: Number(page),
            limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.getLead = async (req, res, next) => {
    try {
        const lead = await db.Lead.findOne({
            where: { id: req.params.id, org_id: req.user.orgId },
            include: [{ model: db.LeadNote, as: 'notes', order: [['created_at', 'DESC']] }],
        });
        if (!lead) return next(new AppError('NOT_FOUND', 'Lead not found', 404));
        return sendSuccess(req, res, lead);
    } catch (err) { return next(err); }
};

exports.createLead = async (req, res, next) => {
    try {
        const { company_name, niche, email, instagram_handle, website, priority, assigned_to } = req.body;
        if (!company_name) return next(new AppError('VALIDATION', 'company_name is required', 400));
        const raw = { company_name, niche, email, instagram_handle, website, priority, assigned_to, org_id: req.user.orgId };
        const { score, score_breakdown } = calcScore(raw);
        const lead = await db.Lead.create({
            ...raw,
            score,
            score_breakdown,
            last_scored_at: new Date(),
        });
        return sendSuccess(req, res, lead, 201);
    } catch (err) { return next(err); }
};

exports.updateLead = async (req, res, next) => {
    try {
        const lead = await db.Lead.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!lead) return next(new AppError('NOT_FOUND', 'Lead not found', 404));
        const allowed = ['company_name', 'niche', 'email', 'instagram_handle', 'website', 'priority', 'status', 'assigned_to'];
        const updates = {};
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
        await lead.update(updates);
        return sendSuccess(req, res, lead);
    } catch (err) { return next(err); }
};

exports.addNote = async (req, res, next) => {
    try {
        const lead = await db.Lead.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!lead) return next(new AppError('NOT_FOUND', 'Lead not found', 404));
        const { text } = req.body;
        if (!text) return next(new AppError('VALIDATION', 'text is required', 400));
        const note = await db.LeadNote.create({ lead_id: lead.id, text });
        return sendSuccess(req, res, note, 201);
    } catch (err) { return next(err); }
};

exports.convertLead = async (req, res, next) => {
    try {
        const lead = await db.Lead.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!lead) return next(new AppError('NOT_FOUND', 'Lead not found', 404));
        const brand = await db.BrandProfile.create({
            org_id: req.user.orgId,
            user_id: req.user.id,
            brand_name: lead.company_name,
            industry: lead.niche || null,
            website_url: lead.website || null,
            social_links: lead.instagram_handle ? { instagram: lead.instagram_handle } : {},
        });
        await lead.update({ status: 'booked' });
        return sendSuccess(req, res, { brandId: brand.id, brand });
    } catch (err) { return next(err); }
};

exports.runScoring = async (req, res, next) => {
    try {
        const { leadIds } = req.body;
        const where = { org_id: req.user.orgId };
        if (leadIds && leadIds.length > 0) where.id = { [Op.in]: leadIds };
        const leads = await db.Lead.findAll({ where });
        const updates = await Promise.all(leads.map(async (lead) => {
            const { score, score_breakdown } = calcScore(lead.toJSON());
            await lead.update({ score, score_breakdown, last_scored_at: new Date() });
            return { id: lead.id, score, score_breakdown };
        }));
        return sendSuccess(req, res, { scored: updates.length, results: updates });
    } catch (err) { return next(err); }
};

exports.topLeads = async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 10, 50);
        const leads = await db.Lead.findAll({
            where: { org_id: req.user.orgId },
            order: [['score', 'DESC']],
            limit,
        });
        return sendSuccess(req, res, leads);
    } catch (err) { return next(err); }
};

exports.scoringInsights = async (req, res, next) => {
    try {
        const leads = await db.Lead.findAll({ where: { org_id: req.user.orgId }, attributes: ['score', 'priority', 'status'] });
        const total = leads.length;
        const avgScore = total ? Math.round(leads.reduce((s, l) => s + Number(l.score), 0) / total) : 0;
        const distribution = { high: 0, medium: 0, low: 0 };
        leads.forEach((l) => {
            const s = Number(l.score);
            if (s >= 75) distribution.high++;
            else if (s >= 45) distribution.medium++;
            else distribution.low++;
        });
        return sendSuccess(req, res, { total, avgScore, distribution });
    } catch (err) { return next(err); }
};
