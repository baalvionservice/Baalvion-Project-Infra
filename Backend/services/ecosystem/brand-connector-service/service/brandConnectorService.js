const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const paginate = (page, limit) => ({ offset: (page - 1) * limit, limit });

// ─── Brand Profiles ───────────────────────────────────────────────────────────

const listBrands = async ({ page, limit, industry, verified }) => {
    const where = { status: 'active' };
    if (industry) where.industry = { [Op.iLike]: `%${industry}%` };
    if (typeof verified !== 'undefined') where.verified = verified !== 'false';
    const { count, rows } = await db.BrandProfile.findAndCountAll({
        where,
        order: [['campaigns_count', 'DESC'], ['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const createBrand = async (data, userId, orgId) => {
    return db.BrandProfile.create({ ...data, user_id: userId, org_id: orgId });
};

const getBrand = async (id) => {
    const brand = await db.BrandProfile.findByPk(id);
    if (!brand) throw new AppError('NOT_FOUND', 'Brand not found', 404);
    return brand;
};

const updateBrand = async (id, data, userId) => {
    const brand = await db.BrandProfile.findByPk(id);
    if (!brand) throw new AppError('NOT_FOUND', 'Brand not found', 404);
    if (String(brand.user_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this brand profile', 403);
    return brand.update(data);
};

// ─── Influencer Profiles ──────────────────────────────────────────────────────

const listInfluencers = async ({ page, limit, location, platform, min_followers, min_engagement, verified }) => {
    const where = { status: 'active' };
    if (location) where.location = { [Op.iLike]: `%${location}%` };
    if (typeof verified !== 'undefined') where.verified = verified !== 'false';
    if (min_followers) {
        // Filter by any platform having at least min_followers
        where[Op.or] = [
            { follower_count_instagram: { [Op.gte]: Number(min_followers) } },
            { follower_count_youtube: { [Op.gte]: Number(min_followers) } },
            { follower_count_twitter: { [Op.gte]: Number(min_followers) } },
            { follower_count_tiktok: { [Op.gte]: Number(min_followers) } },
        ];
    }
    if (min_engagement) where.engagement_rate = { [Op.gte]: Number(min_engagement) };

    const { count, rows } = await db.InfluencerProfile.findAndCountAll({
        where,
        order: [['campaigns_completed', 'DESC'], ['engagement_rate', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const createInfluencer = async (data, userId, orgId) => {
    const existing = await db.InfluencerProfile.findOne({ where: { user_id: userId } });
    if (existing) throw new AppError('CONFLICT', 'Influencer profile already exists for this user', 409);
    return db.InfluencerProfile.create({ ...data, user_id: userId, org_id: orgId });
};

const getInfluencer = async (id) => {
    const influencer = await db.InfluencerProfile.findByPk(id);
    if (!influencer) throw new AppError('NOT_FOUND', 'Influencer not found', 404);
    return influencer;
};

const updateInfluencer = async (id, data, userId) => {
    const influencer = await db.InfluencerProfile.findByPk(id);
    if (!influencer) throw new AppError('NOT_FOUND', 'Influencer not found', 404);
    if (String(influencer.user_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this influencer profile', 403);
    return influencer.update(data);
};

// ─── Campaigns ────────────────────────────────────────────────────────────────

const listCampaigns = async ({ page, limit, status, platform, category }) => {
    const where = {};
    if (status) where.status = status;
    else where.status = 'open';

    const { count, rows } = await db.Campaign.findAndCountAll({
        where,
        include: [{ model: db.BrandProfile, as: 'brand', attributes: ['id', 'brand_name', 'logo_url', 'verified'] }],
        order: [['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const createCampaign = async (data, userId, orgId) => {
    const brand = await db.BrandProfile.findByPk(data.brand_id);
    if (!brand) throw new AppError('NOT_FOUND', 'Brand not found', 404);
    if (String(brand.user_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this brand', 403);
    return db.Campaign.create({ ...data, org_id: orgId });
};

const getCampaign = async (id) => {
    const campaign = await db.Campaign.findByPk(id, {
        include: [{ model: db.BrandProfile, as: 'brand', attributes: ['id', 'brand_name', 'logo_url', 'verified', 'industry'] }],
    });
    if (!campaign) throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    await campaign.increment('views_count');
    return campaign;
};

const updateCampaign = async (id, data, userId) => {
    const campaign = await db.Campaign.findByPk(id, { include: [{ model: db.BrandProfile, as: 'brand' }] });
    if (!campaign) throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    if (String(campaign.brand.user_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this campaign', 403);
    return campaign.update(data);
};

const deleteCampaign = async (id, userId) => {
    const campaign = await db.Campaign.findByPk(id, { include: [{ model: db.BrandProfile, as: 'brand' }] });
    if (!campaign) throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    if (String(campaign.brand.user_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this campaign', 403);
    if (campaign.status !== 'draft')
        throw new AppError('BAD_REQUEST', 'Only draft campaigns can be deleted', 400);
    await campaign.destroy();
    return { deleted: true };
};

const publishCampaign = async (id, userId) => {
    const campaign = await db.Campaign.findByPk(id, { include: [{ model: db.BrandProfile, as: 'brand' }] });
    if (!campaign) throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    if (String(campaign.brand.user_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this campaign', 403);
    if (campaign.status !== 'draft')
        throw new AppError('BAD_REQUEST', 'Only draft campaigns can be published', 400);
    return campaign.update({ status: 'open' });
};

const applyToCampaign = async (campaignId, data, userId, orgId) => {
    const campaign = await db.Campaign.findByPk(campaignId);
    if (!campaign) throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    if (campaign.status !== 'open') throw new AppError('BAD_REQUEST', 'Campaign is not accepting applications', 400);

    const influencer = await db.InfluencerProfile.findOne({ where: { user_id: userId } });
    if (!influencer) throw new AppError('NOT_FOUND', 'You must have an influencer profile to apply', 404);

    const existing = await db.CampaignApplication.findOne({
        where: { campaign_id: campaignId, influencer_id: influencer.id },
    });
    if (existing) throw new AppError('CONFLICT', 'You have already applied to this campaign', 409);

    const application = await db.CampaignApplication.create({
        ...data,
        campaign_id: campaignId,
        influencer_id: influencer.id,
        org_id: orgId,
    });
    await campaign.increment('applications_count');
    return application;
};

const listApplications = async (campaignId, { page, limit }, userId) => {
    const campaign = await db.Campaign.findByPk(campaignId, { include: [{ model: db.BrandProfile, as: 'brand' }] });
    if (!campaign) throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    if (String(campaign.brand.user_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'Access denied', 403);

    const { count, rows } = await db.CampaignApplication.findAndCountAll({
        where: { campaign_id: campaignId },
        include: [{ model: db.InfluencerProfile, as: 'influencer' }],
        order: [['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const reviewApplication = async (campaignId, appId, data, userId) => {
    const campaign = await db.Campaign.findByPk(campaignId, { include: [{ model: db.BrandProfile, as: 'brand' }] });
    if (!campaign) throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    if (String(campaign.brand.user_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'Access denied', 403);

    const application = await db.CampaignApplication.findOne({
        where: { id: appId, campaign_id: campaignId },
    });
    if (!application) throw new AppError('NOT_FOUND', 'Application not found', 404);

    const updates = { status: data.status };
    if (data.status === 'rejected' && data.rejection_reason) updates.rejection_reason = data.rejection_reason;
    if (data.status === 'approved') {
        updates.approved_at = new Date();
        await campaign.increment('current_influencers');
    }
    return application.update(updates);
};

// ─── Partnerships ─────────────────────────────────────────────────────────────

const listPartnerships = async ({ page, limit, orgId, userId }) => {
    const brand = await db.BrandProfile.findOne({ where: { user_id: userId } });
    const influencer = await db.InfluencerProfile.findOne({ where: { user_id: userId } });

    const where = {};
    if (brand) where.brand_id = brand.id;
    else if (influencer) where.influencer_id = influencer.id;
    else throw new AppError('BAD_REQUEST', 'You need a brand or influencer profile', 400);

    const { count, rows } = await db.Partnership.findAndCountAll({
        where,
        include: [
            { model: db.BrandProfile, as: 'brand', attributes: ['id', 'brand_name', 'logo_url'] },
            { model: db.InfluencerProfile, as: 'influencer', attributes: ['id', 'display_name', 'avatar_url'] },
        ],
        order: [['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const createPartnership = async (data) => {
    const brand = await db.BrandProfile.findByPk(data.brand_id);
    if (!brand) throw new AppError('NOT_FOUND', 'Brand not found', 404);
    const influencer = await db.InfluencerProfile.findByPk(data.influencer_id);
    if (!influencer) throw new AppError('NOT_FOUND', 'Influencer not found', 404);
    return db.Partnership.create(data);
};

const getPartnership = async (id, userId) => {
    const partnership = await db.Partnership.findByPk(id, {
        include: [
            { model: db.BrandProfile, as: 'brand' },
            { model: db.InfluencerProfile, as: 'influencer' },
            { model: db.Campaign, as: 'campaign', required: false },
        ],
    });
    if (!partnership) throw new AppError('NOT_FOUND', 'Partnership not found', 404);
    const isBrandOwner = String(partnership.brand.user_id) === String(userId);
    const isInfluencer = String(partnership.influencer.user_id) === String(userId);
    if (!isBrandOwner && !isInfluencer) throw new AppError('FORBIDDEN', 'Access denied', 403);
    return partnership;
};

const updatePartnership = async (id, data, userId) => {
    const partnership = await db.Partnership.findByPk(id, {
        include: [{ model: db.BrandProfile, as: 'brand' }, { model: db.InfluencerProfile, as: 'influencer' }],
    });
    if (!partnership) throw new AppError('NOT_FOUND', 'Partnership not found', 404);
    const isBrandOwner = String(partnership.brand.user_id) === String(userId);
    const isInfluencer = String(partnership.influencer.user_id) === String(userId);
    if (!isBrandOwner && !isInfluencer) throw new AppError('FORBIDDEN', 'Access denied', 403);

    if (data.payment_status === 'paid' && !partnership.paid_at) data.paid_at = new Date();
    return partnership.update(data);
};

// ─── Deliverables ─────────────────────────────────────────────────────────────

const listDeliverables = async (partnershipId, { page, limit }, userId) => {
    const partnership = await db.Partnership.findByPk(partnershipId, {
        include: [{ model: db.BrandProfile, as: 'brand' }, { model: db.InfluencerProfile, as: 'influencer' }],
    });
    if (!partnership) throw new AppError('NOT_FOUND', 'Partnership not found', 404);
    const isBrandOwner = String(partnership.brand.user_id) === String(userId);
    const isInfluencer = String(partnership.influencer.user_id) === String(userId);
    if (!isBrandOwner && !isInfluencer) throw new AppError('FORBIDDEN', 'Access denied', 403);

    const { count, rows } = await db.Deliverable.findAndCountAll({
        where: { partnership_id: partnershipId },
        order: [['due_date', 'ASC NULLS LAST']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const createDeliverable = async (partnershipId, data, userId) => {
    const partnership = await db.Partnership.findByPk(partnershipId, {
        include: [{ model: db.BrandProfile, as: 'brand' }, { model: db.InfluencerProfile, as: 'influencer' }],
    });
    if (!partnership) throw new AppError('NOT_FOUND', 'Partnership not found', 404);
    const isBrandOwner = String(partnership.brand.user_id) === String(userId);
    const isInfluencer = String(partnership.influencer.user_id) === String(userId);
    if (!isBrandOwner && !isInfluencer) throw new AppError('FORBIDDEN', 'Access denied', 403);
    return db.Deliverable.create({ ...data, partnership_id: partnershipId });
};

const updateDeliverable = async (id, data, userId) => {
    const deliverable = await db.Deliverable.findByPk(id, {
        include: [{
            model: db.Partnership,
            as: 'partnership',
            include: [{ model: db.BrandProfile, as: 'brand' }, { model: db.InfluencerProfile, as: 'influencer' }],
        }],
    });
    if (!deliverable) throw new AppError('NOT_FOUND', 'Deliverable not found', 404);
    const isBrandOwner = String(deliverable.partnership.brand.user_id) === String(userId);
    const isInfluencer = String(deliverable.partnership.influencer.user_id) === String(userId);
    if (!isBrandOwner && !isInfluencer) throw new AppError('FORBIDDEN', 'Access denied', 403);

    if (data.status === 'submitted' && !deliverable.submitted_at) data.submitted_at = new Date();
    if (data.status === 'approved' && !deliverable.approved_at) data.approved_at = new Date();
    return deliverable.update(data);
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getCampaignAnalytics = async (orgId) => {
    const [total, draft, open, inProgress, completed, cancelled, totalBudget, totalApplications] = await Promise.all([
        db.Campaign.count({ where: { org_id: orgId } }),
        db.Campaign.count({ where: { org_id: orgId, status: 'draft' } }),
        db.Campaign.count({ where: { org_id: orgId, status: 'open' } }),
        db.Campaign.count({ where: { org_id: orgId, status: 'in_progress' } }),
        db.Campaign.count({ where: { org_id: orgId, status: 'completed' } }),
        db.Campaign.count({ where: { org_id: orgId, status: 'cancelled' } }),
        db.Campaign.sum('budget', { where: { org_id: orgId } }),
        db.Campaign.sum('applications_count', { where: { org_id: orgId } }),
    ]);
    return {
        total_campaigns: total,
        by_status: { draft, open, in_progress: inProgress, completed, cancelled },
        total_budget_allocated: totalBudget || 0,
        total_applications: totalApplications || 0,
    };
};

module.exports = {
    listBrands, createBrand, getBrand, updateBrand,
    listInfluencers, createInfluencer, getInfluencer, updateInfluencer,
    listCampaigns, createCampaign, getCampaign, updateCampaign, deleteCampaign,
    publishCampaign, applyToCampaign, listApplications, reviewApplication,
    listPartnerships, createPartnership, getPartnership, updatePartnership,
    listDeliverables, createDeliverable, updateDeliverable,
    getCampaignAnalytics,
};
