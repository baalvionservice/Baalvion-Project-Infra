const {
    paginationSchema,
    createPropertySchema,
    updatePropertySchema,
    addImagesSchema,
    addDocumentSchema,
    createAgentSchema,
    updateAgentSchema,
    createViewingSchema,
    updateViewingSchema,
    createInquirySchema,
    updateInquirySchema,
} = require('../validators/schemas');
const svc = require('../service/realEstateService');
const { sendSuccess, sendPaginated } = require('../utils/response');

// ─── Properties ───────────────────────────────────────────────────────────────

const listProperties = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { property_type, listing_type, city, state, min_price, max_price, bedrooms, status } = req.query;
        const data = await svc.listProperties({ page, limit, property_type, listing_type, city, state, min_price, max_price, bedrooms, status });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const createProperty = async (req, res, next) => {
    try {
        const body = createPropertySchema.parse(req.body);
        const property = await svc.createProperty(body, req.user.id, req.user.orgId);
        return sendSuccess(req, res, property, 201);
    } catch (e) { return next(e); }
};

const getProperty = async (req, res, next) => {
    try {
        const property = await svc.getProperty(req.params.id);
        return sendSuccess(req, res, property);
    } catch (e) { return next(e); }
};

const updateProperty = async (req, res, next) => {
    try {
        const body = updatePropertySchema.parse(req.body);
        const property = await svc.updateProperty(req.params.id, body, req.user.id);
        return sendSuccess(req, res, property);
    } catch (e) { return next(e); }
};

const deleteProperty = async (req, res, next) => {
    try {
        const result = await svc.deleteProperty(req.params.id, req.user.id);
        return sendSuccess(req, res, result);
    } catch (e) { return next(e); }
};

const publishProperty = async (req, res, next) => {
    try {
        const property = await svc.publishProperty(req.params.id, req.user.id);
        return sendSuccess(req, res, property);
    } catch (e) { return next(e); }
};

const addImages = async (req, res, next) => {
    try {
        const { images } = addImagesSchema.parse(req.body);
        const property = await svc.addImages(req.params.id, images, req.user.id);
        return sendSuccess(req, res, property);
    } catch (e) { return next(e); }
};

const addDocument = async (req, res, next) => {
    try {
        const body = addDocumentSchema.parse(req.body);
        const doc = await svc.addDocument(req.params.id, body, req.user.id);
        return sendSuccess(req, res, doc, 201);
    } catch (e) { return next(e); }
};

// ─── Agents ───────────────────────────────────────────────────────────────────

const listAgents = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { specialization } = req.query;
        const data = await svc.listAgents({ page, limit, specialization });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const createAgent = async (req, res, next) => {
    try {
        const body = createAgentSchema.parse(req.body);
        const agent = await svc.createAgent(body, req.user.id, req.user.orgId);
        return sendSuccess(req, res, agent, 201);
    } catch (e) { return next(e); }
};

const getAgent = async (req, res, next) => {
    try {
        const agent = await svc.getAgent(req.params.id);
        return sendSuccess(req, res, agent);
    } catch (e) { return next(e); }
};

const updateAgent = async (req, res, next) => {
    try {
        const body = updateAgentSchema.parse(req.body);
        const agent = await svc.updateAgent(req.params.id, body, req.user.id);
        return sendSuccess(req, res, agent);
    } catch (e) { return next(e); }
};

const getAgentProperties = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const data = await svc.getAgentProperties(req.params.id, { page, limit });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

// ─── Viewings ─────────────────────────────────────────────────────────────────

const requestViewing = async (req, res, next) => {
    try {
        const body = createViewingSchema.parse(req.body);
        const viewing = await svc.requestViewing(body, req.user.id);
        return sendSuccess(req, res, viewing, 201);
    } catch (e) { return next(e); }
};

const listViewings = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const data = await svc.listViewings({ page, limit, orgId: req.user.orgId, userId: req.user.id, roles: req.auth.roles });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const getViewing = async (req, res, next) => {
    try {
        const viewing = await svc.getViewing(req.params.id, req.user.id);
        return sendSuccess(req, res, viewing);
    } catch (e) { return next(e); }
};

const updateViewing = async (req, res, next) => {
    try {
        const body = updateViewingSchema.parse(req.body);
        const viewing = await svc.updateViewing(req.params.id, body, req.user.id);
        return sendSuccess(req, res, viewing);
    } catch (e) { return next(e); }
};

// ─── Inquiries ────────────────────────────────────────────────────────────────

const submitInquiry = async (req, res, next) => {
    try {
        const body = createInquirySchema.parse(req.body);
        const userId = req.user ? req.user.id : null;
        const orgId = req.user ? req.user.orgId : null;
        const inquiry = await svc.submitInquiry(body, userId, orgId);
        return sendSuccess(req, res, inquiry, 201);
    } catch (e) { return next(e); }
};

const listInquiries = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const { property_id, status } = req.query;
        const data = await svc.listInquiries({ page, limit, orgId: req.user.orgId, property_id, status });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

const getInquiry = async (req, res, next) => {
    try {
        const inquiry = await svc.getInquiry(req.params.id);
        return sendSuccess(req, res, inquiry);
    } catch (e) { return next(e); }
};

const updateInquiry = async (req, res, next) => {
    try {
        const body = updateInquirySchema.parse(req.body);
        const inquiry = await svc.updateInquiry(req.params.id, body);
        return sendSuccess(req, res, inquiry);
    } catch (e) { return next(e); }
};

// ─── Favorites ────────────────────────────────────────────────────────────────

const toggleFavorite = async (req, res, next) => {
    try {
        const result = await svc.toggleFavorite(req.params.propertyId, req.user.id);
        return sendSuccess(req, res, result);
    } catch (e) { return next(e); }
};

const listFavorites = async (req, res, next) => {
    try {
        const { page, limit } = paginationSchema.parse(req.query);
        const data = await svc.listFavorites(req.user.id, { page, limit });
        return sendPaginated(req, res, data);
    } catch (e) { return next(e); }
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getListingAnalytics = async (req, res, next) => {
    try {
        const data = await svc.getListingAnalytics(req.user.orgId);
        return sendSuccess(req, res, data);
    } catch (e) { return next(e); }
};

module.exports = {
    listProperties, createProperty, getProperty, updateProperty, deleteProperty,
    publishProperty, addImages, addDocument,
    listAgents, createAgent, getAgent, updateAgent, getAgentProperties,
    requestViewing, listViewings, getViewing, updateViewing,
    submitInquiry, listInquiries, getInquiry, updateInquiry,
    toggleFavorite, listFavorites,
    getListingAnalytics,
};
