'use strict';
const crypto = require('crypto');
const { Op, QueryTypes } = require('sequelize');
const { OrdersOrder, OrdersOrderItem, OrdersOrderPayment, OrdersInvoice, OrdersCustomer, OrdersShipment, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const { getProvider, payuVerifyReturn, payuParseReturn } = require('./paymentProvider');
const config = require('../config/appConfig');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const ownership = require('./ownership');
const securityAudit = require('./securityAudit');
const ledgerOutbox = require('./ledgerOutbox');
const pclShadow = require('./pclShadow'); // PCL Phase-1 shadow mode (flag-gated, non-blocking, never throws)
const discountService = require('./discountService');
const markets = require('../config/markets');
const pricing = require('./pricing');
const fxRateProvider = require('./fxRateProvider');
const { sendOrderEmail } = require('./orderNotifications');
const inventoryClient = require('./inventoryClient');
const alerts = require('./alerts');

// ── Cross-service inventory reservation (the AUTHORITATIVE oversell guard) ──────────────────────
// inventory-service owns warehouse-scoped stock and an atomic, row-locked reserve→confirm→release
// state machine. createOrder reserves each line's resolved SKU via inventoryClient; the returned
// lockId is recorded on order.metadata.inventoryLocks so the capture path can CONFIRM the hold and
// the cancel/fail path can RELEASE it.
//
// "Tracked" signal: order-service re-prices each line from commerce tables (products/variants/
// pricing) — that path does NOT expose a trackInventory flag, and stock lives in inventory-service,
// not commerce. So we do NOT pre-classify lines. Instead we attempt a reserve for EVERY line with a
// resolvable SKU and let inventory-service be the authority on "tracked":
//   • 201            → the SKU is tracked and a hold was taken (lockId recorded).
//   • 409 CONFLICT   → the SKU is tracked AND out of stock → HARD-FAIL the order (release prior
//                      holds taken in THIS order, then throw 409 OUT_OF_STOCK).
//   • anything else  → FAIL-OPEN (untracked 404, inventory outage/5xx/timeout, or disabled client):
//                      proceed with the order and emit an ops alert for reconciliation. This keeps
//                      checkout resilient to an inventory outage, exactly like the ledger pattern.
//
// This runs POST-COMMIT (after the order row + the existing in-DB reserveInventory have committed),
// because it must persist the returned lockIds onto the already-created order. The in-DB
// reserveInventory remains the same-DB backstop; this cross-service hold is the distributed guard.

/**
 * Reserve every line of an order against inventory-service. Returns the locks to persist, or throws
 * 409 OUT_OF_STOCK (after releasing any holds already taken) when a tracked SKU is unavailable.
 * @returns {Promise<Array<{ lockId: string, sku: string, quantity: number }>>}
 */
async function reserveOrderInventory(storeId, orderId, items, userId) {
    if (!config.inventory.enabled) return []; // disabled → fail-open, nothing to record
    const taken = [];
    for (const i of items) {
        const sku = i.sku || i.variantId;
        const result = await inventoryClient.reserve(storeId, { variantId: sku, sku, productId: i.productId, quantity: i.quantity, userId });
        if (result.ok) {
            taken.push({ lockId: result.lockId, sku, quantity: i.quantity });
            continue;
        }
        if (result.conflict) {
            // Tracked + out of stock → don't place an order we can't fulfil. Release prior holds first.
            await releaseLocks(storeId, taken, orderId);
            throw new AppError('OUT_OF_STOCK', `Insufficient stock for ${sku || i.productId}`, 409, result.detail || {});
        }
        // Fail-open (untracked / outage / disabled). Alert only on a genuine reachability failure,
        // not on an untracked-SKU 404 (which is the documented "not tracked → allow" case).
        if (!result.skipped && result.status !== 404) {
            alerts.inventoryUnavailable(storeId, { orderId, sku, phase: 'reserve', reason: result.error || `status ${result.status}` }).catch(() => {});
        }
    }
    return taken;
}

/** Best-effort release of a set of recorded locks (compensating rollback / cancel / fail). */
async function releaseLocks(storeId, locks, orderId) {
    for (const l of (locks || [])) {
        const r = await inventoryClient.release(storeId, l.lockId);
        if (!r.ok && !r.skipped) {
            alerts.inventoryUnavailable(storeId, { orderId, sku: l.sku, phase: 'release', reason: r.error || `status ${r.status}` }).catch(() => {});
        }
    }
}

/** Best-effort confirm of a set of recorded locks (payment capture commits the held stock). */
async function confirmLocks(storeId, locks, orderId) {
    for (const l of (locks || [])) {
        const r = await inventoryClient.confirm(storeId, l.lockId, orderId);
        if (!r.ok && !r.skipped) {
            alerts.inventoryUnavailable(storeId, { orderId, sku: l.sku, phase: 'confirm', reason: r.error || `status ${r.status}` }).catch(() => {});
        }
    }
}

/** Read the inventory locks recorded on an order's metadata (set by createOrder). */
function locksFromOrder(order) {
    const meta = order && order.metadata;
    const locks = meta && meta.inventoryLocks;
    return Array.isArray(locks) ? locks : [];
}

// Money movements are mirrored into the double-entry ledger via the TRANSACTIONAL OUTBOX
// (service/ledgerOutbox.js): the ledger event is committed in the same DB transaction as the
// payment mutation and delivered by a retrying relay, so a ledger outage/crash can no longer
// silently drop it (the old fire-and-forget `safeLedger` could). The ledger client is idempotent
// on transactionRef, so at-least-once delivery is safe.

function generateOrderNumber(storeCode = 'ORD') {
    const ts = Date.now().toString(36).toUpperCase();
    // CSPRNG (not Math.random) so order numbers are not predictable/enumerable.
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${storeCode}-${ts}-${rand}`;
}

// An order is owned by the user behind its customer record (order.customerId → customer.userId).
// Guest orders (no customerId) are owned instead by the holder of the signed guest session bound
// to them at creation (metadata.guestSessionId) — see ownership.enforce's session branch.
async function orderOwnerUserId(customerId) {
    if (!customerId) return null;
    const c = await OrdersCustomer.findByPk(customerId, { attributes: ['userId'] });
    return c ? c.userId : null;
}

// The guest session (if any) an order is bound to. Used as ownerSessionId in ownership checks so a
// guest who created the order (and still holds the signed X-Cart-Session) can read/pay for it.
function orderOwnerSessionId(order) {
    const meta = order && order.metadata;
    return meta && typeof meta.guestSessionId === 'string' ? meta.guestSessionId : null;
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

// Customer-facing "my orders": list orders owned by the authenticated user in this store.
// An order is owned via order.customerId -> customer.userId (see orderOwnerUserId), so we resolve
// the user's customer record(s) first, then page their orders. No store-role required — a shopper
// only ever sees their own orders.
async function listMyOrders(storeId, userId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    if (userId == null) return buildPaginated([], 0, { page, limit });
    const customers = await OrdersCustomer.findAll({ where: { storeId, userId }, attributes: ['id'] });
    const customerIds = customers.map((c) => c.id);
    if (customerIds.length === 0) return buildPaginated([], 0, { page, limit });
    const { rows, count } = await OrdersOrder.findAndCountAll({
        where: { storeId, customerId: { [Op.in]: customerIds } },
        limit, offset, order: [['createdAt', 'DESC']],
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
    // Ownership enforcement (owner OR guest-session owner OR store staff). On cache hit and miss.
    await ownership.enforce(actor, await orderOwnerUserId(data.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'order.read', ownerSessionId: orderOwnerSessionId(data) });
    return data;
}

// ── PUBLIC guest order lookup / tracking (email + orderNumber) ───────────────────────────────────
// A returning guest who lost their signed X-Cart-Session (closed/reopened the browser) can still
// find and track an order with the order number on their confirmation + the email they used. This is
// the only order read that requires NEITHER auth NOR a guest session, so it is deliberately narrow:
//   • the orderNumber embeds CSPRNG bytes (generateOrderNumber) → non-enumerable,
//   • the supplied email MUST match the order's recipient (constant-time compare),
//   • a mismatch on EITHER field returns the SAME 404 (never reveals which was wrong),
//   • only a SAFE projection is returned — no full street address, phone, customer id, internal
//     metadata (guest session / inventory locks / idempotency key), or ledger refs,
//   • the route (orderRoutes) is rate-limited well below the global IP cap.

// Constant-time string compare (length-padded) so an attacker can't time-probe the recipient email.
function timingSafeEqualStr(a, b) {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

// Every email an order can legitimately be looked up by: the address contact email(s) the guest
// entered at checkout, plus the linked customer's email (a registered shopper looking up without
// signing in). Lower-cased for case-insensitive matching.
async function orderRecipientEmails(order) {
    const out = new Set();
    const ship = order.shippingAddress || {};
    const bill = order.billingAddress || {};
    if (ship.email) out.add(String(ship.email).trim().toLowerCase());
    if (bill.email) out.add(String(bill.email).trim().toLowerCase());
    if (order.customerId) {
        const c = await OrdersCustomer.findByPk(order.customerId, { attributes: ['email'] });
        if (c && c.email) out.add(String(c.email).trim().toLowerCase());
    }
    return [...out];
}

// Customer-shareable parcel-tracking projection (carrier + tracking number + timeline are meant to
// reach the shopper). null when no shipment has been created yet.
function toShipmentView(s) {
    if (!s) return null;
    const o = typeof s.toJSON === 'function' ? s.toJSON() : s;
    const events = Array.isArray(o.events) ? o.events : [];
    const last = events.length ? events[events.length - 1] : null;
    return {
        status: o.status,
        carrier: o.carrier || null,
        trackingNumber: o.trackingNumber || null,
        trackingUrl: o.trackingUrl || null,
        shippedAt: o.shippedAt || null,
        deliveredAt: o.deliveredAt || null,
        estimatedDelivery: o.estimatedDelivery || null,
        lastUpdate: last ? { status: last.status, message: last.message || null, location: last.location || null, at: last.at } : null,
    };
}

// SAFE, PII-minimised tracking projection for the public lookup. Exposes order state + totals +
// line items + a COARSE destination (city/country only) + customer-shareable parcel tracking —
// never the street address, phone, contact email, customer id, or internal metadata.
function toTrackingView(order, shipment = null) {
    const o = typeof order.toJSON === 'function' ? order.toJSON() : order;
    const ship = o.shippingAddress || {};
    return {
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        currencyCode: o.currencyCode,
        subtotal: o.subtotal,
        discountAmount: o.discountAmount,
        shippingAmount: o.shippingAmount,
        taxAmount: o.taxAmount,
        totalAmount: o.totalAmount,
        placedAt: o.createdAt,
        updatedAt: o.updatedAt,
        cancelledAt: o.cancelledAt || null,
        // Coarse destination only — confirms "shipping to the right place" without leaking the full address.
        shipTo: { city: ship.city || null, countryCode: ship.countryCode || null },
        items: (o.items || []).map((i) => ({
            name: i.name,
            variantName: i.variantName || null,
            sku: i.sku,
            quantity: i.quantity,
            price: i.price,
            total: i.total,
        })),
        shipment: toShipmentView(shipment),
    };
}

async function lookupGuestOrder(storeId, { email, orderNumber } = {}) {
    const NOT_FOUND = new AppError('NOT_FOUND', 'No order matches that order number and email', 404);
    const provided = String(email || '').trim().toLowerCase();
    const number = String(orderNumber || '').trim();
    if (!provided || !number) throw NOT_FOUND;
    const order = await OrdersOrder.findOne({
        where: { storeId, orderNumber: number },
        include: [{ model: OrdersOrderItem, as: 'items' }],
    });
    if (!order) throw NOT_FOUND; // unknown order number → generic 404 (no existence oracle)
    const recipients = await orderRecipientEmails(order);
    const matches = recipients.some((e) => timingSafeEqualStr(e, provided));
    if (!matches) throw NOT_FOUND; // email mismatch → SAME 404 as unknown order
    // Latest shipment (if any) so a guest can follow the parcel, not just the order state.
    const shipment = await OrdersShipment.findOne({ where: { storeId, orderId: order.id }, order: [['createdAt', 'DESC']] });
    return toTrackingView(order, shipment);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * AUTHORITATIVE product/price validation + market FX conversion. order-service and
 * commerce-service share one Postgres DB (different schemas), so we read commerce's tables
 * directly (no new infra). For each line: the product must exist in THIS store and be
 * published; an active variant is resolved (specified, else default); the BASE (USD) unit
 * price + per-variant tax come from store pricing (commerce_product_pricing window) or the
 * variant base price. Client monetary fields are IGNORED.
 *
 * FX FIX: when `marketCode` is one of us|uk|ae|in|sg, the base USD price is converted to the
 * market currency with the SAME FX + rounding the storefront uses (config/markets) and the
 * MARKET tax rule (inclusive VAT/GST vs exclusive sales tax) is applied — so the persisted
 * order matches the displayed price. With no/unknown market the legacy USD path is preserved
 * (base price unchanged, per-variant tax rate, exclusive).
 *
 * NOTE: stock/inventory is NOT in commerce (it is warehouse-scoped in inventory-service),
 * so oversell is not validated here — see hardening notes.
 */
async function resolveAuthoritativeItems(storeId, items, marketCode = null) {
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

        const [priceRow] = await sequelize.query(
            `SELECT price, tax_rate FROM commerce.commerce_product_pricing
               WHERE variant_id = :variantId AND store_id = :storeId AND is_active = true
                 AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now())
               ORDER BY starts_at DESC NULLS LAST LIMIT 1`,
            { replacements: { variantId: variant.id, storeId }, type: QueryTypes.SELECT },
        );

        const baseUsd = Number(priceRow ? priceRow.price : variant.price);
        if (!Number.isFinite(baseUsd) || baseUsd < 0) {
            throw new AppError('VALIDATION_ERROR', `No valid price for variant ${variant.id}`, 400);
        }
        const variantTaxRate = Number((priceRow && priceRow.tax_rate) || 0);

        // Convert base USD → market currency (or pass through for the legacy no-market path)
        // and resolve the applicable tax rule, then derive gross/net/tax for the line.
        const unit = pricing.resolveUnitPricing(baseUsd, marketCode, variantTaxRate);
        const line = pricing.computeLine(unit.unitPrice, i.quantity, unit.taxRate, unit.taxInclusive);

        resolved.push({
            productId, variantId: variant.id, sku: variant.sku,
            name: product.name, variantName: variant.name || null,
            quantity: i.quantity,
            basePriceUsd: pricing.round2(baseUsd),
            price: unit.unitPrice,            // per-unit price in the order (market) currency
            currencyCode: unit.currencyCode,  // null for the legacy no-market path
            gross: line.gross, net: line.net, tax: line.tax, // canonical line shape (computeOrderTotals reads .net/.tax/.gross)
            taxRate: unit.taxRate, taxInclusive: unit.taxInclusive,
            compareAtPrice: null, metadata: i.metadata || {},
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
    const { customerId, shippingAmount = 0, discountCode, notes, billingAddress, shippingAddress, metadata = {}, idempotencyKey } = body;

    // 5-market commerce context (us/uk/ae/in/sg). The market is the SERVER-AUTHORITATIVE source
    // of currency + tax rule — a client cannot claim market='in' but currencyCode='USD'. `market`
    // falls back to `country` (the storefront sends ?country=). For a known market the order is
    // priced in that market's currency (base USD × FX, matching the storefront); for an unknown/
    // absent market the legacy USD path applies (currencyCode from the request, default USD).
    const resolvedMarket = markets.getMarket(body.market || body.country);
    const market = resolvedMarket ? resolvedMarket.country : null;
    const currencyCode = resolvedMarket ? resolvedMarket.currency : (body.currencyCode || 'USD');
    const taxType = resolvedMarket ? resolvedMarket.taxType : (body.taxType || null);
    const taxInclusive = resolvedMarket ? resolvedMarket.taxInclusive : (body.taxInclusive === true);
    const orderTaxRate = (body.taxRate != null && Number.isFinite(Number(body.taxRate))) ? Number(body.taxRate) : null;

    if (!body.items || !body.items.length) throw new AppError('VALIDATION_ERROR', 'Order must have at least one item', 400);

    // Identity: the caller is EITHER authenticated (actor.userId) OR a guest holding a valid signed
    // X-Cart-Session (actor.sessionId). A fully anonymous, session-less caller cannot create an order
    // (it would be unattributable/unreadable). Guest orders are bound to actor.sessionId below.
    const guestSessionId = (actor && actor.userId == null && actor.sessionId) ? actor.sessionId : null;
    if (actor && actor.userId == null && !guestSessionId) {
        throw new AppError('UNAUTHORIZED', 'Guest checkout requires a signed cart session (create a cart first to obtain X-Cart-Session)', 401);
    }

    // Ownership: a caller may only place an order AS a customer they own. (Staff may place on
    // behalf of any customer.) Prevents attributing an order to someone else's customer record.
    if (customerId) {
        const cust = await OrdersCustomer.findOne({ where: { id: customerId, storeId }, attributes: ['id', 'userId'] });
        if (!cust) throw new AppError('VALIDATION_ERROR', 'customerId not found in this store', 400);
        await ownership.enforce(actor, cust.userId, { resourceType: 'customer', resourceId: customerId, storeId, action: 'order.create' });
        // Link-on-checkout: an authenticated shopper ordering against an as-yet-unlinked customer row
        // (userId=null, e.g. created by a prior guest/email upsert) claims it server-side now, so the
        // /me reads (addresses/profile/returns) resolve afterwards. Ownership already passed, so the
        // actor is the owner-or-staff; we never overwrite an existing different owner.
        if (cust.userId == null && actor && actor.userId != null) {
            await OrdersCustomer.update({ userId: actor.userId }, { where: { id: customerId, storeId, userId: null } });
        }
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
            // Guard against a race where the metadata row exists but the order was already deleted.
            if (!found) throw new AppError('NOT_FOUND', 'Order not found', 404);
            // Ownership check on replay: the replaying caller must be the original order's owner
            // (authenticated user, OR the guest session bound to it, OR store staff). Prevents a
            // different caller from fetching another's order by guessing/colliding on an idempotencyKey.
            await ownership.enforce(actor, await orderOwnerUserId(found.customerId), { resourceType: 'order', resourceId: existing.id, storeId, action: 'order.create', ownerSessionId: orderOwnerSessionId(found) });
            return found.toJSON();
        }
    }

    // ── Authoritative pricing + product validation (Phase 1) ────────────────────
    // Client price/subtotal/total/discount/tax are IGNORED. Every line price + tax is
    // re-derived from commerce-service data; all totals are recomputed server-side.
    // Refresh the live FX memo from the shared snapshot (no-op when FX_LIVE_FEED is off) so
    // the order is priced at the SAME rate the storefront displayed.
    await fxRateProvider.primeFromCache().catch(() => {});
    const items = await resolveAuthoritativeItems(storeId, body.items, market);

    const shipping = Number(shippingAmount);
    if (!Number.isFinite(shipping) || shipping < 0) {
        throw new AppError('VALIDATION_ERROR', 'shippingAmount must be a non-negative number', 400);
    }

    // Pre-discount totals (market currency). grossSubtotal is what the customer sees and is the
    // base the discount + minimum-purchase rules apply against.
    const pre = pricing.computeOrderTotals(items, shipping, 0);
    const orderNumber = generateOrderNumber();

    const order = await sequelize.transaction(async (t) => {
        // Server-authoritative discount: validated + computed from commerce data (USD-authored
        // fixed amounts / thresholds are converted to the order's market currency) and a usage
        // slot is atomically claimed within this txn (rolls back with the order on failure).
        const promo = await discountService.applyDiscount(t, storeId, discountCode, pre.grossSubtotal, shipping, market);

        // Final totals: subtotal (net) + tax + shipping - discount, all in the order currency.
        const totals = pricing.computeOrderTotals(items, shipping, promo.discountAmount);

        // Order-level effective tax rate: the market rate when a market applies; else the rate
        // sent with the order; else derived from the server-computed line tax so audit rows are
        // never silently null when tax applied.
        const effectiveTaxRate = resolvedMarket
            ? Number(resolvedMarket.taxRate)
            : (orderTaxRate != null
                ? orderTaxRate
                : (totals.subtotal > 0 && totals.taxAmount > 0 ? pricing.round4((totals.taxAmount / totals.subtotal) * 100) : null));

        const o = await OrdersOrder.create({
            storeId, customerId, orderNumber, currencyCode,
            market, taxType, taxRate: effectiveTaxRate, taxInclusive,
            subtotal: totals.subtotal, discountAmount: totals.discount, shippingAmount: totals.shipping, taxAmount: totals.taxAmount, totalAmount: totals.totalAmount,
            discountCode: promo.code || discountCode || null, notes,
            metadata: { ...metadata, ...(promo.discountId ? { discountId: promo.discountId } : {}), ...(idempotencyKey ? { idempotencyKey: String(idempotencyKey) } : {}), ...(guestSessionId ? { guestSessionId } : {}) },
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
            price: i.price,                 // per-unit price in the order (market) currency
            compareAtPrice: i.compareAtPrice,
            total: i.gross,                 // line total the customer sees (gross, market currency)
            taxAmount: i.tax,
            taxRate: i.taxRate,
            taxInclusive: i.taxInclusive,
            fulfillableQuantity: i.quantity,
            metadata: i.metadata,
        }));
        await OrdersOrderItem.bulkCreate(orderItems, { transaction: t });

        // Phase 1: reserve stock atomically (row-locked); throws OUT_OF_STOCK → rolls back the order.
        await reserveInventory(t, storeId, items);

        if (customerId) await OrdersCustomer.increment({ totalOrders: 1, totalSpent: totals.totalAmount }, { where: { id: customerId }, transaction: t });
        return o;
    });

    // ── Cross-service inventory reservation (AUTHORITATIVE oversell guard) ───────
    // Runs POST-COMMIT so the order id exists to bind locks to. A 409 (tracked SKU out of stock)
    // hard-fails the order: we release any holds taken here AND cancel the just-committed order
    // (mark cancelled + unwind the in-DB reservation) so a placed-but-unfulfillable order is never
    // left behind, then surface 409 OUT_OF_STOCK to the shopper. Any other failure is fail-open
    // (handled inside reserveOrderInventory) so an inventory outage never breaks checkout.
    const reserveUserId = (actor && actor.userId != null) ? actor.userId : null;
    let inventoryLocks = [];
    try {
        inventoryLocks = await reserveOrderInventory(storeId, order.id, items, reserveUserId);
    } catch (err) {
        if (err instanceof AppError && err.statusCode === 409) {
            // Compensating rollback of the committed order (prior cross-service holds already released
            // inside reserveOrderInventory). Best-effort; never mask the original 409.
            await cancelOrder(storeId, order.id, 'Out of stock at reservation').catch(() => {});
        }
        throw err;
    }
    // Persist the lock handles on the order so capture can confirm them and cancel/fail can release.
    if (inventoryLocks.length) {
        try {
            await order.update({ metadata: { ...(order.metadata || {}), inventoryLocks } });
        } catch (e) {
            // The holds exist in inventory-service but we couldn't record them → they will lapse on
            // TTL (no stock leak). Alert so ops can reconcile; never fail an otherwise-placed order.
            console.error(JSON.stringify({ evt: 'inventory.lock_persist_failed', storeId, orderId: order.id, error: e.message }));
            alerts.inventoryUnavailable(storeId, { orderId: order.id, phase: 'persist_locks', reason: e.message }).catch(() => {});
        }
    }

    // Phase 6: structured audit log (orderNumber is the cross-service correlation handle).
    console.info(JSON.stringify({ evt: 'order.created', storeId, orderId: order.id, orderNumber, totalAmount: Number(order.totalAmount), discountAmount: Number(order.discountAmount), currencyCode, market, taxType, taxInclusive, lineCount: items.length, inventoryLocks: inventoryLocks.length }));
    // Transactional order-confirmation email (post-commit, fire-and-forget, fail-open).
    sendOrderEmail('orderConfirmation', order.toJSON(), items).catch(() => {});
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
    const locks = locksFromOrder(order);
    await sequelize.transaction(async (t) => {
        await order.update({ status: 'cancelled', cancelledAt: new Date(), cancelReason: reason }, { transaction: t });
        await unwindReservation(t, storeId, orderId, 'release'); // Phase 3: free reserved stock
    });
    // Release the cross-service inventory holds (post-commit, idempotent, fail-open).
    await releaseLocks(storeId, locks, orderId);
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

    // Only a real capture moves money → mirror it to the ledger via the durable outbox (retried +
    // dead-lettered) instead of a swallowed best-effort call. This admin/finance path is not wrapped
    // in a DB transaction, so the enqueue is its own write; the reconciliation sweep is the backstop
    // for the small window between the order update and the enqueue.
    if (body.status === 'captured') {
        await ledgerOutbox.enqueuePaymentCapture({
            storeId, paymentId: payment.id, orderId, orderNumber: order.orderNumber,
            amount: body.amount, currencyCode: body.currencyCode || order.currencyCode,
            provider: body.provider, transactionId: body.transactionId,
        });
        // Commit the cross-service inventory holds (reserved → deducted) on this manual capture.
        // Idempotent + fail-open (an inventory hiccup never re-fails an already-recorded payment).
        await confirmLocks(storeId, locksFromOrder(order), orderId);
        // Payment-received email (post-commit, fire-and-forget, fail-open; de-duped by idempotencyKey).
        OrdersOrderItem.findAll({ where: { orderId } })
            .then((items) => sendOrderEmail('orderPaid', order.toJSON(), items))
            .catch(() => {});
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
        // Mirror the refund to the ledger IN THE SAME TRANSACTION (transactional outbox): committed
        // atomically with the refund row, then delivered by the retrying relay. Replaces the old
        // post-commit fire-and-forget safeLedger() that could silently drop the REFUND entry.
        await ledgerOutbox.enqueueRefund({
            storeId, refundId: row.id, orderId, orderNumber: order.orderNumber,
            amount, currencyCode: order.currencyCode, provider: provider.name,
            transactionId: refundTxnId, reason: body.reason,
        }, t);
        return row;
    });
    await cache.del(cache.keys.order(orderId));
    securityAudit.payment('refunded', 'allow', { storeId, resource: { type: 'order', id: orderId }, metadata: { amount, full: isFull, transactionId: refundTxnId } });

    return refundRow.toJSON();
}

// ── Provider-authoritative payment flow (Phase 2) ───────────────────────────────
// Orders are paid ONLY via backend provider confirmation — a client cannot self-mark paid.
// `selectedGateway` (C1) is the shopper's storefront gateway choice (stripe|razorpay|payu|bank).
// It is RECORDED on the order/payment metadata for reporting + the success screen; the provider
// that actually captures money is still resolved server-side by PAYMENT_PROVIDER (mock in non-prod).
async function createPaymentIntent(storeId, orderId, actor, selectedGateway = null) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    await ownership.enforce(actor, await orderOwnerUserId(order.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'payment.intent', ownerSessionId: orderOwnerSessionId(order) });
    if (order.paymentStatus === 'paid') throw new AppError('CONFLICT', 'Order is already paid', 409);
    // Record the selected gateway on the order metadata (immutable spread). Best-effort: a metadata
    // write must never block creating the intent, so failures here fall through to intent creation.
    if (selectedGateway) {
        try {
            await order.update({ metadata: { ...(order.metadata || {}), selectedGateway } });
        } catch { /* gateway label is advisory; never block payment on a metadata write */ }
    }
    const provider = getProvider(selectedGateway);
    // A gateway create failure (declined / invalid amount-or-currency / provider down) is a payment
    // error, not a server fault — map it to 402 and never leak the provider's raw message.
    let intent;
    try {
        intent = await provider.createPaymentIntent({ orderId, amount: Number(order.totalAmount), currencyCode: order.currencyCode, country: order.market || order.country });
    } catch (e) {
        securityAudit.payment('intent_failed', 'deny', { userId: actor && actor.userId, storeId, resource: { type: 'order', id: orderId }, reason: 'provider_error', requestId: actor && actor.requestId, metadata: { provider: provider.name, providerStatus: e && e.providerStatus } });
        throw new AppError('PAYMENT_ERROR', 'Could not initialise payment with the provider', 402);
    }
    // Atomic via UNIQUE(order_id, transaction_id) — concurrent intents never duplicate a row.
    // Persist the selected gateway on the payment metadata too (alongside the capture provider name)
    // so a payment row self-describes which storefront gateway the shopper picked.
    await OrdersOrderPayment.findOrCreate({
        where: { orderId, transactionId: intent.intentId },
        defaults: { orderId, provider: provider.name, transactionId: intent.intentId, amount: order.totalAmount, currencyCode: order.currencyCode, status: 'pending', metadata: { intentId: intent.intentId, ...(selectedGateway ? { gateway: selectedGateway } : {}) } },
    });
    securityAudit.payment('intent_created', 'allow', { userId: actor && actor.userId, storeId, resource: { type: 'order', id: orderId }, requestId: actor && actor.requestId, metadata: { provider: provider.name, intentId: intent.intentId } });
    // Surface gateway client params (keyId/amount/currency) when present (e.g. Razorpay) so the
    // storefront can open the provider checkout. Absent for the mock provider (the client's branch signal).
    return {
        intentId: intent.intentId,
        status: intent.status,
        ...(intent.keyId ? { keyId: intent.keyId, amount: intent.amount, currency: intent.currency } : {}),
        // Bank transfer → wire instructions; Stripe → hosted-checkout redirectUrl (+ publishableKey);
        // PayU → a signed form the browser POSTs to PayU's hosted page.
        ...(intent.instructions ? { instructions: intent.instructions } : {}),
        ...(intent.redirectUrl ? { redirectUrl: intent.redirectUrl } : {}),
        ...(intent.clientSecret ? { clientSecret: intent.clientSecret } : {}),
        ...(intent.publishableKey ? { publishableKey: intent.publishableKey } : {}),
        ...(intent.formPost ? { formPost: intent.formPost } : {}),
    };
}

async function confirmPayment(storeId, orderId, intentId, actor, verification, selectedGateway = null) {
    if (!intentId) throw new AppError('VALIDATION_ERROR', 'intentId is required', 400);
    const order0 = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order0) throw new AppError('NOT_FOUND', 'Order not found', 404);
    await ownership.enforce(actor, await orderOwnerUserId(order0.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'payment.confirm', ownerSessionId: orderOwnerSessionId(order0) });

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

    // BACKEND-AUTHORITATIVE capture. For gateway providers (Razorpay) `verification` carries the
    // client-returned {payment_id, order_id, signature}; the provider verifies the HMAC server-side.
    // The mock provider ignores `verification`, so the existing mock flow is unchanged.
    const result = await getProvider(selectedGateway).confirmPayment({ intentId, orderId, verification });

    // Manual-settlement providers (bank transfer) return 'pending': the order is NOT paid yet and NOT
    // failed — it awaits out-of-band confirmation (finance recordPayment / reconciliation). Leave the
    // order untouched and report it back so the client shows "awaiting transfer", never a fake fail.
    if (result.status === 'pending') {
        securityAudit.payment('confirm_pending', 'allow', { userId: actor && actor.userId, storeId, resource: { type: 'order', id: orderId }, reason: result.reason || 'awaiting_settlement', requestId: actor && actor.requestId, metadata: { intentId } });
        return order0.toJSON();
    }

    const out = await sequelize.transaction(async (t) => {
        // Lock the order row: a concurrent confirm waits here, then sees paymentStatus='paid'
        // and exits — DETERMINISTIC single capture, no double-fulfill / double-ledger.
        const order = await OrdersOrder.findOne({ where: { id: orderId, storeId }, lock: t.LOCK.UPDATE, transaction: t });
        if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
        if (order.paymentStatus === 'paid') return { ok: true, replay: true };
        const payment = await OrdersOrderPayment.findOne({ where: { orderId, transactionId: intentId }, transaction: t });
        // The recorded storefront gateway: confirm's selection wins, else what intent persisted on
        // the payment row (so a confirm without a gateway preserves the one chosen at intent time).
        const gateway = selectedGateway || (payment && payment.metadata && payment.metadata.gateway) || null;
        if (result.status === 'captured') {
            if (payment) await payment.update({ status: 'captured', paidAt: new Date(), metadata: { ...(payment.metadata || {}), transactionId: result.transactionId, ...(gateway ? { gateway } : {}) } }, { transaction: t });
            await order.update({ paymentStatus: 'paid', status: order.status === 'pending' ? 'confirmed' : order.status, ...(gateway ? { metadata: { ...(order.metadata || {}), selectedGateway: gateway } } : {}) }, { transaction: t });
            await unwindReservation(t, storeId, orderId, 'fulfill'); // reserved → deducted on capture
            // Mirror the capture to the ledger IN THE SAME TRANSACTION (transactional outbox):
            // committed atomically with the capture, then delivered by the retrying ledger relay.
            await ledgerOutbox.enqueuePaymentCapture({
                storeId, paymentId: intentPayment.id, orderId, orderNumber: order.orderNumber,
                amount: order.totalAmount, currencyCode: order.currencyCode,
                provider: intentPayment.provider, transactionId: result.transactionId,
            }, t);
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

    // The ledger mirror is now enqueued transactionally inside the capture above (no post-commit
    // fire-and-forget). Only the payment-received email remains best-effort here.
    if (!out.replay) {
        // Commit the cross-service inventory holds (reserved → deducted) now that payment captured.
        // Post-commit + idempotent + fail-open (never re-fail a captured order on an inventory hiccup).
        await confirmLocks(storeId, locksFromOrder(order0), orderId);
        // Payment-received email (post-commit, fire-and-forget, fail-open; de-duped by idempotencyKey).
        OrdersOrderItem.findAll({ where: { orderId } })
            .then((items) => sendOrderEmail('orderPaid', fresh.toJSON(), items))
            .catch(() => {});
    }
    return fresh.toJSON();
}

async function failPayment(storeId, orderId, intentId, reason) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    const locks = locksFromOrder(order);
    await getProvider().failPayment({ intentId, reason });
    await sequelize.transaction(async (t) => {
        await order.update({ paymentStatus: 'failed' }, { transaction: t });
        if (intentId) await OrdersOrderPayment.update({ status: 'failed' }, { where: { orderId, transactionId: intentId }, transaction: t });
        await unwindReservation(t, storeId, orderId, 'release'); // Phase 3: free reserved stock on failure
    });
    // Release the cross-service inventory holds (post-commit, idempotent, fail-open).
    await releaseLocks(storeId, locks, orderId);
    await cache.del(cache.keys.order(orderId));
    console.warn(JSON.stringify({ evt: 'payment.failed', storeId, orderId, intentId, reason }));
    // PCL shadow (Phase 1): mirror the failure. Keyed by orderId, so a "failed" arriving AFTER a
    // shadowed webhook capture for the same order surfaces a PCL CONFLICT (state stays CAPTURED) —
    // never wiping a real payment. Fire-and-forget, post-commit, never throws.
    pclShadow.recordFailure({
        paymentId: orderId,
        provider: 'unknown',
        transactionId: intentId || `fail:${reason || 'declined'}`,
        amountMinor: Math.round(Number(order.totalAmount) * 100),
        currency: order.currencyCode,
        orgId: storeId,
    }).catch(() => {});
    return order.toJSON();
}

async function cancelPayment(storeId, orderId, intentId) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (order.paymentStatus === 'paid') throw new AppError('CONFLICT', 'Cannot cancel a paid order (use refund)', 409);
    const locks = locksFromOrder(order);
    await getProvider().cancelPayment({ intentId });
    await sequelize.transaction(async (t) => {
        await order.update({ paymentStatus: 'voided', status: 'cancelled' }, { transaction: t });
        if (intentId) await OrdersOrderPayment.update({ status: 'voided' }, { where: { orderId, transactionId: intentId }, transaction: t });
        await unwindReservation(t, storeId, orderId, 'release'); // Phase 3: free reserved stock on cancel
    });
    // Release the cross-service inventory holds (post-commit, idempotent, fail-open).
    await releaseLocks(storeId, locks, orderId);
    await cache.del(cache.keys.order(orderId));
    console.info(JSON.stringify({ evt: 'payment.cancelled', storeId, orderId, intentId }));
    return order.toJSON();
}

// Provider-initiated async webhook dispatch (signature-verified at the route). The webhook carries
// orderId but not storeId, so we resolve the store from the order, then drive it to failed/voided
// via the existing failPayment/cancelPayment (which unwind the stock reservation + post audit).
// An unknown/already-terminal order is a no-op-safe 404/409 handled by those fns.
// PayU return/webhook settlement. PayU posts the result (form fields) to our return route; we verify
// the SHA-512 REVERSE hash (provider auth — NOT user auth), then settle the order by txnid. Success →
// provider-authoritative capture (reuses the webhook capture path, idempotent + order-row locked);
// any other status → mark failed. Returns the orderId + market so the route can redirect the browser.
async function settlePayuReturn(body) {
    if (!(await payuVerifyReturn(body))) return { ok: false, reason: 'bad_signature' };
    const parsed = payuParseReturn(body);
    if (!parsed.txnid) return { ok: false, reason: 'missing_txnid' };
    const payment = await OrdersOrderPayment.findOne({ where: { transactionId: parsed.txnid }, attributes: ['orderId'] });
    if (!payment) return { ok: false, reason: 'unknown_order' };
    const order = await OrdersOrder.findOne({ where: { id: payment.orderId }, attributes: ['id', 'storeId', 'market', 'totalAmount'] });
    if (!order) return { ok: false, reason: 'order_not_found' };
    // Defence-in-depth (beyond the reverse-hash): the settled amount MUST match the order total, so a
    // leaked salt alone can't capture a tampered/short amount. PayU echoes the amount we submitted.
    if (Math.abs(parseFloat(parsed.amount) - Number(order.totalAmount)) > 0.01) {
        return { ok: true, orderId: order.id, market: order.market, settled: 'failed' };
    }
    if (parsed.status === 'captured') {
        await capturePaymentFromWebhook({ providerOrderId: parsed.txnid, providerPaymentId: parsed.mihpayid });
        return { ok: true, orderId: order.id, market: order.market, settled: 'paid' };
    }
    await failPayment(order.storeId, order.id, parsed.txnid, `payu_${String((body && body.status) || 'failed')}`).catch(() => {});
    return { ok: true, orderId: order.id, market: order.market, settled: 'failed' };
}

async function handlePaymentWebhook({ event, orderId, intentId, reason }) {
    const order = await OrdersOrder.findOne({ where: { id: orderId }, attributes: ['id', 'storeId', 'paymentStatus'] });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    if (event === 'payment.failed') {
        return failPayment(order.storeId, orderId, intentId || null, reason || 'provider_webhook');
    }
    return cancelPayment(order.storeId, orderId, intentId || null);
}

// Capture backstop for the SUCCESS case: a signature-verified Razorpay 'payment.captured'/'order.paid'
// webhook settles the order even if the shopper's browser never returned to confirm (closed/crashed
// mid-redirect). Keyed off the Razorpay order_id we stored as the intent's transactionId → resolves
// the order, then captures it under the SAME order-row LOCK.UPDATE as confirmPayment: whichever of
// {client confirm, webhook} acquires the lock first captures; the other sees paymentStatus='paid' and
// no-ops. So it is idempotent AND never double-fulfills / double-ledgers / double-emails — even if
// the webhook is delivered more than once or races the client confirm.
async function capturePaymentFromWebhook({ providerOrderId, providerPaymentId, amount, currencyCode }) {
    if (!providerOrderId) return { ok: false, reason: 'missing_order_id' };
    const intentPayment = await OrdersOrderPayment.findOne({ where: { transactionId: providerOrderId } });
    if (!intentPayment) {
        // Not an order we created an intent for → ack-and-ignore (logged). The route returns 200 so
        // Razorpay stops retrying a webhook we can never map.
        console.warn(JSON.stringify({ evt: 'razorpay_webhook_unknown_order', providerOrderId }));
        return { ok: false, reason: 'unknown_order' };
    }
    const orderId = intentPayment.orderId;
    const base = await OrdersOrder.findOne({ where: { id: orderId }, attributes: ['id', 'storeId'] });
    if (!base) return { ok: false, reason: 'order_not_found' };
    const storeId = base.storeId;

    const out = await sequelize.transaction(async (t) => {
        const order = await OrdersOrder.findOne({ where: { id: orderId, storeId }, lock: t.LOCK.UPDATE, transaction: t });
        if (!order) return { ok: false };
        if (order.paymentStatus === 'paid') return { ok: true, replay: true }; // confirm or a prior webhook already captured
        // Defence-in-depth amount/currency validation (beyond the HMAC signature) — mirrors the PayU
        // return path (settlePayuReturn) and the Java payment-service reference so a leaked webhook
        // secret alone cannot capture an order for a tampered/short amount. Razorpay amounts are in the
        // minor unit (paise/cents); the order total is the major unit. Validated only when the provider
        // sent an amount (payment.captured/order.paid always do). Strict by default (reject mismatch);
        // RAZORPAY_WEBHOOK_STRICT_AMOUNT=false downgrades to warn-and-continue.
        if (amount != null) {
            const expectedMinor = Math.round(Number(order.totalAmount) * 100);
            const seenMinor = Math.round(Number(amount));
            const currencyOk = !currencyCode || String(currencyCode).toUpperCase() === String(order.currencyCode).toUpperCase();
            if (!Number.isFinite(seenMinor) || seenMinor !== expectedMinor || !currencyOk) {
                const detail = { evt: 'razorpay_webhook_amount_mismatch', orderId, providerOrderId, expectedMinor, seenMinor, expectedCurrency: order.currencyCode, seenCurrency: currencyCode || null };
                console.error(JSON.stringify(detail));
                securityAudit.payment('captured', 'deny', { storeId, resource: { type: 'order', id: orderId }, metadata: { via: 'webhook', reason: 'amount_mismatch', expectedMinor, seenMinor } });
                if (process.env.RAZORPAY_WEBHOOK_STRICT_AMOUNT !== 'false') {
                    return { ok: false, reason: 'amount_mismatch' };
                }
            }
        }
        const payment = await OrdersOrderPayment.findOne({ where: { orderId, transactionId: providerOrderId }, transaction: t });
        if (payment) await payment.update({ status: 'captured', paidAt: new Date(), metadata: { ...(payment.metadata || {}), transactionId: providerPaymentId, capturedVia: 'webhook' } }, { transaction: t });
        await order.update({ paymentStatus: 'paid', status: order.status === 'pending' ? 'confirmed' : order.status }, { transaction: t });
        await unwindReservation(t, storeId, orderId, 'fulfill'); // reserved → deducted on capture
        // Mirror the capture to the ledger IN THE SAME TRANSACTION (transactional outbox), so a
        // webhook-driven capture can't lose its ledger entry on a ledger outage/crash post-commit.
        await ledgerOutbox.enqueuePaymentCapture({
            storeId, paymentId: intentPayment.id, orderId, orderNumber: order.orderNumber,
            amount: order.totalAmount, currencyCode: order.currencyCode,
            provider: intentPayment.provider, transactionId: providerPaymentId,
        }, t);
        // Carry the recorded inventory locks out of the txn so we can confirm them post-commit.
        return { ok: true, inventoryLocks: locksFromOrder(order) };
    });
    await cache.del(cache.keys.order(orderId));
    if (out.ok && !out.replay) {
        // Commit the cross-service inventory holds (reserved → deducted). Idempotent + fail-open.
        await confirmLocks(storeId, out.inventoryLocks || [], orderId);
        securityAudit.payment('captured', 'allow', { storeId, resource: { type: 'order', id: orderId }, metadata: { via: 'webhook', providerPaymentId } });
        const fresh = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
        OrdersOrderItem.findAll({ where: { orderId } })
            .then((items) => sendOrderEmail('orderPaid', fresh.toJSON(), items))
            .catch(() => {});
        // PCL shadow (Phase 1): mirror this capture into pcl.payment_state alongside the legacy
        // write. Fire-and-forget, post-commit, never throws — cannot affect this captured order.
        pclShadow.recordCapture({
            paymentId: orderId,
            provider: intentPayment.provider,
            transactionId: providerPaymentId || providerOrderId,
            amountMinor: Math.round(Number(intentPayment.amount) * 100),
            currency: intentPayment.currencyCode,
            orgId: storeId,
        }).catch(() => {});
    }
    return out;
}

module.exports = { listOrders, listMyOrders, getOrder, lookupGuestOrder, createOrder, updateOrderStatus, cancelOrder, recordPayment, refundPayment, createPaymentIntent, confirmPayment, failPayment, cancelPayment, handlePaymentWebhook };
// Appended export (separate statement to avoid colliding with concurrent edits to the line above).
module.exports.capturePaymentFromWebhook = capturePaymentFromWebhook;
module.exports.settlePayuReturn = settlePayuReturn;
