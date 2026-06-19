'use strict';
const { Op } = require('sequelize');
const { InventoryStock, InventoryMovement, InventoryWarehouse, InventoryReservation, sequelize } = require('../models');
const { AppError } = require('../utils/errors');

// Lock TTL in minutes (how long a hold survives without confirm/release). Configurable via env.
const LOCK_TTL_MINUTES = Number(process.env.INVENTORY_LOCK_TTL_MINUTES || 15);

/**
 * variant→stock keying: this service keys stock rows on `sku` (unique per warehouse via the
 * (warehouse_id, sku) index; `variant_id` is a nullable UUID column, NOT unique). The storefront's
 * `variantId` is therefore treated as the SKU identifier the stock/lock rows key on. All resolution
 * below is by `{ storeId, sku }`.
 */
function statusForQty(stock, qty) {
    return qty === 0 ? 'out_of_stock' : qty <= (stock.lowStockThreshold || 0) ? 'low_stock' : 'in_stock';
}

function toStockLevel(stock) {
    const quantity = stock.quantity || 0;
    const reserved = stock.reservedQuantity || 0;
    return {
        variantId: stock.variantId || stock.sku,
        productId: stock.productId,
        quantity,
        reserved,
        available: quantity - reserved,
        status: stock.status,
        sku: stock.sku,
        updatedAt: (stock.updatedAt instanceof Date ? stock.updatedAt.toISOString() : stock.updatedAt) || new Date().toISOString(),
    };
}

/**
 * Sweep active reservations whose TTL has lapsed back into availability. Run opportunistically at
 * the start of lock() so expired holds free up without a cron. Each expired hold decrements its
 * stock's reserved_quantity inside ITS OWN transaction with a row lock on the stock row, so a
 * concurrent reserve/release on the same SKU can never interleave a read-then-write race. Returns
 * the number of reservations expired.
 */
async function expireStale({ storeId, sku } = {}) {
    const where = { status: 'active', expiresAt: { [Op.lt]: new Date() } };
    if (storeId) where.storeId = storeId;
    if (sku) where.sku = sku;
    const stale = await InventoryReservation.findAll({ where });
    let expired = 0;
    for (const r of stale) {
        await sequelize.transaction(async (t) => {
            // Re-load under FOR UPDATE; bail if another sweep already claimed it (idempotent).
            const res = await InventoryReservation.findOne({ where: { id: r.id }, transaction: t, lock: t.LOCK.UPDATE });
            if (!res || res.status !== 'active') return;
            const stock = await InventoryStock.findOne({ where: { storeId: res.storeId, sku: res.sku }, transaction: t, lock: t.LOCK.UPDATE });
            if (stock) {
                const newReserved = Math.max(0, (stock.reservedQuantity || 0) - res.quantity);
                await stock.update({ reservedQuantity: newReserved }, { transaction: t });
            }
            await res.update({ status: 'expired' }, { transaction: t });
            expired += 1;
        });
    }
    return expired;
}

async function resolveWarehouseId(storeId, warehouseId, t) {
    if (warehouseId) {
        const wh = await InventoryWarehouse.findOne({ where: { id: warehouseId, storeId }, transaction: t });
        if (!wh) throw new AppError('NOT_FOUND', 'Warehouse not found', 404);
        return wh.id;
    }
    // Default warehouse: the store's default, else first active, else any. Deterministic order so
    // repeat locks for the same store land on the same warehouse.
    const wh = await InventoryWarehouse.findOne({
        where: { storeId },
        order: [['isDefault', 'DESC'], ['isActive', 'DESC'], ['createdAt', 'ASC']],
        transaction: t,
    });
    if (!wh) throw new AppError('NOT_FOUND', 'No warehouse configured for store', 404);
    return wh.id;
}

/**
 * Atomically reserve `quantity` of `variantId` (== sku) for `userId`.
 *
 * CONCURRENCY: the reserve is done inside a transaction that takes a ROW LOCK (SELECT ... FOR UPDATE)
 * on the stock row before reading available stock. A naive read-then-write would let two requests
 * both read available=1 and both reserve it (oversell). The row lock serializes concurrent reserves
 * on the same SKU: the second waits for the first to commit, then sees the updated reserved_quantity.
 * The guard `available >= requested` is evaluated AFTER acquiring the lock, so it is race-free.
 */
