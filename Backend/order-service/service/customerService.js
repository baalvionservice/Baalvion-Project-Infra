'use strict';
const { Op } = require('sequelize');
const { OrdersCustomer, OrdersAddress } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listCustomers(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.search) where[Op.or] = [{ email: { [Op.iLike]: `%${query.search}%` } }, { firstName: { [Op.iLike]: `%${query.search}%` } }, { lastName: { [Op.iLike]: `%${query.search}%` } }];
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    const { rows, count } = await OrdersCustomer.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    return buildPaginated(rows, count, { page, limit });
}

async function getCustomer(storeId, customerId) {
    const cached = await cache.get(cache.keys.customer(customerId));
    if (cached && cached.storeId === storeId) return cached;
    const customer = await OrdersCustomer.findOne({ where: { id: customerId, storeId }, include: [{ model: OrdersAddress, as: 'addresses' }] });
    if (!customer) throw new AppError('NOT_FOUND', 'Customer not found', 404);
    const data = customer.toJSON();
    await cache.set(cache.keys.customer(customerId), data, config.cache.customerTtl);
    return data;
}

async function upsertCustomer(storeId, { email, firstName, lastName, phone, userId }) {
    const [customer, created] = await OrdersCustomer.findOrCreate({
        where: { storeId, email: email.toLowerCase() },
        defaults: { storeId, email: email.toLowerCase(), firstName, lastName, phone, userId },
    });
    if (!created) await customer.update({ firstName, lastName, phone: phone || customer.phone });
    await cache.del(cache.keys.customer(customer.id));
    return customer.toJSON();
}

async function updateCustomer(storeId, customerId, body) {
    const customer = await OrdersCustomer.findOne({ where: { id: customerId, storeId } });
    if (!customer) throw new AppError('NOT_FOUND', 'Customer not found', 404);
    await customer.update(body);
    await cache.del(cache.keys.customer(customerId));
    await cache.delPattern(cache.keys.customerList(storeId));
    return customer.toJSON();
}

async function listAddresses(storeId, customerId) {
    const customer = await OrdersCustomer.findOne({ where: { id: customerId, storeId } });
    if (!customer) throw new AppError('NOT_FOUND', 'Customer not found', 404);
    return OrdersAddress.findAll({ where: { customerId }, order: [['isDefault', 'DESC'], ['createdAt', 'DESC']] });
}

async function addAddress(storeId, customerId, body) {
    const customer = await OrdersCustomer.findOne({ where: { id: customerId, storeId } });
    if (!customer) throw new AppError('NOT_FOUND', 'Customer not found', 404);
    if (body.isDefault) await OrdersAddress.update({ isDefault: false }, { where: { customerId } });
    return OrdersAddress.create({ ...body, customerId, storeId });
}

async function updateAddress(storeId, customerId, addressId, body) {
    const address = await OrdersAddress.findOne({ where: { id: addressId, customerId, storeId } });
    if (!address) throw new AppError('NOT_FOUND', 'Address not found', 404);
    if (body.isDefault) await OrdersAddress.update({ isDefault: false }, { where: { customerId } });
    await address.update(body);
    return address.toJSON();
}

async function deleteAddress(storeId, customerId, addressId) {
    const address = await OrdersAddress.findOne({ where: { id: addressId, customerId, storeId } });
    if (!address) throw new AppError('NOT_FOUND', 'Address not found', 404);
    if (address.isDefault) throw new AppError('FORBIDDEN', 'Cannot delete the default address', 403);
    await address.destroy();
}

module.exports = { listCustomers, getCustomer, upsertCustomer, updateCustomer, listAddresses, addAddress, updateAddress, deleteAddress };
