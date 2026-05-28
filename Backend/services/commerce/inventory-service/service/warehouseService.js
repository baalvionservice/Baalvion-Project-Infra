'use strict';
const { Op } = require('sequelize');
const { InventoryWarehouse, InventoryStock } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listWarehouses(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    const { rows, count } = await InventoryWarehouse.findAndCountAll({ where, limit, offset, order: [['isDefault', 'DESC'], ['name', 'ASC']] });
    return buildPaginated(rows, count, { page, limit });
}

async function getWarehouse(storeId, warehouseId) {
    const wh = await InventoryWarehouse.findOne({ where: { id: warehouseId, storeId } });
    if (!wh) throw new AppError('NOT_FOUND', 'Warehouse not found', 404);
    return wh.toJSON();
}

async function createWarehouse(storeId, body) {
    const existing = await InventoryWarehouse.findOne({ where: { storeId, code: body.code } });
    if (existing) throw new AppError('CONFLICT', 'Warehouse code already exists', 409);
    if (body.isDefault) await InventoryWarehouse.update({ isDefault: false }, { where: { storeId } });
    return (await InventoryWarehouse.create({ ...body, storeId })).toJSON();
}

async function updateWarehouse(storeId, warehouseId, body) {
    const wh = await InventoryWarehouse.findOne({ where: { id: warehouseId, storeId } });
    if (!wh) throw new AppError('NOT_FOUND', 'Warehouse not found', 404);
    if (body.isDefault) await InventoryWarehouse.update({ isDefault: false }, { where: { storeId } });
    await wh.update(body);
    return wh.toJSON();
}

async function deleteWarehouse(storeId, warehouseId) {
    const wh = await InventoryWarehouse.findOne({ where: { id: warehouseId, storeId } });
    if (!wh) throw new AppError('NOT_FOUND', 'Warehouse not found', 404);
    if (wh.isDefault) throw new AppError('FORBIDDEN', 'Cannot delete the default warehouse', 403);
    const stockCount = await InventoryStock.count({ where: { warehouseId, quantity: { [Op.gt]: 0 } } });
    if (stockCount > 0) throw new AppError('CONFLICT', 'Warehouse has active stock. Transfer stock before deleting.', 409);
    await wh.destroy();
}

module.exports = { listWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse };
