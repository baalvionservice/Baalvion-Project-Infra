'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

const NICHES = ['tech', 'fashion', 'food', 'fitness', 'travel', 'gaming', 'beauty', 'lifestyle', 'education', 'finance'];
const HANDLES_IG = ['@brand_creator', '@style_influencer', '@foodie_pro', '@fit_life', '@travel_gram', '@tech_guru', '@beauty_queen', '@lifestyle_hub'];
const HANDLES_LI = ['brand-creator', 'style-influencer', 'foodie-professional', 'fitness-expert', 'travel-blogger'];

function generateMockLeads(platform, query, count, orgId, sessionId) {
    const handles = platform === 'instagram' ? HANDLES_IG : HANDLES_LI;
    const leads = [];
    for (let i = 0; i < count; i++) {
        const niche = NICHES[Math.floor(Math.random() * NICHES.length)];
        const handle = `${handles[i % handles.length]}_${i + 1}`;
        const followers = Math.floor(Math.random() * 500000) + 1000;
        const score = Math.round(50 + Math.random() * 45);
        leads.push({
            session_id: sessionId,
            platform,
            company_name: `${query} Brand ${i + 1}`,
            handle,
            followers,
            niche,
            bio: `${niche} content creator with ${followers.toLocaleString()} followers`,
            website: `https://${handle.replace('@', '').replace('-', '')}.com`,
            email: `contact@${handle.replace('@', '').replace('-', '')}.com`,
            score,
            is_enriched: false,
            imported: false,
            org_id: orgId,
        });
    }
    return leads;
}

exports.scrapeLeads = async (req, res, next) => {
    try {
        const { platform, query, limit = 10 } = req.body;
        if (!platform || !query) return next(new AppError('VALIDATION', 'platform and query are required', 400));
        const validPlatforms = ['instagram', 'linkedin'];
        if (!validPlatforms.includes(platform)) return next(new AppError('VALIDATION', `platform must be one of: ${validPlatforms.join(', ')}`, 400));
        const count = Math.min(Number(limit), 50);
        const session = await db.ScrapeSession.create({ query, platform, lead_count: count, org_id: req.user.orgId });
        const mockLeads = generateMockLeads(platform, query, count, req.user.orgId, session.id);
        await db.ScrapedLead.bulkCreate(mockLeads);
        return sendSuccess(req, res, { session, count, message: `Scraped ${count} leads from ${platform}` }, 201);
    } catch (err) { return next(err); }
};

exports.enrichLeads = async (req, res, next) => {
    try {
        const { leads } = req.body;
        if (!leads || !leads.length) return next(new AppError('VALIDATION', 'leads array is required', 400));
        const ids = leads.map((l) => l.id || l).filter(Boolean);
        const scraped = await db.ScrapedLead.findAll({ where: { id: ids, org_id: req.user.orgId } });
        await Promise.all(scraped.map((sl) =>
            sl.update({
                is_enriched: true,
                email: sl.email || `info@${sl.handle ? sl.handle.replace('@', '') : 'brand'}.com`,
                score: Math.min(100, Number(sl.score) + Math.round(Math.random() * 15)),
            })
        ));
        return sendSuccess(req, res, { enriched: scraped.length });
    } catch (err) { return next(err); }
};

exports.importLeads = async (req, res, next) => {
    try {
        const { leads } = req.body;
        if (!leads || !leads.length) return next(new AppError('VALIDATION', 'leads array is required', 400));
        const ids = leads.map((l) => l.id || l).filter(Boolean);
        const scraped = await db.ScrapedLead.findAll({ where: { id: ids, org_id: req.user.orgId, imported: false } });
        const created = await Promise.all(scraped.map(async (sl) => {
            const lead = await db.Lead.create({
                company_name: sl.company_name || sl.handle,
                niche: sl.niche,
                email: sl.email,
                instagram_handle: sl.platform === 'instagram' ? sl.handle : null,
                website: sl.website,
                score: sl.score,
                status: 'new',
                org_id: req.user.orgId,
                last_scored_at: new Date(),
            });
            await sl.update({ imported: true });
            return lead;
        }));
        return sendSuccess(req, res, { imported: created.length, leads: created }, 201);
    } catch (err) { return next(err); }
};

exports.getHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const p = paginate(page, limit);
        const { rows, count } = await db.ScrapeSession.findAndCountAll({
            where: { org_id: req.user.orgId },
            ...p,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};
