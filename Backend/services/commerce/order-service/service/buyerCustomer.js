'use strict';
const { OrdersCustomer } = require('../models');

// The customer row for a signed-in buyer in this store, created from the order's address the first
// time. Never adopts an existing row that belongs to someone else or to a guest (the email is
// unique per store): in that case the order simply stays unlinked, as it was before.
async function ensureBuyerCustomer(storeId, userId, address) {
    const existing = await OrdersCustomer.findOne({ where: { storeId, userId }, attributes: ['id'], order: [['createdAt', 'ASC']] });
    if (existing) return existing.id;
    const email = address && address.email ? String(address.email).trim().toLowerCase() : '';
    if (!email || !address.firstName || !address.lastName) return null;
    try {
        const created = await OrdersCustomer.create({
            storeId, userId, email, firstName: address.firstName, lastName: address.lastName, phone: address.phone || null,
        });
        return created.id;
    } catch (err) {
        if (err && err.name === 'SequelizeUniqueConstraintError') return null;
        throw err;
    }
}

module.exports = { ensureBuyerCustomer };
