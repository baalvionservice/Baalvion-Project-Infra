'use strict';
const { Op } = require('sequelize');
const { CommerceDiscount } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listDiscounts(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    const { rows, count } = await CommerceDiscount.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    return buildPaginated(rows, count, { page, limit });
}

async function createDiscount(storeId, body) {
    const existing = await CommerceDiscount.findOne({ where: { storeId, code: body.code.toUpperCase() } });
    if (existing) throw new AppError('CONFLICT', 'Discount code already exists', 409);
    return CommerceDiscount.create({ ...body, storeId, code: body.code.toUpperCase(), usageCount: 0 });
}

async function updateDiscount(storeId, discountId, body) {
    const discount = await CommerceDiscount.findOne({ where: { id: discountId, storeId } });
    if (!discount) throw new AppError('NOT_FOUND', 'Discount not found', 404);
    await discount.update(body);
    return discount.toJSON();
}

async function deleteDiscount(storeId, discountId) {
    const discount = await CommerceDiscount.findOne({ where: { id: discountId, storeId } });
    if (!discount) throw new AppError('NOT_FOUND', 'Discount not found', 404);
    await discount.destroy();
}

async function validateDiscount(storeId, code, orderAmount) {
    const now = new Date();
    const discount = await CommerceDiscount.findOne({
        where: {
            storeId, code: code.toUpperCase(), isActive: true,
            [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }],
            [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gte]: now } }],
        },
    });
    if (!discount) throw new AppError('NOT_FOUND', 'Invalid or expired discount code', 404);
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) throw new AppError('CONFLICT', 'Discount usage limit reached', 409);
    if (discount.minPurchaseAmount && orderAmount < parseFloat(discount.minPurchaseAmount)) {
        throw new AppError('VALIDATION_ERROR', `Minimum purchase amount of ${discount.minPurchaseAmount} required`, 400);
    }
    let discountAmount = 0;
    if (discount.type === 'percentage') discountAmount = Math.min(orderAmount * parseFloat(discount.value) / 100, discount.maxDiscountAmount || Infinity);
    else if (discount.type === 'fixed_amount') discountAmount = Math.min(parseFloat(discount.value), orderAmount);
    return { discount: discount.toJSON(), discountAmount };
}

module.exports = { listDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscount };
