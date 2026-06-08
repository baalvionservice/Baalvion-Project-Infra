'use strict';
const { z } = require('zod');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { OrderEvents } = require('../platform/events');
const { canTransition } = require('../services/orderSaga');

const tenantOf = (req) => (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;

const createSchema = z.object({
    deal_id: z.string().optional(),
    buyer_org_id: z.string().optional(),
    seller_org_id: z.string().optional(),
    lines: z.array(z.object({
        product_id: z.string(), sku: z.string().optional(),
        quantity: z.number().positive(), unit_price: z.number().nonnegative(),
    })).default([]),
    currency: z.string().default('USD'),
});

// F2: reads run inside a tenant transaction so the RLS GUC (app.current_tenant)
// is set; otherwise FORCE RLS returns zero rows on the pooled connection.
const listOrders = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.sequelize.transaction((t) =>
            db.Order.findAndCountAll({ where, limit: Number(limit), offset, order: [['created_at', 'DESC']], transaction: t }));
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) { return next(err); }
};

const getOrder = async (req, res, next) => {
    try {
        const order = await db.sequelize.transaction((t) => db.Order.findByPk(req.params.id, { transaction: t }));
        if (!order) return next(new AppError('NOT_FOUND', 'Order not found', 404));
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

// Atomic: order row + outbox event commit together (R3 / P0-5).
const createOrder = async (req, res, next) => {
    try {
        const body = createSchema.parse(req.body || {});
        const tenantId = tenantOf(req);
        if (!tenantId) return next(new AppError('TENANT_REQUIRED', 'Tenant context required', 400));
        const total = body.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);

        const order = await db.sequelize.transaction(async (t) => {
            const o = await db.Order.create({
                tenant_id: tenantId, deal_id: body.deal_id, buyer_org_id: body.buyer_org_id,
                seller_org_id: body.seller_org_id, lines: body.lines, total_value: total,
                currency: body.currency, status: 'placed', payment_status: 'unpaid',
            }, { transaction: t });
            await db.OutboxEvent.create({
                tenant_id: tenantId, aggregate_type: 'order', aggregate_id: String(o.id),
                event_type: OrderEvents.CREATED,
                payload: { orderId: o.id, buyerOrgId: o.buyer_org_id, sellerOrgId: o.seller_org_id, totalValue: total, currency: o.currency },
            }, { transaction: t });
            await db.OrderSagaState.create({ order_id: String(o.id), tenant_id: tenantId, state: 'CREATED', last_event: OrderEvents.CREATED }, { transaction: t });
            return o;
        });
        return sendSuccess(req, res, order, 201);
    } catch (err) {
        if (err instanceof z.ZodError) return next(new AppError('BAD_REQUEST', err.errors[0].message, 422));
        return next(err);
    }
};

// Confirm-payment kicks the saga by emitting an intent the finance suite consumes.
const confirmPayment = async (req, res, next) => {
    try {
        const tenantId = tenantOf(req);
        const order = await db.sequelize.transaction(async (t) => {
            const o = await db.Order.findByPk(req.params.id, { transaction: t });
            if (!o) throw new AppError('NOT_FOUND', 'Order not found', 404);
            o.payment_status = 'pending';
            await o.save({ transaction: t });
            await db.OutboxEvent.create({
                tenant_id: tenantId, aggregate_type: 'order', aggregate_id: String(o.id),
                event_type: 'gtos.order.payment_requested.v1',
                payload: { orderId: o.id, amount: o.total_value, currency: o.currency },
            }, { transaction: t });
            return o;
        });
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

const getTimeline = async (req, res, next) => {
    try {
        const saga = await db.OrderSagaState.findByPk(String(req.params.id));
        const events = await db.OutboxEvent.findAll({ where: { aggregate_id: String(req.params.id) }, order: [['created_at', 'ASC']] });
        return sendSuccess(req, res, { saga, events });
    } catch (err) { return next(err); }
};

module.exports = { listOrders, getOrder, createOrder, confirmPayment, getTimeline, canTransition };
