'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { Op } = require('sequelize');

const NICHE_MAP = {
    tech: ['technology', 'software', 'gadgets', 'ai'],
    fashion: ['style', 'clothing', 'apparel', 'luxury'],
    food: ['cooking', 'recipes', 'restaurant', 'cuisine'],
    fitness: ['gym', 'health', 'workout', 'sports'],
    travel: ['adventure', 'tourism', 'destinations'],
    gaming: ['esports', 'video games', 'streaming'],
};

function nicheOverlap(dealNiche, creatorCategories) {
    if (!dealNiche || !creatorCategories) return 40;
    const dn = dealNiche.toLowerCase();
    const cats = Array.isArray(creatorCategories) ? creatorCategories.map((c) => c.toLowerCase()) : [];
    if (cats.includes(dn)) return 100;
    const related = NICHE_MAP[dn] || [];
    if (cats.some((c) => related.includes(c))) return 70;
    return 30;
}

function calcMatchScore(deal, creator) {
    const creatorNiches = Array.isArray(creator.niche) ? creator.niche : (creator.niche ? [creator.niche] : []);
    const niche = nicheOverlap(deal.niche || '', creatorNiches);
    const followers = Math.max(
        creator.follower_count_instagram || 0,
        creator.follower_count_youtube || 0,
        creator.follower_count_twitter || 0,
        creator.follower_count_tiktok || 0,
    );
    const minF = deal.min_followers || 0;
    const followerScore = followers >= minF ? Math.min(100, 50 + Math.log10(followers + 1) * 10) : 20;
    const engRate = Number(creator.engagement_rate || 3);
    const engScore = Math.min(100, engRate * 12);
    const total = Math.round(niche * 0.40 + followerScore * 0.35 + engScore * 0.25);
    return { total, breakdown: { niche, followers: followerScore, engagement: engScore } };
}

exports.getMatches = async (req, res, next) => {
    try {
        const { dealId } = req.params;
        const deal = await db.Deal.findOne({ where: { id: dealId, org_id: req.user.orgId } });
        if (!deal) return next(new AppError('NOT_FOUND', 'Deal not found', 404));
        const creators = await db.InfluencerProfile.findAll({ limit: 50 });
        const scored = creators
            .map((c) => {
                const ms = calcMatchScore(deal, c.toJSON());
                return { creator: c, matchScore: ms.total, breakdown: ms.breakdown };
            })
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 20);
        return sendSuccess(req, res, { dealId, matches: scored });
    } catch (err) { return next(err); }
};

exports.autoShortlist = async (req, res, next) => {
    try {
        const { dealId, creatorIds } = req.body;
        if (!dealId || !creatorIds || !creatorIds.length) {
            return next(new AppError('VALIDATION', 'dealId and creatorIds are required', 400));
        }
        const deal = await db.Deal.findOne({ where: { id: dealId, org_id: req.user.orgId } });
        if (!deal) return next(new AppError('NOT_FOUND', 'Deal not found', 404));
        const creators = await db.InfluencerProfile.findAll({ where: { id: { [Op.in]: creatorIds } } });
        return sendSuccess(req, res, { dealId, shortlisted: creators.length, creators });
    } catch (err) { return next(err); }
};

exports.shortlistCreator = async (req, res, next) => {
    try {
        const { creatorId, dealId } = req.body;
        if (!creatorId || !dealId) return next(new AppError('VALIDATION', 'creatorId and dealId are required', 400));
        const deal = await db.Deal.findOne({ where: { id: dealId, org_id: req.user.orgId } });
        if (!deal) return next(new AppError('NOT_FOUND', 'Deal not found', 404));
        const creator = await db.InfluencerProfile.findByPk(creatorId);
        if (!creator) return next(new AppError('NOT_FOUND', 'Creator not found', 404));
        return sendSuccess(req, res, { message: 'Creator shortlisted', creatorId, dealId });
    } catch (err) { return next(err); }
};

exports.getShortlisted = async (req, res, next) => {
    try {
        const { dealId } = req.params;
        const deal = await db.Deal.findOne({ where: { id: dealId, org_id: req.user.orgId } });
        if (!deal) return next(new AppError('NOT_FOUND', 'Deal not found', 404));
        const creators = await db.InfluencerProfile.findAll({ limit: 10 });
        return sendSuccess(req, res, { dealId, creators });
    } catch (err) { return next(err); }
};
