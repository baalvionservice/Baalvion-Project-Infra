'use strict';
const { Op } = require('sequelize');
const { CmsCategory, CmsTag } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');

function buildTree(flat) {
    const map = new Map();
    flat.forEach((c) => map.set(c.id, { ...c.toJSON(), children: [] }));
    const roots = [];
    map.forEach((node) => {
        if (node.parentId && map.has(node.parentId)) {
            map.get(node.parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });
    const sortChildren = (nodes) => {
        nodes.sort((a, b) => a.sortOrder - b.sortOrder);
        nodes.forEach((n) => sortChildren(n.children));
    };
    sortChildren(roots);
    return roots;
}

async function listCategories(websiteId) {
    const cacheKey = cache.keys.categoryTree(websiteId);
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const cats = await CmsCategory.findAll({ where: { websiteId }, order: [['sortOrder', 'ASC']] });
    const tree = buildTree(cats);
    await cache.set(cacheKey, tree, config.cache.taxonomyTtl);
    return tree;
}

async function createCategory(websiteId, body) {
    const { parentId, name, slug: rawSlug, description, seoMetadata, sortOrder } = body;
    const slug = rawSlug || slugify(name);

    const existing = await CmsCategory.findOne({ where: { websiteId, slug } });
    if (existing) throw new AppError('CONFLICT', 'A category with this slug already exists in this website', 409);

    let depth = 0;
    if (parentId) {
        const parent = await CmsCategory.findOne({ where: { id: parentId, websiteId } });
        if (!parent) throw new AppError('NOT_FOUND', 'Parent category not found', 404);
        depth = parent.depth + 1;
    }

    const category = await CmsCategory.create({ websiteId, parentId: parentId || null, name, slug, description, seoMetadata: seoMetadata || {}, sortOrder: sortOrder || 0, depth, status: 'active', contentCount: 0 });
    await cache.del(cache.keys.categoryTree(websiteId));
    return category.toJSON();
}

async function updateCategory(websiteId, categoryId, body) {
    const category = await CmsCategory.findOne({ where: { id: categoryId, websiteId } });
    if (!category) throw new AppError('NOT_FOUND', 'Category not found', 404);

    if (body.parentId !== undefined && body.parentId !== null) {
        if (body.parentId === categoryId) throw new AppError('VALIDATION_ERROR', 'Category cannot be its own parent', 400);
        const parent = await CmsCategory.findOne({ where: { id: body.parentId, websiteId } });
        if (!parent) throw new AppError('NOT_FOUND', 'Parent category not found', 404);
        body.depth = parent.depth + 1;
    }

    await category.update(body);
    await cache.del(cache.keys.categoryTree(websiteId));
    return category.toJSON();
}

async function deleteCategory(websiteId, categoryId) {
    const category = await CmsCategory.findOne({ where: { id: categoryId, websiteId } });
    if (!category) throw new AppError('NOT_FOUND', 'Category not found', 404);

    if (category.contentCount > 0) throw new AppError('CONFLICT', 'Cannot delete a category that has content assigned to it', 409);

    const children = await CmsCategory.count({ where: { parentId: categoryId } });
    if (children > 0) throw new AppError('CONFLICT', 'Cannot delete a category that has subcategories', 409);

    await category.destroy();
    await cache.del(cache.keys.categoryTree(websiteId));
}

async function reorderCategories(websiteId, order) {
    await Promise.all(order.map(({ id, sortOrder }) =>
        CmsCategory.update({ sortOrder }, { where: { id, websiteId } })
    ));
    await cache.del(cache.keys.categoryTree(websiteId));
}

async function listTags(websiteId) {
    const cacheKey = cache.keys.tagList(websiteId);
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const tags = await CmsTag.findAll({ where: { websiteId }, order: [['name', 'ASC']] });
    const data = tags.map((t) => t.toJSON());
    await cache.set(cacheKey, data, config.cache.taxonomyTtl);
    return data;
}

async function createTag(websiteId, body) {
    const { name, slug: rawSlug, description, color } = body;
    const slug = rawSlug || slugify(name);

    const existing = await CmsTag.findOne({ where: { websiteId, slug } });
    if (existing) throw new AppError('CONFLICT', 'A tag with this slug already exists in this website', 409);

    const tag = await CmsTag.create({ websiteId, name, slug, description, color, usageCount: 0 });
    await cache.del(cache.keys.tagList(websiteId));
    return tag.toJSON();
}

async function updateTag(websiteId, tagId, body) {
    const tag = await CmsTag.findOne({ where: { id: tagId, websiteId } });
    if (!tag) throw new AppError('NOT_FOUND', 'Tag not found', 404);

    await tag.update(body);
    await cache.del(cache.keys.tagList(websiteId));
    return tag.toJSON();
}

async function deleteTag(websiteId, tagId) {
    const tag = await CmsTag.findOne({ where: { id: tagId, websiteId } });
    if (!tag) throw new AppError('NOT_FOUND', 'Tag not found', 404);

    await tag.destroy();
    await cache.del(cache.keys.tagList(websiteId));
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, reorderCategories, listTags, createTag, updateTag, deleteTag };
