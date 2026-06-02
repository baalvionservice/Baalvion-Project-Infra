'use strict';
const crypto = require('crypto');
const { Op, QueryTypes } = require('sequelize');
const { OrdersOrder, OrdersOrderItem, OrdersOrderPayment, OrdersInvoice, OrdersCustomer, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const { getProvider } = require('./paymentProvider');
const config = require('../config/appConfig');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const ownership = require('./ownership');
const securityAudit = require('./securityAudit');
const ledgerClient = require('./ledgerClient');
const discountService = require('./discountService');

// Mirror a money movement into the double-entry ledger without ever letting a ledger
// problem break the payment path (the client already fails-open + logs internally).
async function safeLedger(fn, ctx) {
    try { await fn(); }
    catch (e) { console.error(JSON.stringify({ evt: 'ledger.mirror_error', ...ctx, error: e.message })); }
}

function generateOrderNumber(storeCode = 'ORD') {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${storeCode}-${ts}-${rand}`;
}

// An order is owned by the user behind its customer record (order.customerId → customer.userId).
// Guest orders (no customerId) have no resolvable owner → only store staff may access them.
async function orderOwnerUserId(customerId) {
    if (!customerId) return null;
    const c = await OrdersCustomer.findByPk(customerId, { attributes: ['userId'] });
    return c ? c.userId : null;
}

async function listOrders(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.status) where.status = Array.isArray(query.status) ? { [Op.in]: query.status } : query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.fulfillmentStatus) where.fulfillmentStatus = query.fulfillmentStatus;
    if (query.customerId) where.customerId = query.customerId;
    if (query.search) where.orderNumber = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await OrdersOrder.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
        include: [{ model: OrdersOrderItem, as: 'items' }],
    });
    return buildPaginated(rows, count, { page, limit });
}

async function getOrder(storeId, orderId, actor) {
    let data = await cache.get(cache.keys.order(orderId));
    if (!(data && data.storeId === storeId)) {
        const order = await OrdersOrder.findOne({
            where: { id: orderId, storeId },
            include: [
                { model: OrdersOrderItem, as: 'items' },
                { model: OrdersOrderPayment, as: 'payments' },
                { model: OrdersInvoice, as: 'invoice' },
            ],
        });
        if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
        data = order.toJSON();
        await cache.set(cache.keys.order(orderId), data, config.cache.orderTtl);
    }
    // Customer-ownership enforcement (owner OR store staff). Applies on cache hit and miss.
    await ownership.enforce(actor, await orderOwnerUserId(data.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'order.read' });
    return data;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * AUTHORITATIVE product/price validation. order-service and commerce-service share one
 * Postgres DB (different schemas), so we read commerce's tables directly (no new infra).
 * For each line: the product must exist in THIS store and be published; an active variant
 * is resolved (specified, else default); the unit price + tax come from store pricing
 * (commerce_product_pricing window) or the variant base price. Client monetary fields are
 * IGNORED. NOTE: stock/inventory is NOT in commerce (it is warehouse-scoped in
 * inventory-service), so oversell is not validated here — see hardening notes.
 */
async function resolveAuthoritativeItems(storeId, items) {
    const resolved = [];
    for (const i of items) {
        const productId = i.productId;
        const variantId = i.variantId || null;
        if (!productId || !UUID_RE.test(String(productId))) {
            throw new AppError('VALIDATION_ERROR', 'Each item must reference a valid productId', 400);
        }
        if (variantId && !UUID_RE.test(String(variantId))) {
            throw new AppError('VALIDATION_ERROR', `Invalid variantId for product ${productId}`, 400);
        }
        if (!Number.isInteger(i.quantity) || i.quantity < 1) {
            throw new AppError('VALIDATION_ERROR', `Invalid quantity for product ${productId}`, 400);
        }

        const [product] = await sequelize.query(
            `SELECT id, name, status, store_id FROM commerce.commerce_products WHERE id = :productId AND store_id = :storeId LIMIT 1`,
            { replacements: { productId, storeId }, type: QueryTypes.SELECT },
        );
        if (!product) throw new AppError('VALIDATION_ERROR', `Product ${productId} not found in this store`, 400);
        if (product.status !== 'published') throw new AppError('VALIDATION_ERROR', `Product ${productId} is not purchasable`, 400);

        const variants = await sequelize.query(
            variantId
                ? `SELECT id, sku, name, price, is_active FROM commerce.commerce_product_variants WHERE id = :variantId AND product_id = :productId LIMIT 1`
                : `SELECT id, sku, name, price, is_active FROM commerce.commerce_product_variants WHERE product_id = :productId AND is_active = true ORDER BY is_default DESC, sort_order ASC LIMIT 1`,
            { replacements: { productId, variantId }, type: QueryTypes.SELECT },
        );
        const variant = variants[0];
        if (!variant) throw new AppError('VALIDATION_ERROR', `No purchasable variant for product ${productId}`, 400);
        if (variant.is_active === false) throw new AppError('VALIDATION_ERROR', `Variant ${variant.id} is inactive`, 400);

        const [pricing] = await sequelize.query(
            `SELECT price, tax_rate FROM commerce.commerce_product_pricing
               WHERE variant_id = :variantId AND store_id = :storeId AND is_active = true
                 AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now())
               ORDER BY starts_at DESC NULLS LAST LIMIT 1`,
            { replacements: { variantId: variant.id, storeId }, type: QueryTypes.SELECT },
        );

        const unitPrice = Number(pricing ? pricing.price : variant.price);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new AppError('VALIDATION_ERROR', `No valid price for variant ${variant.id}`, 400);
        }
        const taxRate = Number((pricing && pricing.tax_rate) || 0);
        const lineTax = Number(((unitPrice * i.quantity) * (taxRate / 100)).toFixed(2));

        resolved.push({
            productId, variantId: variant.id, sku: variant.sku,
            name: product.name, variantName: variant.name || null,
            quantity: i.quantity, price: unitPrice, compareAtPrice: null,
            taxAmount: lineTax, metadata: i.metadata || {},
        });
    }
    return resolved;
}

/**
 * Reserve stock for each item INSIDE the order transaction (Phase 1 — minimal, production-safe).
 * Reads inventory.inventory_stock (shared DB), sums available across the variant's rows under
 * FOR UPDATE row locks (DB-level concurrency safety — NOT a distributed lock), then increments
 * reserved_quantity greedily. Items with NO stock rows are treated as "inventory not tracked"
 * and allowed (logged) — safest fallback so untracked products remain sellable. Throws
 * OUT_OF_STOCK (409) on insufficient stock, which rolls back the whole order transaction.
 */
async function reserveInventory(t, storeId, items) {
    for (const i of items) {
        const rows = await sequelize.query(
            `SELECT id, quantity, reserved_quantity FROM inventory.inventory_stock
               WHERE store_id = :storeId AND ${i.variantId ? 'variant_id = :variantId' : 'product_id = :productId AND variant_id IS NULL'}
               ORDER BY (quantity - reserved_quantity) DESC
               FOR UPDATE`,
            { replacements: { storeId, variantId: i.variantId, productId: i.productId }, type: QueryTypes.SELECT, transaction: t },
        );
        if (rows.length === 0) {
            console.warn(JSON.stringify({ evt: 'inventory.untracked', storeId, productId: i.productId, variantId: i.variantId }));
            continue; // not tracked → allow (documented fallback)
        }
        const available = rows.reduce((s, r) => s + (Number(r.quantity) - Number(r.reserved_quantity)), 0);
        if (available < i.quantity) {
            throw new AppError('OUT_OF_STOCK', `Insufficient stock for ${i.sku || i.productId} (need ${i.quantity}, have ${available})`, 409);
        }
        let remaining = i.quantity;
        for (const r of rows) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, Number(r.quantity) - Number(r.reserved_quantity));
            if (take <= 0) continue;
            await sequelize.query(
                `UPDATE inventory.inventory_stock SET reserved_quantity = reserved_quantity + :take, updated_at = now() WHERE id = :id`,
                { replacements: { take, id: r.id }, type: QueryTypes.UPDATE, transaction: t },
            );
            remaining -= take;
        }
    }
}

async function createOrder(storeId, body, actor) {
    const { customerId, currencyCode = 'USD', shippingAmount = 0, discountCode, notes, billingAddress, shippingAddress, metadata = {}, idempotencyKey } = body;

    if (!body.items || !body.items.length) throw new AppError('VALIDATION_ERROR', 'Order must have at least one item', 400);

    // Ownership: a caller may only place an order AS a customer they own. (Staff may place on
    // behalf of any customer.) Prevents attributing an order to someone else's customer record.
    if (customerId) {
        const cust = await OrdersCustomer.findOne({ where: { id: customerId, storeId }, attributes: ['id', 'userId'] });
        if (!cust) throw new AppError('VALIDATION_ERROR', 'customerId not found in this store', 400);
        await ownership.enforce(actor, cust.userId, { resourceType: 'customer', resourceId: customerId, storeId, action: 'order.create' });
    }

    // ── Idempotency / replay safety (Phase 4) ───────────────────────────────────
    // A repeated submit with the same key returns the original order instead of duplicating.
    if (idempotencyKey) {
        const [existing] = await sequelize.query(
            `SELECT id FROM orders.orders_orders WHERE store_id = :storeId AND metadata->>'idempotencyKey' = :key LIMIT 1`,
            { replacements: { storeId, key: String(idempotencyKey) }, type: QueryTypes.SELECT },
        );
        if (existing) {
            console.info(JSON.stringify({ evt: 'order.idempotent_replay', storeId, orderId: existing.id }));
            const found = await OrdersOrder.findByPk(existing.id);
            return found.toJSON();
        }
    }

    // ── Authoritative pricing + product validation (Phase 1) ────────────────────
    // Client price/subtotal/total/discount/tax are IGNORED. Every line price + tax is
    // re-derived from commerce-service data; all totals are recomputed server-side.
    const items = await resolveAuthoritativeItems(storeId, body.items);

    const shipping = Number(shippingAmount);
    if (!Number.isFinite(shipping) || shipping < 0) {
        throw new AppError('VALIDATION_ERROR', 'shippingAmount must be a non-negative number', 400);
    }

    const subtotal = Number(items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2));
    const taxAmount = Number(items.reduce((s, i) => s + i.taxAmount, 0).toFixed(2));
    const orderNumber = generateOrderNumber();

    const order = await sequelize.transaction(async (t) => {
        // Server-authoritative discount: the code is validated + computed from commerce data and a
        // usage slot is atomically claimed within this txn (rolls back with the order on failure).
        const promo = await discountService.applyDiscount(t, storeId, discountCode, subtotal, shipping);
        const totalAmount = Number((subtotal + shipping + taxAmount - promo.discountAmount).toFixed(2));

        const o = await OrdersOrder.create({
            storeId, customerId, orderNumber, currencyCode,
            subtotal, discountAmount: promo.discountAmount, shippingAmount: shipping, taxAmount, totalAmount,
            discountCode: promo.code || discountCode || null, notes,
            metadata: { ...metadata, ...(promo.discountId ? { discountId: promo.discountId } : {}), ...(idempotencyKey ? { idempotencyKey: String(idempotencyKey) } : {}) },
            billingAddress, shippingAddress,
            // Never auto-paid — payment is confirmed only by the backend recordPayment path.
            status: 'pending', fulfillmentStatus: 'unfulfilled', paymentStatus: 'pending',
        }, { transaction: t });

        const orderItems = items.map(i => ({
            orderId: o.id,
            productId: i.productId,
            variantId: i.variantId,
            sku: i.sku,
            name: i.name,
            variantName: i.variantName,
            quantity: i.quantity,
            price: i.price,
            compareAtPrice: i.compareAtPrice,
            total: Number((i.price * i.quantity).toFixed(2)),
            taxAmount: i.taxAmount,
            fulfillableQuantity: i.quantity,
            metadata: i.metadata,
        }));
        await OrdersOrderItem.bulkCreate(orderItems, { transaction: t });

        // Phase 1: reserve stock atomically (row-locked); throws OUT_OF_STOCK → rolls back the order.
        await reserveInventory(t, storeId, items);

        if (customerId) await OrdersCustomer.increment({ totalOrders: 1, totalSpent: totalAmount }, { where: { id: customerId }, transaction: t });
        return o;
    });

    // Phase 6: structured audit log (orderNumber is the cross-service correlation handle).
    console.info(JSON.stringify({ evt: 'order.created', storeId, orderId: order.id, orderNumber, totalAmount: Number(order.totalAmount), discountAmount: Number(order.discountAmount), currencyCode, lineCount: items.length }));
    return order.toJSON();
}

async function updateOrderStatus(storeId, orderId, status, userId) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    const allowed = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: ['refunded'],
    };
    if (allowed[order.status] && !allowed[order.status].includes(status)) {
        throw new AppError('CONFLICT', `Cannot transition from ${order.status} to ${status}`, 409);
    }
    const updates = { status };
    if (status === 'cancelled') { updates.cancelledAt = new Date(); updates.cancelReason = 'Manual cancellation'; }
    await order.update(updates);
    await cache.del(cache.keys.order(orderId));
    return order.toJSON();
}

/**
 * Unwind an order's stock reservation (Phase 3). mode='release' (cancel/fail → free reserved)
 * or 'fulfill' (capture → convert reserved into a real deduction). Decrements are bounded by
 * each row's reserved_quantity (FOR UPDATE), so stock never goes negative — aligns with the
 * CHECK constraints. Reservation events are structured-logged; durable inventory_movements
 * rows are a follow-up (that table's enum is quantity-movement oriented, no reserve/release type).
 */
async function unwindReservation(t, storeId, orderId, mode) {
    const items = await OrdersOrderItem.findAll({ where: { orderId }, attributes: ['productId', 'variantId', 'quantity'], transaction: t });
    for (const it of items) {
        if (!it.productId) continue;
        const rows = await sequelize.query(
            `SELECT id, reserved_quantity FROM inventory.inventory_stock
               WHERE store_id = :storeId AND ${it.variantId ? 'variant_id = :variantId' : 'product_id = :productId AND variant_id IS NULL'}
               ORDER BY reserved_quantity DESC FOR UPDATE`,
            { replacements: { storeId, variantId: it.variantId || null, productId: it.productId }, type: QueryTypes.SELECT, transaction: t },
        );
        let remaining = it.quantity;
        for (const r of rows) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, Number(r.reserved_quantity));
            if (take <= 0) continue;
            const sql = mode === 'fulfill'
                ? `UPDATE inventory.inventory_stock SET quantity = quantity - :take, reserved_quantity = reserved_quantity - :take, updated_at = now() WHERE id = :id`
                : `UPDATE inventory.inventory_stock SET reserved_quantity = reserved_quantity - :take, updated_at = now() WHERE id = :id`;
            await sequelize.query(sql, { replacements: { take, id: r.id }, type: QueryTypes.UPDATE, transaction: t });
            remaining -= take;
        }
    }
    console.info(JSON.stringify({ evt: mode === 'fulfill' ? 'inventory.fulfilled' : 'inventory.released', storeId, orderId, lineCount: items.length }));
}

async function cancelOrder(storeId, orderId, reason) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (['delivered', 'refunded', 'cancelled'].includes(order.status)) throw new AppError('CONFLICT', `Cannot cancel a ${order.status} order`, 409);
    await sequelize.transaction(async (t) => {
        await order.update({ status: 'cancelled', cancelledAt: new Date(), cancelReason: reason }, { transaction: t });
        await unwindReservation(t, storeId, orderId, 'release'); // Phase 3: free reserved stock
    });
    await cache.del(cache.keys.order(orderId));
    return order.toJSON();
}

// Manual/admin payment recording (e.g. bank transfer). Hardened with a duplicate-capture guard.
async function recordPayment(storeId, orderId, body) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (body.transactionId) {
        const dupe = await OrdersOrderPayment.findOne({ where: { orderId, transactionId: body.transactionId } });
        if (dupe) {
            securityAudit.payment('duplicate', 'deny', { storeId, resource: { type: 'order', id: orderId }, reason: 'duplicate_transaction', metadata: { transactionId: body.transactionId } });
            return dupe.toJSON();
        }
    }
    let payment;
    try {
        payment = await OrdersOrderPayment.create({ orderId, ...body });
    } catch (e) {
        // Lost the race against a concurrent identical record → UNIQUE(order_id, transaction_id).
        if (e && (e.name === 'SequelizeUniqueConstraintError' || (e.original && e.original.code === '23505'))) {
            securityAudit.payment('duplicate', 'deny', { storeId, resource: { type: 'order', id: orderId }, reason: 'duplicate_transaction_race', metadata: { transactionId: body.transactionId } });
            const existing = await OrdersOrderPayment.findOne({ where: { orderId, transactionId: body.transactionId } });
            return existing ? existing.toJSON() : (() => { throw e; })();
        }
        throw e;
    }
    if (['captured', 'authorized'].includes(body.status)) {
        await order.update({ paymentStatus: 'paid', status: order.status === 'pending' ? 'confirmed' : order.status });
    }
    await cache.del(cache.keys.order(orderId));
    securityAudit.payment('recorded', 'allow', { storeId, resource: { type: 'order', id: orderId }, metadata: { provider: body.provider, status: body.status, transactionId: body.transactionId } });

    // Only a real capture moves money → mirror it to the ledger (idempotent, fail-open).
    if (body.status === 'captured') {
        await safeLedger(() => ledgerClient.recordPaymentCapture(storeId, {
            paymentId: payment.id, orderId, orderNumber: order.orderNumber,
            amount: body.amount, currencyCode: body.currencyCode || order.currencyCode,
            provider: body.provider, transactionId: body.transactionId,
        }), { storeId, orderId, phase: 'record_capture' });
    }
    return payment.toJSON();
}

/**
 * Issue a refund against a paid order (admin/ops). Full or partial. Records a refund
 * payment row, advances order state, and mirrors a REFUND journal entry to the ledger.
 * The provider refund is backend-authoritative (mock simulates; real adapters throw until
 * configured). Idempotency: a duplicate refund transactionId is ignored.
 */
async function refundPayment(storeId, orderId, body = {}) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (!['paid', 'partially_paid'].includes(order.paymentStatus)) {
        throw new AppError('CONFLICT', `Cannot refund an order with payment status '${order.paymentStatus}'`, 409);
    }

    // The captured payment we are refunding against (most recent capture).
    const captured = await OrdersOrderPayment.findOne({ where: { orderId, status: 'captured' }, order: [['createdAt', 'DESC']] });
    const captureAmount = captured ? Number(captured.amount) : Number(order.totalAmount);
    const amount = body.amount != null ? Number(body.amount) : captureAmount;
    if (!Number.isFinite(amount) || amount <= 0) throw new AppError('VALIDATION_ERROR', 'Refund amount must be a positive number', 400);
    if (amount > captureAmount + 1e-9) throw new AppError('VALIDATION_ERROR', `Refund amount exceeds captured amount (${captureAmount})`, 400);

    const provider = getProvider();
    if (typeof provider.refundPayment !== 'function') {
        throw new AppError('NOT_IMPLEMENTED', `Payment provider '${provider.name}' does not support refunds`, 501);
    }
    const result = await provider.refundPayment({ orderId, transactionId: captured && captured.transactionId, amount, reason: body.reason });
    if (!result || result.status !== 'refunded') throw new AppError('REFUND_FAILED', `Refund failed: ${(result && result.reason) || 'declined'}`, 402);

    const refundTxnId = result.refundId || `rf_${crypto.randomUUID()}`;
    // Idempotency: a repeated refund with the same provider id is a no-op.
    const dupe = await OrdersOrderPayment.findOne({ where: { orderId, transactionId: refundTxnId } });
    if (dupe) {
        securityAudit.payment('refund_duplicate', 'deny', { storeId, resource: { type: 'order', id: orderId }, reason: 'duplicate_refund', metadata: { transactionId: refundTxnId } });
        return dupe.toJSON();
    }

    const isFull = amount >= captureAmount - 1e-9;
    const refundRow = await sequelize.transaction(async (t) => {
        const row = await OrdersOrderPayment.create({
            orderId, provider: provider.name, transactionId: refundTxnId,
            amount, currencyCode: order.currencyCode, status: 'refunded',
            paidAt: new Date(), metadata: { refund: true, reason: body.reason || null, ofPaymentId: captured && captured.id },
        }, { transaction: t });
        await order.update({
            paymentStatus: isFull ? 'refunded' : 'partially_paid',
            status: isFull ? 'refunded' : order.status,
        }, { transaction: t });
        return row;
    });
    await cache.del(cache.keys.order(orderId));
    securityAudit.payment('refunded', 'allow', { storeId, resource: { type: 'order', id: orderId }, metadata: { amount, full: isFull, transactionId: refundTxnId } });

    await safeLedger(() => ledgerClient.recordRefund(storeId, {
        refundId: refundRow.id, orderId, orderNumber: order.orderNumber,
        amount, currencyCode: order.currencyCode, provider: provider.name,
        transactionId: refundTxnId, reason: body.reason,
    }), { storeId, orderId, phase: 'refund' });

    return refundRow.toJSON();
}

// ── Provider-authoritative payment flow (Phase 2) ───────────────────────────────
// Orders are paid ONLY via backend provider confirmation — a client cannot self-mark paid.
async function createPaymentIntent(storeId, orderId, actor) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    await ownership.enforce(actor, await orderOwnerUserId(order.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'payment.intent' });
    if (order.paymentStatus === 'paid') throw new AppError('CONFLICT', 'Order is already paid', 409);
    const provider = getProvider();
    const intent = await provider.createPaymentIntent({ orderId, amount: Number(order.totalAmount), currencyCode: order.currencyCode });
    // Atomic via UNIQUE(order_id, transaction_id) — concurrent intents never duplicate a row.
    await OrdersOrderPayment.findOrCreate({
        where: { orderId, transactionId: intent.intentId },
        defaults: { orderId, provider: provider.name, transactionId: intent.intentId, amount: order.totalAmount, currencyCode: order.currencyCode, status: 'pending', metadata: { intentId: intent.intentId } },
    });
    securityAudit.payment('intent_created', 'allow', { userId: actor && actor.userId, storeId, resource: { type: 'order', id: orderId }, requestId: actor && actor.requestId, metadata: { provider: provider.name, intentId: intent.intentId } });
    return { intentId: intent.intentId, status: intent.status };
}

async function confirmPayment(storeId, orderId, intentId, actor) {
    if (!intentId) throw new AppError('VALIDATION_ERROR', 'intentId is required', 400);
    const order0 = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order0) throw new AppError('NOT_FOUND', 'Order not found', 404);
    await ownership.enforce(actor, await orderOwnerUserId(order0.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'payment.confirm' });

    // Replay/forgery guard: the intentId MUST correspond to a payment intent we created for
    // THIS order. Reject an unknown/foreign intent before touching the provider or order state.
    const intentPayment = await OrdersOrderPayment.findOne({ where: { orderId, transactionId: intentId } });
    if (!intentPayment) {
        securityAudit.payment('replay_blocked', 'deny', { userId: actor && actor.userId, storeId, action: 'payment.confirm', resource: { type: 'order', id: orderId }, reason: 'unknown_intent', requestId: actor && actor.requestId, metadata: { intentId } });
        throw new AppError('CONFLICT', 'No matching payment intent for this order', 409);
    }

    if (order0.paymentStatus === 'paid') { // fast-path idempotent replay (never double-capture)
        securityAudit.payment('confirm_replay', 'allow', { userId: actor && actor.userId, storeId, resource: { type: 'order', id: orderId }, reason: 'already_paid', requestId: actor && actor.requestId, metadata: { intentId } });
        return order0.toJSON();
    }

    const result = await getProvider().confirmPayment({ intentId, orderId }); // BACKEND-AUTHORITATIVE

    const out = await sequelize.transaction(async (t) => {
        // Lock the order row: a concurrent confirm waits here, then sees paymentStatus='paid'
        // and exits — DETERMINISTIC single capture, no double-fulfill / double-ledger.
        const order = await OrdersOrder.findOne({ where: { id: orderId, storeId }, lock: t.LOCK.UPDATE, transaction: t });
        if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
        if (order.paymentStatus === 'paid') return { ok: true, replay: true };
        const payment = await OrdersOrderPayment.findOne({ where: { orderId, transactionId: intentId }, transaction: t });
        if (result.status === 'captured') {
            if (payment) await payment.update({ status: 'captured', paidAt: new Date(), metadata: { ...(payment.metadata || {}), transactionId: result.transactionId } }, { transaction: t });
            await order.update({ paymentStatus: 'paid', status: order.status === 'pending' ? 'confirmed' : order.status }, { transaction: t });
            await unwindReservation(t, storeId, orderId, 'fulfill'); // reserved → deducted on capture
            return { ok: true };
        }
        if (payment) await payment.update({ status: 'failed', metadata: { ...(payment.metadata || {}), reason: result.reason } }, { transaction: t });
        await order.update({ paymentStatus: 'failed' }, { transaction: t });
        return { ok: false, reason: result.reason };
    });
    await cache.del(cache.keys.order(orderId));
    if (!out.ok) {
        securityAudit.payment('failed', 'deny', { userId: actor && actor.userId, storeId, resource: { type: 'order', id: orderId }, reason: out.reason || 'declined', requestId: actor && actor.requestId, metadata: { intentId } });
        throw new AppError('PAYMENT_FAILED', `Payment failed: ${out.reason || 'declined'}`, 402);
    }
    securityAudit.payment('captured', 'allow', { userId: actor && actor.userId, storeId, resource: { type: 'order', id: orderId }, requestId: actor && actor.requestId, metadata: { intentId, replay: !!out.replay } });
    const fresh = await OrdersOrder.findOne({ where: { id: orderId, storeId } });

    // Mirror the captured payment into the double-entry ledger (idempotent, fail-open, post-commit).
    if (!out.replay) {
        await safeLedger(() => ledgerClient.recordPaymentCapture(storeId, {
            paymentId: intentPayment.id, orderId, orderNumber: fresh.orderNumber,
            amount: fresh.totalAmount, currencyCode: fresh.currencyCode,
            provider: intentPayment.provider, transactionId: result.transactionId,
        }), { storeId, orderId, phase: 'confirm_capture' });
    }
    return fresh.toJSON();
}

async function failPayment(storeId, orderId, intentId, reason) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    await getProvider().failPayment({ intentId, reason });
    await sequelize.transaction(async (t) => {
        await order.update({ paymentStatus: 'failed' }, { transaction: t });
        if (intentId) await OrdersOrderPayment.update({ status: 'failed' }, { where: { orderId, transactionId: intentId }, transaction: t });
        await unwindReservation(t, storeId, orderId, 'release'); // Phase 3: free reserved stock on failure
    });
    await cache.del(cache.keys.order(orderId));
    console.warn(JSON.stringify({ evt: 'payment.failed', storeId, orderId, intentId, reason }));
    return order.toJSON();
}

async function cancelPayment(storeId, orderId, intentId) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (order.paymentStatus === 'paid') throw new AppError('CONFLICT', 'Cannot cancel a paid order (use refund)', 409);
    await getProvider().cancelPayment({ intentId });
    await sequelize.transaction(async (t) => {
        await order.update({ paymentStatus: 'voided', status: 'cancelled' }, { transaction: t });
        if (intentId) await OrdersOrderPayment.update({ status: 'voided' }, { where: { orderId, transactionId: intentId }, transaction: t });
        await unwindReservation(t, storeId, orderId, 'release'); // Phase 3: free reserved stock on cancel
    });
    await cache.del(cache.keys.order(orderId));
    console.info(JSON.stringify({ evt: 'payment.cancelled', storeId, orderId, intentId }));
    return order.toJSON();
}

module.exports = { listOrders, getOrder, createOrder, updateOrderStatus, cancelOrder, recordPayment, refundPayment, createPaymentIntent, confirmPayment, failPayment, cancelPayment };
