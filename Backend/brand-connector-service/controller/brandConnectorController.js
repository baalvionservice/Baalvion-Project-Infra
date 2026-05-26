const {
    paginationSchema,
    createBrandSchema,
    updateBrandSchema,
    createInfluencerSchema,
    updateInfluencerSchema,
    createCampaignSchema,
    updateCampaignSchema,
    applyToCampaignSchema,
    reviewApplicationSchema,
    createPartnershipSchema,
    updatePartnershipSchema,
    createDeliverableSchema,
    updateDeliverableSchema,
} = require('../validators/schemas');
const svc = require('../service/brandConnectorService');
const { sendSuccess, sendPaginated } = require('../utils/response');

// ─── Brands ───────────────────────────────────────────────────────────────────

const listBrands = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { industry, verified } = req.query;
        const data = await svc.listBrands({ page, limit, industry, verified });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const createBrand = async (req, res, next) => {
    try {
        const body = createBrandSchema.parse(req.body);
        const brand = await svc.createBrand(body, req.user.id, req.user.orgId);
        return sendSuccess(req, res, brand, 201);
    } catch (e) { return next(e); }
};

const getBrand = async (req, res, next) => {
    try {
        const brand = await svc.getBrand(req.params.id);
        return sendSuccess(req, res, brand);
    } catch (e) { return next(e); }
};

const updateBrand = async (req, res, next) => {
    try {
        const body = updateBrandSchema.parse(req.body);
        const brand = await svc.updateBrand(req.params.id, body, req.user.id);
        return sendSuccess(req, res, brand);
    } catch (e) { return next(e); }
};

// ─── Influencers ──────────────────────────────────────────────────────────────

const listInfluencers = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { location, platform, min_followers, min_engagement, verified } = req.query;
        const data = await svc.listInfluencers({ page, limit, location, platform, min_followers, min_engagement, verified });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const createInfluencer = async (req, res, next) => {
    try {
        const body = createInfluencerSchema.parse(req.body);
        const influencer = await svc.createInfluencer(body, req.user.id, req.user.orgId);
        return sendSuccess(req, res, influencer, 201);
    } catch (e) { return next(e); }
};

const getInfluencer = async (req, res, next) => {
    try {
        const influencer = await svc.getInfluencer(req.params.id);
        return sendSuccess(req, res, influencer);
    } catch (e) { return next(e); }
};

const updateInfluencer = async (req, res, next) => {
    try {
        const body = updateInfluencerSchema.parse(req.body);
        const influencer = await svc.updateInfluencer(req.params.id, body, req.user.id);
        return sendSuccess(req, res, influencer);
    } catch (e) { return next(e); }
};

// ─── Campaigns ────────────────────────────────────────────────────────────────

const listCampaigns = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { status, platform, category } = req.query;
        const data = await svc.listCampaigns({ page, limit, status, platform, category });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const createCampaign = async (req, res, next) => {
    try {
        const body = createCampaignSchema.parse(req.body);
        const campaign = await svc.createCampaign(body, req.user.id, req.user.orgId);
        return sendSuccess(req, res, campaign, 201);
    } catch (e) { return next(e); }
};

const getCampaign = async (req, res, next) => {
    try {
        const campaign = await svc.getCampaign(req.params.id);
        return sendSuccess(req, res, campaign);
    } catch (e) { return next(e); }
};

const updateCampaign = async (req, res, next) => {
    try {
        const body = updateCampaignSchema.parse(req.body);
        const campaign = await svc.updateCampaign(req.params.id, body, req.user.id);
        return sendSuccess(req, res, campaign);
    } catch (e) { return next(e); }
};

const deleteCampaign = async (req, res, next) => {
    try {
        const result = await svc.deleteCampaign(req.params.id, req.user.id);
        return sendSuccess(req, res, result);
    } catch (e) { return next(e); }
};

const publishCampaign = async (req, res, next) => {
    try {
        const campaign = await svc.publishCampaign(req.params.id, req.user.id);
        return sendSuccess(req, res, campaign);
    } catch (e) { return next(e); }
};

const applyToCampaign = async (req, res, next) => {
    try {
        const body = applyToCampaignSchema.parse(req.body);
        const application = await svc.applyToCampaign(req.params.id, body, req.user.id, req.user.orgId);
        return sendSuccess(req, res, application, 201);
    } catch (e) { return next(e); }
};

const listApplications = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const data = await svc.listApplications(req.params.id, { page, limit }, req.user.id);
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const reviewApplication = async (req, res, next) => {
    try {
        const body = reviewApplicationSchema.parse(req.body);
        const application = await svc.reviewApplication(req.params.id, req.params.appId, body, req.user.id);
        return sendSuccess(req, res, application);
    } catch (e) { return next(e); }
};

// ─── Partnerships ─────────────────────────────────────────────────────────────

const listPartnerships = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const data = await svc.listPartnerships({ page, limit, orgId: req.user.orgId, userId: req.user.id });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const createPartnership = async (req, res, next) => {
    try {
        const body = createPartnershipSchema.parse(req.body);
        const partnership = await svc.createPartnership(body);
        return sendSuccess(req, res, partnership, 201);
    } catch (e) { return next(e); }
};

const getPartnership = async (req, res, next) => {
    try {
        const partnership = await svc.getPartnership(req.params.id, req.user.id);
        return sendSuccess(req, res, partnership);
    } catch (e) { return next(e); }
};

const updatePartnership = async (req, res, next) => {
    try {
        const body = updatePartnershipSchema.parse(req.body);
        const partnership = await svc.updatePartnership(req.params.id, body, req.user.id);
        return sendSuccess(req, res, partnership);
    } catch (e) { return next(e); }
};

const listDeliverables = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const data = await svc.listDeliverables(req.params.id, { page, limit }, req.user.id);
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const createDeliverable = async (req, res, next) => {
    try {
        const body = createDeliverableSchema.parse(req.body);
        const deliverable = await svc.createDeliverable(req.params.id, body, req.user.id);
        return sendSuccess(req, res, deliverable, 201);
    } catch (e) { return next(e); }
};

const updateDeliverable = async (req, res, next) => {
    try {
        const body = updateDeliverableSchema.parse(req.body);
        const deliverable = await svc.updateDeliverable(req.params.id, body, req.user.id);
        return sendSuccess(req, res, deliverable);
    } catch (e) { return next(e); }
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getCampaignAnalytics = async (req, res, next) => {
    try {
        const data = await svc.getCampaignAnalytics(req.user.orgId);
        return sendSuccess(req, res, data);
    } catch (e) { return next(e); }
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
