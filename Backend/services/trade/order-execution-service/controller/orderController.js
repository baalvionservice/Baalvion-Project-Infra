'use strict';
const { z } = require('zod');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { OrderEvents } = require('../platform/events');
const { canTransition } = require('../services/orderSaga');
const { computeOrderPricing } = require('../services/pricing');
const { screenCounterparties } = require('../services/counterpartyScreening');
const config = require('../config/appConfig');
const fx = require('../providers/fx');

const tenantOf = (req) => (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;

// Platform settlement/base currency for normalization (auditable ledger).
const BASE_CURRENCY = (process.env.BASE_CURRENCY || 'USD').toUpperCase();

const createSchema = z.object({
    deal_id: z.string().optional(),
    buyer_org_id: z.string().optional(),
    seller_org_id: z.string().optional(),
    // Counterparty legal names + ISO country for R8 sanctions screening at placement.
    buyer_name: z.string().optional(),
    seller_name: z.string().optional(),
    buyer_country: z.string().length(2).optional(),
    seller_country: z.string().length(2).optional(),
    lines: z.array(z.object({
        product_id: z.string(), sku: z.string().optional(),
        hs_code: z.string().optional(),
        quantity: z.number().positive(), unit_price: z.number().nonnegative(),
    })).default([]),
    currency: z.string().default('USD'),
    destination_country: z.string().length(2).optional(),
    // NOTE: any client-supplied total is deliberately ignored — the server computes it (R3).
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

        // R8: screen counterparties BEFORE writing any money-truth row. A confirmed (or,
        // by policy, potential) sanctions match refuses the trade; an unreachable engine
        // fails closed by default. The engine persists its own audit row + event.
        let screeningSummary = null;
        if (config.sanctions.enabled) {
            const screening = await screenCounterparties({
                tenantId,
                parties: [
                    { role: 'buyer', name: body.buyer_name, country: body.buyer_country },
                    { role: 'seller', name: body.seller_name, country: body.seller_country },
                ],
            });
            screeningSummary = screening.screened;
            if (screening.decision === 'BLOCK') {
                const why = screening.blocked.map((b) => `${b.party.role}:${b.reason}`).join(', ');
                return next(new AppError('SANCTIONS_BLOCK', `Order refused — sanctions screening (${why})`, 451));
            }
        }

        // Money truth (R3): resolve the live FX rate (order currency → base), then compute the
        // total server-side. FX failure degrades to a fallback rate (provider is fail-open), it
        // never blocks order placement; the rate used is persisted for audit.
        const currency = String(body.currency || 'USD').toUpperCase();
        let fxRate = 1;
        if (currency !== BASE_CURRENCY) {
            const quote = await fx.getRate(currency, BASE_CURRENCY);
            fxRate = quote.rate;
        }
        const pricing = computeOrderPricing({
            lines: body.lines,
            currency,
            baseCurrency: BASE_CURRENCY,
            destinationCountry: body.destination_country,
            fxRate,
        });

        const order = await db.sequelize.transaction(async (t) => {
            const o = await db.Order.create({
                tenant_id: tenantId, deal_id: body.deal_id, buyer_org_id: body.buyer_org_id,
                seller_org_id: body.seller_org_id, lines: body.lines,
                subtotal: pricing.subtotal, duty_amount: pricing.dutyAmount, tax_amount: pricing.taxAmount,
                total_value: pricing.totalValue, currency: pricing.currency,
                base_currency: pricing.baseCurrency, base_currency_amount: pricing.baseCurrencyAmount,
                fx_rate_used: pricing.fxRateUsed, destination_country: body.destination_country,
                status: 'placed', payment_status: 'unpaid',
            }, { transaction: t });
            await db.OutboxEvent.create({
                tenant_id: tenantId, aggregate_type: 'order', aggregate_id: String(o.id),
                event_type: OrderEvents.CREATED,
                payload: {
                    orderId: o.id, buyerOrgId: o.buyer_org_id, sellerOrgId: o.seller_org_id,
                    totalValue: pricing.totalValue, currency: pricing.currency,
                    baseCurrencyAmount: pricing.baseCurrencyAmount, baseCurrency: pricing.baseCurrency,
                    fxRateUsed: pricing.fxRateUsed,
                    sanctionsScreening: screeningSummary,
                },
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
                // Carry both the order-currency amount and the normalized base amount so the
                // finance suite settles against an auditable figure that matches the order ledger.
                payload: {
                    orderId: o.id, amount: o.total_value, currency: o.currency,
                    baseCurrencyAmount: o.base_currency_amount, baseCurrency: o.base_currency,
                    fxRateUsed: o.fx_rate_used,
                },
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
