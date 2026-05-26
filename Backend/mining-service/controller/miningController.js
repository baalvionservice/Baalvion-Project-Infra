const miningService = require('../service/miningService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');
const {
    createListingSchema,
    updateListingSchema,
    createRfqSchema,
    updateRfqSchema,
    createBidSchema,
    updateBidSchema,
    createOrderSchema,
    updateOrderSchema,
    createShipmentSchema,
    updateShipmentSchema,
    addCheckpointSchema,
    createDisputeSchema,
    updateDisputeSchema,
    createWarehouseSchema,
    updateWarehouseSchema,
    paginationSchema,
} = require('../validators/schemas');

// ─── Helpers ────────────────────────────────────────────────────────────────

const validate = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const details = result.error.flatten().fieldErrors;
        throw new AppError('VALIDATION_ERROR', 'Validation failed', 422, details);
    }
    return result.data;
};

const getPagination = (query) => {
    const { page, limit } = paginationSchema.parse(query);
    return { page, limit };
};

// ─── Mineral Categories ───────────────────────────────────────────────────────

const listMineralCategories = async (req, res, next) => {
    try {
        const data = await miningService.listMineralCategories();
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

// ─── Listings ────────────────────────────────────────────────────────────────

const listListings = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status, category_id, mineral_name, origin_country, min_price, max_price, search } = req.query;
        const orgId = req.auth?.orgId || null;
        const result = await miningService.listListings({ orgId, status, category_id, mineral_name, origin_country, min_price, max_price, search, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getListing = async (req, res, next) => {
    try {
        const listing = await miningService.getListingById(req.params.id);
        listing.increment('views_count').catch(() => {});
        return sendSuccess(req, res, listing);
    } catch (err) { return next(err); }
};

const createListing = async (req, res, next) => {
    try {
        const data = validate(createListingSchema, req.body);
        const listing = await miningService.createListing(req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, listing, 201);
    } catch (err) { return next(err); }
};

const updateListing = async (req, res, next) => {
    try {
        const data = validate(updateListingSchema, req.body);
        const listing = await miningService.updateListing(req.params.id, req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, listing);
    } catch (err) { return next(err); }
};

const deleteListing = async (req, res, next) => {
    try {
        const result = await miningService.deleteListing(req.params.id, req.auth.orgId, req.auth.userId);
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const publishListing = async (req, res, next) => {
    try {
        const listing = await miningService.publishListing(req.params.id, req.auth.orgId, req.auth.userId);
        return sendSuccess(req, res, listing);
    } catch (err) { return next(err); }
};

// ─── RFQs ────────────────────────────────────────────────────────────────────

const listRfqs = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status } = req.query;
        const result = await miningService.listRfqs({ orgId: req.auth.orgId, status, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getRfq = async (req, res, next) => {
    try {
        const rfq = await miningService.getRfqById(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, rfq);
    } catch (err) { return next(err); }
};

const createRfq = async (req, res, next) => {
    try {
        const data = validate(createRfqSchema, req.body);
        const rfq = await miningService.createRfq(req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, rfq, 201);
    } catch (err) { return next(err); }
};

const updateRfq = async (req, res, next) => {
    try {
        const data = validate(updateRfqSchema, req.body);
        const rfq = await miningService.updateRfq(req.params.id, req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, rfq);
    } catch (err) { return next(err); }
};

// ─── Bids ────────────────────────────────────────────────────────────────────

const listRfqBids = async (req, res, next) => {
    try {
        const bids = await miningService.listRfqBids(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, bids);
    } catch (err) { return next(err); }
};

const submitBid = async (req, res, next) => {
    try {
        const data = validate(createBidSchema, req.body);
        const bid = await miningService.submitBid(req.params.id, req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, bid, 201);
    } catch (err) { return next(err); }
};

const updateBid = async (req, res, next) => {
    try {
        const data = validate(updateBidSchema, req.body);
        const bid = await miningService.updateBid(req.params.rfqId, req.params.bidId, req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, bid);
    } catch (err) { return next(err); }
};

// ─── Orders ──────────────────────────────────────────────────────────────────

const listOrders = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status, payment_status, buyer_id, seller_id } = req.query;
        const result = await miningService.listOrders({ orgId: req.auth.orgId, status, payment_status, buyer_id, seller_id, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getOrder = async (req, res, next) => {
    try {
        const order = await miningService.getOrderById(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

const createOrder = async (req, res, next) => {
    try {
        const data = validate(createOrderSchema, req.body);
        const order = await miningService.createOrder(req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, order, 201);
    } catch (err) { return next(err); }
};

const updateOrder = async (req, res, next) => {
    try {
        const data = validate(updateOrderSchema, req.body);
        const order = await miningService.updateOrder(req.params.id, req.auth.orgId, data);
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

const confirmOrder = async (req, res, next) => {
    try {
        const order = await miningService.confirmOrder(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

const cancelOrder = async (req, res, next) => {
    try {
        const order = await miningService.cancelOrder(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

// ─── Logistics ────────────────────────────────────────────────────────────────

const listShipments = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status, order_id } = req.query;
        const result = await miningService.listShipments({ orgId: req.auth.orgId, status, order_id, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const getShipment = async (req, res, next) => {
    try {
        const shipment = await miningService.getShipmentById(req.params.id, req.auth.orgId);
        return sendSuccess(req, res, shipment);
    } catch (err) { return next(err); }
};

const createShipment = async (req, res, next) => {
    try {
        const data = validate(createShipmentSchema, req.body);
        const shipment = await miningService.createShipment(req.auth.orgId, data);
        return sendSuccess(req, res, shipment, 201);
    } catch (err) { return next(err); }
};

const updateShipment = async (req, res, next) => {
    try {
        const data = validate(updateShipmentSchema, req.body);
        const shipment = await miningService.updateShipment(req.params.id, req.auth.orgId, data);
        return sendSuccess(req, res, shipment);
    } catch (err) { return next(err); }
};

const addCheckpoint = async (req, res, next) => {
    try {
        const data = validate(addCheckpointSchema, req.body);
        const shipment = await miningService.addCheckpoint(req.params.id, req.auth.orgId, data);
        return sendSuccess(req, res, shipment);
    } catch (err) { return next(err); }
};

// ─── Warehouses ───────────────────────────────────────────────────────────────

const listWarehouses = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status, country } = req.query;
        const result = await miningService.listWarehouses({ orgId: req.auth.orgId, status, country, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const createWarehouse = async (req, res, next) => {
    try {
        const data = validate(createWarehouseSchema, req.body);
        const warehouse = await miningService.createWarehouse(req.auth.orgId, data);
        return sendSuccess(req, res, warehouse, 201);
    } catch (err) { return next(err); }
};

const updateWarehouse = async (req, res, next) => {
    try {
        const data = validate(updateWarehouseSchema, req.body);
        const warehouse = await miningService.updateWarehouse(req.params.id, req.auth.orgId, data);
        return sendSuccess(req, res, warehouse);
    } catch (err) { return next(err); }
};

// ─── Disputes ────────────────────────────────────────────────────────────────

const listDisputes = async (req, res, next) => {
    try {
        const { page, limit } = getPagination(req.query);
        const { status, order_id } = req.query;
        const result = await miningService.listDisputes({ orgId: req.auth.orgId, status, order_id, page, limit });
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const createDispute = async (req, res, next) => {
    try {
        const data = validate(createDisputeSchema, req.body);
        const dispute = await miningService.createDispute(req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, dispute, 201);
    } catch (err) { return next(err); }
};

const updateDispute = async (req, res, next) => {
    try {
        const data = validate(updateDisputeSchema, req.body);
        const dispute = await miningService.updateDispute(req.params.id, req.auth.orgId, req.auth.userId, data);
        return sendSuccess(req, res, dispute);
    } catch (err) { return next(err); }
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getTradeAnalytics = async (req, res, next) => {
    try {
        const data = await miningService.getTradeAnalytics(req.auth.orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = {
    listMineralCategories,
    listListings, getListing, createListing, updateListing, deleteListing, publishListing,
    listRfqs, getRfq, createRfq, updateRfq,
    listRfqBids, submitBid, updateBid,
    listOrders, getOrder, createOrder, updateOrder, confirmOrder, cancelOrder,
    listShipments, getShipment, createShipment, updateShipment, addCheckpoint,
    listWarehouses, createWarehouse, updateWarehouse,
    listDisputes, createDispute, updateDispute,
    getTradeAnalytics,
};
