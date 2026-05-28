'use strict';
const { Op } = require('sequelize');
const { CommerceStore, CommerceStoreMember } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listStores(orgId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { organizationId: orgId };
    if (query.status) where.status = query.status;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
    const { rows, count } = await CommerceStore.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    return buildPaginated(rows, count, { page, limit });
}

async function getStore(storeId, orgId) {
    const cached = await cache.get(cache.keys.store(storeId));
    if (cached && cached.organizationId === orgId) return cached;
    const store = await CommerceStore.findOne({ where: { id: storeId, organizationId: orgId } });
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    const data = store.toJSON();
    await cache.set(cache.keys.store(storeId), data, config.cache.storeTtl);
    return data;
}

async function createStore(orgId, userId, body) {
    const existing = await CommerceStore.findOne({ where: { code: body.code } });
    if (existing) throw new AppError('CONFLICT', 'A store with this code already exists', 409);
    const store = await CommerceStore.create({ ...body, organizationId: orgId, createdBy: userId });
    await CommerceStoreMember.create({ storeId: store.id, userId, role: 'store_admin', joinedAt: new Date() });
    await cache.delPattern(`commerce:stores:org:${orgId}*`);
    return store.toJSON();
}

async function updateStore(storeId, orgId, body) {
    const store = await CommerceStore.findOne({ where: { id: storeId, organizationId: orgId } });
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    await store.update(body);
    await cache.del(cache.keys.store(storeId));
    await cache.delPattern(`commerce:stores:org:${orgId}*`);
    return store.toJSON();
}

async function deleteStore(storeId, orgId) {
    const store = await CommerceStore.findOne({ where: { id: storeId, organizationId: orgId } });
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    await store.destroy();
    await cache.del(cache.keys.store(storeId));
    await cache.delPattern(`commerce:stores:org:${orgId}*`);
}

async function listMembers(storeId, orgId) {
    const store = await CommerceStore.findOne({ where: { id: storeId, organizationId: orgId } });
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    return CommerceStoreMember.findAll({ where: { storeId }, order: [['createdAt', 'DESC']] });
}

async function addMember(storeId, orgId, { userId, role }) {
    const store = await CommerceStore.findOne({ where: { id: storeId, organizationId: orgId } });
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    const existing = await CommerceStoreMember.findOne({ where: { storeId, userId } });
    if (existing) throw new AppError('CONFLICT', 'User is already a member of this store', 409);
    return CommerceStoreMember.create({ storeId, userId, role, joinedAt: new Date() });
}

async function updateMemberRole(storeId, orgId, userId, role) {
    const store = await CommerceStore.findOne({ where: { id: storeId, organizationId: orgId } });
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    const member = await CommerceStoreMember.findOne({ where: { storeId, userId } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    await member.update({ role });
    return member.toJSON();
}

async function removeMember(storeId, orgId, userId) {
    const store = await CommerceStore.findOne({ where: { id: storeId, organizationId: orgId } });
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    const member = await CommerceStoreMember.findOne({ where: { storeId, userId } });
    if (!member) throw new AppError('NOT_FOUND', 'Member not found', 404);
    await member.destroy();
}

module.exports = { listStores, getStore, createStore, updateStore, deleteStore, listMembers, addMember, updateMemberRole, removeMember };
