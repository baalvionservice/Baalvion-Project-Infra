'use strict';
const db = require('../models');
const { Errors } = require('../utils/errors');
const { SCOPE, TENANT_TYPES } = require('../config/systemRoles');

const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 150);

function serialize(t) {
    if (!t) return null;
    return {
        id: t.id, type: t.type, parentId: t.parent_id, externalRef: t.external_ref,
        name: t.name, slug: t.slug, status: t.status,
        attributes: t.attributes || {}, metadata: t.metadata || {},
        createdAt: t.created_at, updatedAt: t.updated_at,
    };
}

/** The single root tenant. Created by the seed; everything hangs off it. */
async function getPlatformTenant() {
    return db.Tenant.findOne({ where: { type: SCOPE.PLATFORM } });
}

async function getTenant(id) {
    const t = await db.Tenant.findByPk(id);
    if (!t) throw Errors.notFound('Tenant not found');
    return t;
}

async function listTenants({ type, parentId } = {}) {
    const where = {};
    if (type) where.type = type;
    if (parentId) where.parent_id = parentId;
    const rows = await db.Tenant.findAll({ where, order: [['type', 'ASC'], ['name', 'ASC']] });
    return rows.map(serialize);
}

async function createTenant({ type, parentId, externalRef, name, slug, attributes, metadata }, actorId) {
    if (!TENANT_TYPES.includes(type)) throw Errors.badRequest(`type must be one of ${TENANT_TYPES.join(', ')}`);
    if (type === SCOPE.PLATFORM) throw Errors.badRequest('The platform tenant is created by the seed and cannot be created via API');

    // Enforce the tree shape: country under platform, organization under country|platform.
    const parent = parentId ? await getTenant(parentId) : await getPlatformTenant();
    if (!parent) throw Errors.badRequest('No parent tenant available — run the seed first');
    if (type === SCOPE.COUNTRY && parent.type !== SCOPE.PLATFORM) {
        throw Errors.badRequest('A country tenant must hang off the platform tenant');
    }
    if (type === SCOPE.ORGANIZATION && ![SCOPE.PLATFORM, SCOPE.COUNTRY].includes(parent.type)) {
        throw Errors.badRequest('An organization tenant must hang off a platform or country tenant');
    }

    try {
        const t = await db.Tenant.create({
            type, parent_id: parent.id, external_ref: externalRef || null,
            name, slug: slug ? slugify(slug) : slugify(name),
            attributes: attributes || {}, metadata: metadata || {}, created_by: actorId || null,
        });
        return serialize(t);
    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') throw Errors.conflict('A tenant with that slug or (type, externalRef) already exists');
        throw e;
    }
}

/** Walk parent links to the root — used by scope authorization checks. */
async function getAncestors(tenantId) {
    const chain = [];
    let current = await db.Tenant.findByPk(tenantId);
    const guard = new Set();
    while (current && current.parent_id && !guard.has(current.parent_id)) {
        guard.add(current.parent_id);
        current = await db.Tenant.findByPk(current.parent_id);
        if (current) chain.push(current);
    }
    return chain;
}

/** True if `ancestorId` is `tenantId` or any of its ancestors. */
async function isWithin(tenantId, ancestorId) {
    if (!tenantId || !ancestorId) return false;
    if (tenantId === ancestorId) return true;
    const ancestors = await getAncestors(tenantId);
    return ancestors.some((a) => a.id === ancestorId);
}

module.exports = { serialize, getPlatformTenant, getTenant, listTenants, createTenant, getAncestors, isWithin, slugify };
