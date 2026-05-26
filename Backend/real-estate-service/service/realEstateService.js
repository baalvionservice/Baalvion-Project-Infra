const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const paginate = (page, limit) => ({ offset: (page - 1) * limit, limit });

// ─── Properties ───────────────────────────────────────────────────────────────

const listProperties = async ({ page, limit, property_type, listing_type, city, state, min_price, max_price, bedrooms, status }) => {
    const where = {};
    if (status) where.status = status;
    else where.status = 'active';
    if (property_type) where.property_type = property_type;
    if (listing_type) where.listing_type = listing_type;
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = { [Op.iLike]: `%${state}%` };
    if (min_price || max_price) {
        where.price = {};
        if (min_price) where.price[Op.gte] = Number(min_price);
        if (max_price) where.price[Op.lte] = Number(max_price);
    }
    if (bedrooms) where.bedrooms = Number(bedrooms);

    const { count, rows } = await db.Property.findAndCountAll({
        where,
        include: [{ model: db.Agent, as: 'agent', attributes: ['id', 'full_name', 'phone', 'avatar_url', 'rating'] }],
        order: [['published_at', 'DESC NULLS LAST'], ['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const createProperty = async (data, userId, orgId) => {
    return db.Property.create({ ...data, owner_id: userId, org_id: orgId });
};

const getProperty = async (id) => {
    const property = await db.Property.findByPk(id, {
        include: [
            { model: db.Agent, as: 'agent', attributes: ['id', 'full_name', 'email', 'phone', 'avatar_url', 'rating', 'reviews_count'] },
            { model: db.PropertyDocument, as: 'documents', where: { is_public: true }, required: false },
        ],
    });
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404);
    await property.increment('views_count');
    return property;
};

const updateProperty = async (id, data, userId) => {
    const property = await db.Property.findByPk(id);
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404);
    if (String(property.owner_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this property', 403);
    return property.update(data);
};

const deleteProperty = async (id, userId) => {
    const property = await db.Property.findByPk(id);
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404);
    if (String(property.owner_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this property', 403);
    await property.destroy();
    return { deleted: true };
};

const publishProperty = async (id, userId) => {
    const property = await db.Property.findByPk(id);
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404);
    if (String(property.owner_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this property', 403);
    if (property.status === 'active') throw new AppError('BAD_REQUEST', 'Property is already active', 400);
    return property.update({ status: 'active', published_at: new Date() });
};

const addImages = async (id, images, userId) => {
    const property = await db.Property.findByPk(id);
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404);
    if (String(property.owner_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this property', 403);
    const existing = property.images || [];
    return property.update({ images: [...existing, ...images] });
};

const addDocument = async (id, data, userId) => {
    const property = await db.Property.findByPk(id);
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404);
    if (String(property.owner_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this property', 403);
    return db.PropertyDocument.create({ ...data, property_id: id, uploaded_by: userId });
};

// ─── Agents ───────────────────────────────────────────────────────────────────

const listAgents = async ({ page, limit, specialization }) => {
    const where = { status: 'active' };
    if (specialization) where.specialization = { [Op.iLike]: `%${specialization}%` };
    const { count, rows } = await db.Agent.findAndCountAll({
        where,
        order: [['rating', 'DESC'], ['total_sold', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const createAgent = async (data, userId, orgId) => {
    const existing = await db.Agent.findOne({ where: { user_id: userId } });
    if (existing) throw new AppError('CONFLICT', 'Agent profile already exists for this user', 409);
    return db.Agent.create({ ...data, user_id: userId, org_id: orgId });
};

const getAgent = async (id) => {
    const agent = await db.Agent.findByPk(id);
    if (!agent) throw new AppError('NOT_FOUND', 'Agent not found', 404);
    return agent;
};

const updateAgent = async (id, data, userId) => {
    const agent = await db.Agent.findByPk(id);
    if (!agent) throw new AppError('NOT_FOUND', 'Agent not found', 404);
    if (String(agent.user_id) !== String(userId))
        throw new AppError('FORBIDDEN', 'You do not own this agent profile', 403);
    return agent.update(data);
};

const getAgentProperties = async (id, { page, limit }) => {
    const agent = await db.Agent.findByPk(id);
    if (!agent) throw new AppError('NOT_FOUND', 'Agent not found', 404);
    const { count, rows } = await db.Property.findAndCountAll({
        where: { agent_id: id, status: 'active' },
        order: [['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

// ─── Viewings ─────────────────────────────────────────────────────────────────

const requestViewing = async (data, userId) => {
    const property = await db.Property.findByPk(data.property_id);
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404);
    return db.Viewing.create({ ...data, requester_id: userId });
};

const listViewings = async ({ page, limit, orgId, userId, role }) => {
    const where = {};
    if (role === 'admin' || role === 'owner') {
        // org-scoped: show all viewings for properties in this org
        const orgProps = await db.Property.findAll({ where: { org_id: orgId }, attributes: ['id'] });
        where.property_id = { [Op.in]: orgProps.map(p => p.id) };
    } else {
        where.requester_id = userId;
    }
    const { count, rows } = await db.Viewing.findAndCountAll({
        where,
        include: [{ model: db.Property, as: 'property', attributes: ['id', 'title', 'city', 'price'] }],
        order: [['scheduled_at', 'ASC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const getViewing = async (id, userId) => {
    const viewing = await db.Viewing.findByPk(id, {
        include: [{ model: db.Property, as: 'property' }],
    });
    if (!viewing) throw new AppError('NOT_FOUND', 'Viewing not found', 404);
    if (String(viewing.requester_id) !== String(userId) &&
        String(viewing.agent_id) !== String(userId)) {
        throw new AppError('FORBIDDEN', 'Access denied', 403);
    }
    return viewing;
};

const updateViewing = async (id, data, userId) => {
    const viewing = await db.Viewing.findByPk(id);
    if (!viewing) throw new AppError('NOT_FOUND', 'Viewing not found', 404);
    if (String(viewing.requester_id) !== String(userId) &&
        String(viewing.agent_id) !== String(userId)) {
        throw new AppError('FORBIDDEN', 'Access denied', 403);
    }
    return viewing.update(data);
};

// ─── Inquiries ────────────────────────────────────────────────────────────────

const submitInquiry = async (data, userId, orgId) => {
    const property = await db.Property.findByPk(data.property_id);
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404);
    const inquiry = await db.Inquiry.create({
        ...data,
        requester_id: userId || null,
        org_id: orgId || null,
    });
    await property.increment('inquiries_count');
    return inquiry;
};

const listInquiries = async ({ page, limit, orgId, property_id, status }) => {
    const where = {};
    if (orgId) where.org_id = orgId;
    if (property_id) where.property_id = property_id;
    if (status) where.status = status;
    const { count, rows } = await db.Inquiry.findAndCountAll({
        where,
        include: [{ model: db.Property, as: 'property', attributes: ['id', 'title', 'city'] }],
        order: [['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

const getInquiry = async (id) => {
    const inquiry = await db.Inquiry.findByPk(id, {
        include: [{ model: db.Property, as: 'property' }],
    });
    if (!inquiry) throw new AppError('NOT_FOUND', 'Inquiry not found', 404);
    return inquiry;
};

const updateInquiry = async (id, data) => {
    const inquiry = await db.Inquiry.findByPk(id);
    if (!inquiry) throw new AppError('NOT_FOUND', 'Inquiry not found', 404);
    const updates = { ...data };
    if (data.status === 'responded' && data.response) {
        updates.responded_at = new Date();
        if (inquiry.status === 'new') updates.status = 'responded';
    }
    return inquiry.update(updates);
};

// ─── Favorites ────────────────────────────────────────────────────────────────

const toggleFavorite = async (propertyId, userId) => {
    const property = await db.Property.findByPk(propertyId);
    if (!property) throw new AppError('NOT_FOUND', 'Property not found', 404);

    const existing = await db.Favorite.findOne({ where: { user_id: userId, property_id: propertyId } });
    if (existing) {
        await existing.destroy();
        return { favorited: false };
    }
    await db.Favorite.create({ user_id: userId, property_id: propertyId });
    return { favorited: true };
};

const listFavorites = async (userId, { page, limit }) => {
    const { count, rows } = await db.Favorite.findAndCountAll({
        where: { user_id: userId },
        include: [{ model: db.Property, as: 'property' }],
        order: [['created_at', 'DESC']],
        ...paginate(page, limit),
    });
    return { total: count, page, limit, items: rows };
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getListingAnalytics = async (orgId) => {
    const [total, active, underOffer, sold, rented, totalViews, totalInquiries] = await Promise.all([
        db.Property.count({ where: { org_id: orgId } }),
        db.Property.count({ where: { org_id: orgId, status: 'active' } }),
        db.Property.count({ where: { org_id: orgId, status: 'under_offer' } }),
        db.Property.count({ where: { org_id: orgId, status: 'sold' } }),
        db.Property.count({ where: { org_id: orgId, status: 'rented' } }),
        db.Property.sum('views_count', { where: { org_id: orgId } }),
        db.Property.sum('inquiries_count', { where: { org_id: orgId } }),
    ]);
    return {
        total_listings: total,
        active_listings: active,
        under_offer: underOffer,
        sold: sold,
        rented: rented,
        total_views: totalViews || 0,
        total_inquiries: totalInquiries || 0,
    };
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
