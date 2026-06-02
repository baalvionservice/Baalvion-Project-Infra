'use strict';
const { Op } = require('sequelize');
const { InventoryStock, InventoryMovement, InventoryWarehouse, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listStock(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.productId) where.productId = query.productId;
    if (query.status) where.status = query.status;
    if (query.sku) where.sku = { [Op.iLike]: `%${query.sku}%` };
    const { rows, count } = await InventoryStock.findAndCountAll({ where, limit, offset, order: [['updatedAt', 'DESC']], include: [{ model: InventoryWarehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] }] });
    return buildPaginated(rows, count, { page, limit });
}

async function getStockForProduct(storeId, productId, variantId) {
    const where = { storeId, productId };
    if (variantId) where.variantId = variantId;
    return InventoryStock.findAll({ where, include: [{ model: InventoryWarehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] }] });
}

async function adjustStock(storeId, warehouseId, { sku, productId, variantId, quantity, type, reference, notes, userId }) {
    const wh = await InventoryWarehouse.findOne({ where: { id: warehouseId, storeId } });
    if (!wh) throw new AppError('NOT_FOUND', 'Warehouse not found', 404);

    return sequelize.transaction(async (t) => {
        const [stock] = await InventoryStock.findOrCreate({
            where: { warehouseId, sku },
            defaults: { warehouseId, storeId, productId, variantId, sku, quantity: 0, reservedQuantity: 0 },
            transaction: t,
        });

        const prevQty = stock.quantity;
        let newQty = prevQty;

        if (type === 'inbound' || type === 'return' || type === 'transfer_in') newQty = prevQty + quantity;
        else if (type === 'outbound' || type === 'transfer_out') {
            if (quantity > prevQty - stock.reservedQuantity) throw new AppError('CONFLICT', 'Insufficient available stock', 409);
            newQty = prevQty - quantity;
        } else if (type === 'adjustment') {
            newQty = quantity;
        }

        const stockStatus = newQty === 0 ? 'out_of_stock' : newQty <= stock.lowStockThreshold ? 'low_stock' : 'in_stock';
        await stock.update({ quantity: newQty, status: stockStatus }, { transaction: t });

        await InventoryMovement.create({
            warehouseId, storeId, productId, variantId, sku, type,
            quantity, previousQuantity: prevQty, newQuantity: newQty, reference, notes, createdBy: userId,
        }, { transaction: t });

        return stock.toJSON();
    });
}

async function listMovements(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.type) where.type = query.type;
    if (query.sku) where.sku = { [Op.iLike]: `%${query.sku}%` };
    const { rows, count } = await InventoryMovement.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    return buildPaginated(rows, count, { page, limit });
}

/**
 * Low-stock alert feed: stock rows at or below their threshold (low_stock) or empty
 * (out_of_stock), worst-first. Returns a paginated list PLUS store-wide summary counts
 * (independent of pagination) so the admin dashboard can show a badge without a second call.
 */
async function lowStockAlerts(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const statuses = query.status === 'out_of_stock' || query.status === 'low_stock'
        ? [query.status]
        : ['low_stock', 'out_of_stock'];
    const where = { storeId, status: { [Op.in]: statuses } };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    const { rows, count } = await InventoryStock.findAndCountAll({
        where, limit, offset,
        order: [['quantity', 'ASC'], ['updatedAt', 'DESC']],
        include: [{ model: InventoryWarehouse, as: 'warehouse', attributes: ['id', 'name', 'code'] }],
    });
    const [lowStock, outOfStock] = await Promise.all([
        InventoryStock.count({ where: { storeId, status: 'low_stock' } }),
        InventoryStock.count({ where: { storeId, status: 'out_of_stock' } }),
    ]);
    return { ...buildPaginated(rows, count, { page, limit }), summary: { lowStock, outOfStock, total: lowStock + outOfStock } };
}

module.exports = { listStock, getStockForProduct, adjustStock, listMovements, lowStockAlerts };
