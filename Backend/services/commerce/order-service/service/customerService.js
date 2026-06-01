'use strict';
const { Op } = require('sequelize');
const { OrdersCustomer, OrdersAddress } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const ownership = require('./ownership');

// A customer record is owned by the authenticated user it belongs to (OrdersCustomer.userId).
// Reads/updates of a single customer (and their addresses) enforce owner-OR-staff.
async function loadOwnedCustomer(storeId, customerId, actor, action, options = {}) {
    const customer = await OrdersCustomer.findOne({ where: { id: customerId, storeId }, ...options });
    if (!customer) throw new AppError('NOT_FOUND', 'Customer not found', 404);
    await ownership.enforce(actor, customer.userId, { resourceType: 'customer', resourceId: customerId, storeId, action });
    return customer;
}

// Admin-only (gated by requireStoreRole at the route) — lists all customers in a store.
async function listCustomers(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.search) where[Op.or] = [{ email: { [Op.iLike]: `%${query.search}%` } }, { firstName: { [Op.iLike]: `%${query.search}%` } }, { lastName: { [Op.iLike]: `%${query.search}%` } }];
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    const { rows, count } = await OrdersCustomer.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    return buildPaginated(rows, count, { page, limit });
}

async function getCustomer(storeId, customerId, actor) {
    const cached = await cache.get(cache.keys.customer(customerId));
    if (cached && cached.storeId === storeId) {
        await ownership.enforce(actor, cached.userId, { resourceType: 'customer', resourceId: customerId, storeId, action: 'customer.read' });
        return cached;
    }
    const customer = await loadOwnedCustomer(storeId, customerId, actor, 'customer.read', { include: [{ model: OrdersAddress, as: 'addresses' }] });
    const data = customer.toJSON();
    await cache.set(cache.keys.customer(customerId), data, config.cache.customerTtl);
    return data;
}

async function upsertCustomer(storeId, { email, firstName, lastName, phone, userId }, actor) {
    // Owner (userId) is the authenticated caller — set server-side by the controller. Idempotent
    // by (storeId, email). IDOR guard: if the matched record is already owned by someone ELSE,
    // only that owner (or store staff) may update it; an ownerless record is claimed by the caller.
    const [customer, created] = await OrdersCustomer.findOrCreate({
        where: { storeId, email: email.toLowerCase() },
        defaults: { storeId, email: email.toLowerCase(), firstName, lastName, phone, userId },
    });
    if (!created) {
        if (customer.userId != null) {
            await ownership.enforce(actor, customer.userId, { resourceType: 'customer', resourceId: customer.id, storeId, action: 'customer.upsert' });
        }
        const patch = { firstName, lastName, phone: phone || customer.phone };
        if (customer.userId == null && userId != null) patch.userId = userId; // claim an ownerless record
        await customer.update(patch);
    }
    await cache.del(cache.keys.customer(customer.id));
    return customer.toJSON();
}

async function updateCustomer(storeId, customerId, body, actor) {
    const customer = await loadOwnedCustomer(storeId, customerId, actor, 'customer.update');
    await customer.update(body);
    await cache.del(cache.keys.customer(customerId));
    await cache.delPattern(cache.keys.customerList(storeId));
    return customer.toJSON();
}

async function listAddresses(storeId, customerId, actor) {
    await loadOwnedCustomer(storeId, customerId, actor, 'address.read');
    return OrdersAddress.findAll({ where: { customerId }, order: [['isDefault', 'DESC'], ['createdAt', 'DESC']] });
}

async function addAddress(storeId, customerId, body, actor) {
    await loadOwnedCustomer(storeId, customerId, actor, 'address.create');
    if (body.isDefault) await OrdersAddress.update({ isDefault: false }, { where: { customerId } });
    return OrdersAddress.create({ ...body, customerId, storeId });
}

async function updateAddress(storeId, customerId, addressId, body, actor) {
    await loadOwnedCustomer(storeId, customerId, actor, 'address.update');
    const address = await OrdersAddress.findOne({ where: { id: addressId, customerId, storeId } });
    if (!address) throw new AppError('NOT_FOUND', 'Address not found', 404);
    if (body.isDefault) await OrdersAddress.update({ isDefault: false }, { where: { customerId } });
    await address.update(body);
    return address.toJSON();
}

async function deleteAddress(storeId, customerId, addressId, actor) {
    await loadOwnedCustomer(storeId, customerId, actor, 'address.delete');
    const address = await OrdersAddress.findOne({ where: { id: addressId, customerId, storeId } });
    if (!address) throw new AppError('NOT_FOUND', 'Address not found', 404);
    if (address.isDefault) throw new AppError('FORBIDDEN', 'Cannot delete the default address', 403);
    await address.destroy();
}

module.exports = { listCustomers, getCustomer, upsertCustomer, updateCustomer, listAddresses, addAddress, updateAddress, deleteAddress };
