'use strict';
const { CommerceCategory } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');

function buildTree(flat) {
    const map = new Map();
    flat.forEach((c) => map.set(c.id, { ...c.toJSON(), children: [] }));
    const roots = [];
    map.forEach((node) => { if (node.parentId && map.has(node.parentId)) map.get(node.parentId).children.push(node); else roots.push(node); });
    const sort = (arr) => { arr.sort((a, b) => a.sortOrder - b.sortOrder); arr.forEach((n) => sort(n.children)); };
    sort(roots); return roots;
}

async function listCategories(storeId) {
    const cached = await cache.get(cache.keys.categoryTree(storeId));
    if (cached) return cached;
    const cats = await CommerceCategory.findAll({ where: { storeId }, order: [['sortOrder', 'ASC']] });
    const tree = buildTree(cats);
    await cache.set(cache.keys.categoryTree(storeId), tree, config.cache.categoryTtl);
    return tree;
}

async function createCategory(storeId, body) {
    const slug = body.slug || slugify(body.name);
    const existing = await CommerceCategory.findOne({ where: { storeId, slug } });
    if (existing) throw new AppError('CONFLICT', 'Category slug already exists in this store', 409);
    let depth = 0;
    if (body.parentId) {
        const parent = await CommerceCategory.findOne({ where: { id: body.parentId, storeId } });
        if (!parent) throw new AppError('NOT_FOUND', 'Parent category not found', 404);
        depth = parent.depth + 1;
    }
    const cat = await CommerceCategory.create({ ...body, storeId, slug, depth, productCount: 0, isActive: true });
    await cache.del(cache.keys.categoryTree(storeId));
    return cat.toJSON();
}

async function updateCategory(storeId, categoryId, body) {
    const cat = await CommerceCategory.findOne({ where: { id: categoryId, storeId } });
    if (!cat) throw new AppError('NOT_FOUND', 'Category not found', 404);
    await cat.update(body);
    await cache.del(cache.keys.categoryTree(storeId));
    return cat.toJSON();
}

async function deleteCategory(storeId, categoryId) {
    const cat = await CommerceCategory.findOne({ where: { id: categoryId, storeId } });
    if (!cat) throw new AppError('NOT_FOUND', 'Category not found', 404);
    if (cat.productCount > 0) throw new AppError('CONFLICT', 'Cannot delete a category that has products', 409);
    const children = await CommerceCategory.count({ where: { parentId: categoryId } });
    if (children > 0) throw new AppError('CONFLICT', 'Cannot delete a category that has subcategories', 409);
    await cat.destroy();
    await cache.del(cache.keys.categoryTree(storeId));
}

async function reorderCategories(storeId, order) {
    await Promise.all(order.map(({ id, sortOrder }) => CommerceCategory.update({ sortOrder }, { where: { id, storeId } })));
    await cache.del(cache.keys.categoryTree(storeId));
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, reorderCategories };