async function lock({ storeId, variantId, userId, quantity = 1, warehouseId = null, productId = null }) {
    if (!Number.isInteger(quantity) || quantity < 1) throw new AppError('VALIDATION_ERROR', 'quantity must be a positive integer', 400);
    const sku = variantId;

    // Opportunistic TTL sweep for this SKU so lapsed holds free up before we check availability.
    await expireStale({ storeId, sku });

    return sequelize.transaction(async (t) => {
        const stock = await InventoryStock.findOne({
            where: { storeId, sku },
            transaction: t,
            lock: t.LOCK.UPDATE, // SELECT ... FOR UPDATE — serializes concurrent locks on this SKU
        });
        if (!stock) throw new AppError('NOT_FOUND', 'Stock not found for variant', 404);

        const available = (stock.quantity || 0) - (stock.reservedQuantity || 0);
        if (available < quantity) {
            throw new AppError('CONFLICT', `Insufficient available stock: ${available} available, ${quantity} requested`, 409, { available, requested: quantity });
        }

        const newReserved = (stock.reservedQuantity || 0) + quantity;
        await stock.update({ reservedQuantity: newReserved }, { transaction: t });

        const expiresAt = new Date(Date.now() + LOCK_TTL_MINUTES * 60 * 1000);
        const resolvedWarehouseId = warehouseId || stock.warehouseId || (await resolveWarehouseId(storeId, null, t));
        const reservation = await InventoryReservation.create({
            warehouseId: resolvedWarehouseId,
            storeId,
            sku,
            productId: productId || stock.productId || null,
            variantId: stock.variantId || null,
            quantity,
            userId: userId != null ? String(userId) : null,
            status: 'active',
            expiresAt,
        }, { transaction: t });

        return {
            lockId: reservation.id,
            variantId,
            userId: reservation.userId,
            quantity,
            expiresAt: expiresAt.toISOString(),
            ttlMinutes: LOCK_TTL_MINUTES,
        };
    });
}

/**
 * Release a hold. Idempotent: releasing an already-released/expired/confirmed lock returns
 * { released: true } WITHOUT double-decrementing reserved_quantity. Only an 'active' hold
 * decrements. Row locks on the reservation and stock rows make the decrement race-free.
 */
async function release(lockId) {
    return sequelize.transaction(async (t) => {
        const res = await InventoryReservation.findOne({ where: { id: lockId }, transaction: t, lock: t.LOCK.UPDATE });
        if (!res) throw new AppError('NOT_FOUND', 'Lock not found', 404);
        if (res.status !== 'active') return { released: true }; // idempotent no-op

        const stock = await InventoryStock.findOne({ where: { storeId: res.storeId, sku: res.sku }, transaction: t, lock: t.LOCK.UPDATE });
        if (stock) {
            const newReserved = Math.max(0, (stock.reservedQuantity || 0) - res.quantity);
            await stock.update({ reservedQuantity: newReserved }, { transaction: t });
        }
        await res.update({ status: 'released' }, { transaction: t });
        return { released: true };
    });
}

/**
 * Confirm a hold into a committed decrement at order placement: on-hand `quantity` drops by the
 * held amount AND `reserved_quantity` drops by the same (net available unchanged — the stock was
 * already withheld). Records an 'outbound' inventory movement referencing the order. Idempotent:
 * confirming an already-confirmed lock returns { confirmed: true } without a second decrement.
 * Releasing/expiring before confirm makes the lock no longer confirmable (409) — the hold is gone.
 */
async function confirm(lockId, orderId) {
    return sequelize.transaction(async (t) => {
        const res = await InventoryReservation.findOne({ where: { id: lockId }, transaction: t, lock: t.LOCK.UPDATE });
        if (!res) throw new AppError('NOT_FOUND', 'Lock not found', 404);
        if (res.status === 'confirmed') return { confirmed: true }; // idempotent no-op
        if (res.status !== 'active') throw new AppError('CONFLICT', `Cannot confirm a ${res.status} lock`, 409);

        const stock = await InventoryStock.findOne({ where: { storeId: res.storeId, sku: res.sku }, transaction: t, lock: t.LOCK.UPDATE });
        if (!stock) throw new AppError('NOT_FOUND', 'Stock not found for lock', 404);

        const prevQty = stock.quantity || 0;
        const newQty = Math.max(0, prevQty - res.quantity);
        const newReserved = Math.max(0, (stock.reservedQuantity || 0) - res.quantity);
        await stock.update({ quantity: newQty, reservedQuantity: newReserved, status: statusForQty(stock, newQty) }, { transaction: t });

        await InventoryMovement.create({
            warehouseId: stock.warehouseId,
            storeId: res.storeId,
            productId: stock.productId,
            variantId: stock.variantId,
            sku: res.sku,
            type: 'outbound',
            quantity: res.quantity,
            previousQuantity: prevQty,
            newQuantity: newQty,
            reference: orderId ? `order:${orderId}` : null,
            notes: 'Reservation confirmed (committed decrement)',
        }, { transaction: t });

        await res.update({ status: 'confirmed', orderId: orderId || null }, { transaction: t });
        return { confirmed: true };
    });
}

async function getStock(storeId, variantId) {
    const stock = await InventoryStock.findOne({ where: { storeId, sku: variantId } });
    if (!stock) throw new AppError('NOT_FOUND', 'Stock not found for variant', 404);
    return toStockLevel(stock);
}

async function getBulkStock(storeId, variantIds = []) {
    if (!Array.isArray(variantIds) || variantIds.length === 0) return [];
    const rows = await InventoryStock.findAll({ where: { storeId, sku: { [Op.in]: variantIds } } });
    return rows.map(toStockLevel);
}

module.exports = { lock, release, confirm, getStock, getBulkStock, expireStale, LOCK_TTL_MINUTES };
