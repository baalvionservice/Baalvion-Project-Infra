'use strict';
// Cross-store cart visibility for platform admins — "what is a user dropping in their cart,
// right now, so we can see intent before checkout." Reads orders_carts (live state) and
// cart_events (the durable activity trail materialized by cartEventsOutbox.js's relay).
//
// LIMITATION (documented, not silently assumed away): OrdersCart has no cartId/orderId link to
// the order it eventually became — checkout doesn't record that relationship anywhere in this
// service's schema. "Abandoned" therefore means "has items and hasn't been touched in N minutes,
// while still unexpired" — a reasonable proxy for admin triage, but a cart that WAS checked out
// through a flow that didn't clear it (rare — clearCart normally runs post-checkout) could in
// theory still surface here. Tightening this needs a real cart→order linkage, which is a bigger
// change than Phase 3's scope.
const { OrdersCart, CartEvent, Op, sequelize } = require('../models');
const { parsePagination, buildPaginated } = require('../utils/pagination');

// Non-empty JSONB array filter — plain Sequelize `{ items: { [Op.ne]: [] } }` risks being
// mistranslated as a nested-path JSONB query rather than a whole-column comparison; a raw
// jsonb_array_length() predicate is unambiguous.
const hasItems = () => sequelize.where(sequelize.fn('jsonb_array_length', sequelize.col('items')), { [Op.gt]: 0 });

async function listLiveCarts({ storeId, page: pageIn, limit: limitIn } = {}) {
    const { page, limit, offset } = parsePagination({ page: pageIn, limit: limitIn });
    const where = { expiresAt: { [Op.gt]: new Date() } };
    if (storeId) where.storeId = storeId;
    const { rows, count } = await OrdersCart.findAndCountAll({
        where: { [Op.and]: [where, hasItems()] }, order: [['updatedAt', 'DESC']], limit, offset,
        attributes: { exclude: ['sessionId'] }, // never surface the raw guest session, even to admins
    });
    return buildPaginated(rows.map((r) => r.toJSON()), count, { page, limit });
}

async function listAbandonedCarts({ storeId, abandonedAfterMinutes = 30, page: pageIn, limit: limitIn } = {}) {
    const { page, limit, offset } = parsePagination({ page: pageIn, limit: limitIn });
    const staleBefore = new Date(Date.now() - abandonedAfterMinutes * 60 * 1000);
    const where = { expiresAt: { [Op.gt]: new Date() }, updatedAt: { [Op.lt]: staleBefore } };
    if (storeId) where.storeId = storeId;
    const { rows, count } = await OrdersCart.findAndCountAll({
        where: { [Op.and]: [where, hasItems()] }, order: [['updatedAt', 'ASC']], limit, offset,
        attributes: { exclude: ['sessionId'] },
    });
    return buildPaginated(rows.map((r) => r.toJSON()), count, { page, limit });
}

async function getCartHistory(userId, { page: pageIn, limit: limitIn } = {}) {
    const { page, limit, offset } = parsePagination({ page: pageIn, limit: limitIn });
    const { rows, count } = await CartEvent.findAndCountAll({
        where: { userId }, order: [['occurredAt', 'DESC']], limit, offset,
    });
    return buildPaginated(rows.map((r) => r.toJSON()), count, { page, limit });
}

module.exports = { listLiveCarts, listAbandonedCarts, getCartHistory };
