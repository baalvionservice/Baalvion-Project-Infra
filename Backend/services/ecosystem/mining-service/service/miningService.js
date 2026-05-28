const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { AppError } = require('../utils/errors');

// ─── Helpers ────────────────────────────────────────────────────────────────

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

const buildPaginatedResult = (rows, count, page, limit) => ({
    items: rows,
    pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit),
    },
});

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

// ─── Mineral Categories ───────────────────────────────────────────────────────

const listMineralCategories = async () => {
    return db.MineralCategory.findAll({
        include: [{ model: db.MineralListing, as: 'listings', attributes: ['id'], where: { status: 'published' }, required: false }],
        order: [['name', 'ASC']],
    });
};

// ─── Listings ────────────────────────────────────────────────────────────────

const listListings = async ({ orgId, status = 'published', category_id, mineral_name, origin_country, min_price, max_price, search, page, limit }) => {
    const where = {};
    if (orgId) where.org_id = orgId;
    else where.status = status; // public: show published
    if (status && orgId) where.status = status; // org can filter by status
    if (category_id) where.category_id = category_id;
    if (origin_country) where.origin_country = origin_country;
    if (mineral_name) where.mineral_name = { [Op.iLike]: `%${mineral_name}%` };
    if (search) where.title = { [Op.iLike]: `%${search}%` };
    if (min_price) where.price_per_unit = { ...where.price_per_unit, [Op.gte]: min_price };
    if (max_price) where.price_per_unit = { ...where.price_per_unit, [Op.lte]: max_price };

    const { rows, count } = await db.MineralListing.findAndCountAll({
        where,
        include: [{ model: db.MineralCategory, as: 'category', attributes: ['id', 'name'] }],
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const getListingById = async (id) => {
    const listing = await db.MineralListing.findByPk(id, {
        include: [{ model: db.MineralCategory, as: 'category' }],
    });
    if (!listing) throw new AppError('NOT_FOUND', 'Listing not found', 404);
    return listing;
};

const createListing = async (orgId, sellerId, data) => {
    const listing = await db.MineralListing.create({
        ...data,
        org_id: orgId,
        seller_id: sellerId,
    });
    return getListingById(listing.id);
};

const updateListing = async (id, orgId, sellerId, data) => {
    const listing = await db.MineralListing.findOne({ where: { id, org_id: orgId } });
    if (!listing) throw new AppError('NOT_FOUND', 'Listing not found', 404);
    if (String(listing.seller_id) !== String(sellerId)) throw new AppError('FORBIDDEN', 'You do not own this listing', 403);
    await listing.update(data);
    return getListingById(listing.id);
};

const deleteListing = async (id, orgId, sellerId) => {
    const listing = await db.MineralListing.findOne({ where: { id, org_id: orgId } });
    if (!listing) throw new AppError('NOT_FOUND', 'Listing not found', 404);
    if (String(listing.seller_id) !== String(sellerId)) throw new AppError('FORBIDDEN', 'You do not own this listing', 403);
    await listing.destroy();
    return { deleted: true };
};

const publishListing = async (id, orgId, sellerId) => {
    const listing = await db.MineralListing.findOne({ where: { id, org_id: orgId } });
    if (!listing) throw new AppError('NOT_FOUND', 'Listing not found', 404);
    if (String(listing.seller_id) !== String(sellerId)) throw new AppError('FORBIDDEN', 'You do not own this listing', 403);
    if (listing.status === 'published') throw new AppError('CONFLICT', 'Listing is already published', 409);
    await listing.update({ status: 'published' });
    return getListingById(listing.id);
};

// ─── RFQs ────────────────────────────────────────────────────────────────────

const listRfqs = async ({ orgId, status, page, limit }) => {
    const where = { org_id: orgId };
    if (status) where.status = status;

    const { rows, count } = await db.Rfq.findAndCountAll({
        where,
        include: [{ model: db.MineralListing, as: 'listing', attributes: ['id', 'title', 'mineral_name'] }],
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const getRfqById = async (id, orgId) => {
    const rfq = await db.Rfq.findOne({
        where: { id, org_id: orgId },
        include: [
            { model: db.MineralListing, as: 'listing' },
            { model: db.RfqBid, as: 'bids' },
        ],
    });
    if (!rfq) throw new AppError('NOT_FOUND', 'RFQ not found', 404);
    return rfq;
};

const createRfq = async (orgId, buyerId, data) => {
    if (data.listing_id) {
        const listing = await db.MineralListing.findByPk(data.listing_id);
        if (!listing) throw new AppError('NOT_FOUND', 'Listing not found', 404);
    }
    const rfq = await db.Rfq.create({ ...data, org_id: orgId, buyer_id: buyerId });
    return getRfqById(rfq.id, orgId);
};

const updateRfq = async (id, orgId, buyerId, data) => {
    const rfq = await db.Rfq.findOne({ where: { id, org_id: orgId } });
    if (!rfq) throw new AppError('NOT_FOUND', 'RFQ not found', 404);
    if (String(rfq.buyer_id) !== String(buyerId)) throw new AppError('FORBIDDEN', 'You do not own this RFQ', 403);
    await rfq.update(data);
    return getRfqById(rfq.id, orgId);
};

// ─── Bids ────────────────────────────────────────────────────────────────────

const listRfqBids = async (rfqId, orgId) => {
    // Verify RFQ exists and belongs to org
    const rfq = await db.Rfq.findOne({ where: { id: rfqId, org_id: orgId } });
    if (!rfq) throw new AppError('NOT_FOUND', 'RFQ not found', 404);

    return db.RfqBid.findAll({
        where: { rfq_id: rfqId },
        order: [['created_at', 'DESC']],
    });
};

const submitBid = async (rfqId, orgId, sellerId, data) => {
    const rfq = await db.Rfq.findByPk(rfqId);
    if (!rfq) throw new AppError('NOT_FOUND', 'RFQ not found', 404);
    if (rfq.status !== 'open') throw new AppError('VALIDATION_ERROR', 'RFQ is not open for bids', 422);

    // Prevent bidding on own RFQ
    if (String(rfq.buyer_id) === String(sellerId)) {
        throw new AppError('FORBIDDEN', 'You cannot bid on your own RFQ', 403);
    }

    // Prevent duplicate bid
    const existing = await db.RfqBid.findOne({ where: { rfq_id: rfqId, seller_id: sellerId } });
    if (existing) throw new AppError('CONFLICT', 'You have already submitted a bid on this RFQ', 409);

    const bid = await db.RfqBid.create({ ...data, rfq_id: rfqId, seller_id: sellerId, org_id: orgId });
    return bid;
};

const updateBid = async (rfqId, bidId, orgId, buyerId, data) => {
    const rfq = await db.Rfq.findOne({ where: { id: rfqId, org_id: orgId } });
    if (!rfq) throw new AppError('NOT_FOUND', 'RFQ not found', 404);
    if (String(rfq.buyer_id) !== String(buyerId)) throw new AppError('FORBIDDEN', 'Only the RFQ owner can accept/reject bids', 403);

    const bid = await db.RfqBid.findOne({ where: { id: bidId, rfq_id: rfqId } });
    if (!bid) throw new AppError('NOT_FOUND', 'Bid not found', 404);

    await bid.update(data);

    // If accepted, close other bids and award the RFQ
    if (data.status === 'accepted') {
        await db.RfqBid.update(
            { status: 'rejected' },
            { where: { rfq_id: rfqId, id: { [Op.ne]: bidId } } }
        );
        await rfq.update({ status: 'awarded' });
    }

    return bid;
};

// ─── Orders ──────────────────────────────────────────────────────────────────

const listOrders = async ({ orgId, status, payment_status, buyer_id, seller_id, page, limit }) => {
    const where = { org_id: orgId };
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (buyer_id) where.buyer_id = buyer_id;
    if (seller_id) where.seller_id = seller_id;

    const { rows, count } = await db.Order.findAndCountAll({
        where,
        include: [
            { model: db.MineralListing, as: 'listing', attributes: ['id', 'title', 'mineral_name'] },
        ],
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const getOrderById = async (id, orgId) => {
    const order = await db.Order.findOne({
        where: { id, org_id: orgId },
        include: [
            { model: db.MineralListing, as: 'listing' },
            { model: db.RfqBid, as: 'bid' },
            { model: db.LogisticsShipment, as: 'shipments' },
            { model: db.Dispute, as: 'disputes' },
        ],
    });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    return order;
};

const createOrder = async (orgId, buyerId, data) => {
    const total_amount = Number(data.unit_price) * Number(data.quantity);
    const order = await db.Order.create({
        ...data,
        org_id: orgId,
        buyer_id: buyerId,
        total_amount,
        order_number: generateOrderNumber(),
    });
    return getOrderById(order.id, orgId);
};

const updateOrder = async (id, orgId, data) => {
    const order = await db.Order.findOne({ where: { id, org_id: orgId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    await order.update(data);
    return getOrderById(order.id, orgId);
};

const confirmOrder = async (id, orgId) => {
    const order = await db.Order.findOne({ where: { id, org_id: orgId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (order.status !== 'pending') throw new AppError('CONFLICT', 'Only pending orders can be confirmed', 409);
    await order.update({ status: 'confirmed', confirmed_at: new Date() });
    return getOrderById(order.id, orgId);
};

const cancelOrder = async (id, orgId) => {
    const order = await db.Order.findOne({ where: { id, org_id: orgId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (['completed', 'delivered'].includes(order.status)) {
        throw new AppError('CONFLICT', 'Cannot cancel a delivered or completed order', 409);
    }
    await order.update({ status: 'cancelled' });
    return getOrderById(order.id, orgId);
};

// ─── Logistics ────────────────────────────────────────────────────────────────

const listShipments = async ({ orgId, status, order_id, page, limit }) => {
    const where = { org_id: orgId };
    if (status) where.status = status;
    if (order_id) where.order_id = order_id;

    const { rows, count } = await db.LogisticsShipment.findAndCountAll({
        where,
        include: [{ model: db.Order, as: 'order', attributes: ['id', 'order_number', 'status'] }],
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const getShipmentById = async (id, orgId) => {
    const shipment = await db.LogisticsShipment.findOne({
        where: { id, org_id: orgId },
        include: [{ model: db.Order, as: 'order' }],
    });
    if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
    return shipment;
};

const createShipment = async (orgId, data) => {
    const order = await db.Order.findOne({ where: { id: data.order_id, org_id: orgId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);

    const shipment = await db.LogisticsShipment.create({ ...data, org_id: orgId });
    // Update order status to in_transit
    if (order.status === 'confirmed') {
        await order.update({ status: 'in_transit', shipped_at: new Date() });
    }
    return getShipmentById(shipment.id, orgId);
};

const updateShipment = async (id, orgId, data) => {
    const shipment = await db.LogisticsShipment.findOne({ where: { id, org_id: orgId } });
    if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);
    await shipment.update(data);

    // If delivered, update the order
    if (data.status === 'delivered') {
        const order = await db.Order.findOne({ where: { id: shipment.order_id, org_id: orgId } });
        if (order) await order.update({ status: 'delivered', delivered_at: new Date() });
    }

    return getShipmentById(shipment.id, orgId);
};

const addCheckpoint = async (id, orgId, checkpointData) => {
    const shipment = await db.LogisticsShipment.findOne({ where: { id, org_id: orgId } });
    if (!shipment) throw new AppError('NOT_FOUND', 'Shipment not found', 404);

    const checkpoint = {
        ...checkpointData,
        timestamp: checkpointData.timestamp || new Date().toISOString(),
        id: uuidv4(),
    };

    const updatedCheckpoints = [...(shipment.checkpoints || []), checkpoint];
    await shipment.update({ checkpoints: updatedCheckpoints });
    return getShipmentById(shipment.id, orgId);
};

// ─── Warehouses ───────────────────────────────────────────────────────────────

const listWarehouses = async ({ orgId, status, country, page, limit }) => {
    const where = { org_id: orgId };
    if (status) where.status = status;
    if (country) where.country = country;

    const { rows, count } = await db.Warehouse.findAndCountAll({
        where,
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const createWarehouse = async (orgId, data) => {
    return db.Warehouse.create({ ...data, org_id: orgId });
};

const updateWarehouse = async (id, orgId, data) => {
    const warehouse = await db.Warehouse.findOne({ where: { id, org_id: orgId } });
    if (!warehouse) throw new AppError('NOT_FOUND', 'Warehouse not found', 404);
    await warehouse.update(data);
    return warehouse.reload();
};

// ─── Disputes ────────────────────────────────────────────────────────────────

const listDisputes = async ({ orgId, status, order_id, page, limit }) => {
    const where = { org_id: orgId };
    if (status) where.status = status;
    if (order_id) where.order_id = order_id;

    const { rows, count } = await db.Dispute.findAndCountAll({
        where,
        include: [{ model: db.Order, as: 'order', attributes: ['id', 'order_number', 'status'] }],
        ...paginate(page, limit),
        order: [['created_at', 'DESC']],
    });

    return buildPaginatedResult(rows, count, page, limit);
};

const getDisputeById = async (id, orgId) => {
    const dispute = await db.Dispute.findOne({
        where: { id, org_id: orgId },
        include: [{ model: db.Order, as: 'order' }],
    });
    if (!dispute) throw new AppError('NOT_FOUND', 'Dispute not found', 404);
    return dispute;
};

const createDispute = async (orgId, raisedBy, data) => {
    const order = await db.Order.findOne({ where: { id: data.order_id, org_id: orgId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);

    const dispute = await db.Dispute.create({ ...data, org_id: orgId, raised_by: raisedBy });

    // Mark order as disputed
    await order.update({ status: 'disputed' });

    return getDisputeById(dispute.id, orgId);
};

const updateDispute = async (id, orgId, userId, data) => {
    const dispute = await db.Dispute.findOne({ where: { id, org_id: orgId } });
    if (!dispute) throw new AppError('NOT_FOUND', 'Dispute not found', 404);

    const updates = { ...data };
    if (data.status === 'resolved' || data.status === 'closed') {
        updates.resolved_by = userId;
        updates.resolved_at = new Date();
    }

    await dispute.update(updates);
    return getDisputeById(dispute.id, orgId);
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getTradeAnalytics = async (orgId) => {
    const [orderStats, topListings, disputeStats, shipmentStats] = await Promise.all([
        db.Order.findAll({
            where: { org_id: orgId },
            attributes: [
                'status',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
                [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total_value'],
            ],
            group: ['status'],
            raw: true,
        }),
        db.Order.findAll({
            where: { org_id: orgId, status: 'completed' },
            attributes: [
                'listing_id',
                [db.sequelize.fn('COUNT', db.sequelize.col('Order.id')), 'order_count'],
                [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'revenue'],
            ],
            include: [{ model: db.MineralListing, as: 'listing', attributes: ['title', 'mineral_name'] }],
            group: ['Order.listing_id', 'listing.id', 'listing.title', 'listing.mineral_name'],
            limit: 5,
            order: [[db.sequelize.literal('revenue'), 'DESC']],
            raw: false,
        }),
        db.Dispute.count({ where: { org_id: orgId, status: 'open' } }),
        db.LogisticsShipment.findAll({
            where: { org_id: orgId },
            attributes: [
                'status',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
            ],
            group: ['status'],
            raw: true,
        }),
    ]);

    const orderMap = {};
    let totalRevenue = 0;
    let totalOrders = 0;
    for (const row of orderStats) {
        orderMap[row.status] = { count: Number(row.count), value: Number(row.total_value || 0) };
        totalOrders += Number(row.count);
        totalRevenue += Number(row.total_value || 0);
    }

    const shipmentMap = {};
    for (const row of shipmentStats) {
        shipmentMap[row.status] = Number(row.count);
    }

    return {
        orders: {
            byStatus: orderMap,
            total: totalOrders,
            totalRevenue,
        },
        openDisputes: disputeStats,
        shipments: { byStatus: shipmentMap },
        topListings,
    };
};

module.exports = {
    listMineralCategories,
    listListings,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
    publishListing,
    listRfqs,
    getRfqById,
    createRfq,
    updateRfq,
    listRfqBids,
    submitBid,
    updateBid,
    listOrders,
    getOrderById,
    createOrder,
    updateOrder,
    confirmOrder,
    cancelOrder,
    listShipments,
    getShipmentById,
    createShipment,
    updateShipment,
    addCheckpoint,
    listWarehouses,
    createWarehouse,
    updateWarehouse,
    listDisputes,
    getDisputeById,
    createDispute,
    updateDispute,
    getTradeAnalytics,
};
