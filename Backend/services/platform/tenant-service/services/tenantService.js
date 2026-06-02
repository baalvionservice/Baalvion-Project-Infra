'use strict';

/**
 * Tenant registry + provisioning. A tenant is the white-label unit: it owns
 * branding (per app), custom domains, and feature entitlements. provision()
 * creates the tenant with sensible default branding/entitlements in one call and
 * emits `tenant.provisioned`.
 */

const db = require('../models');
const events = require('./events');
const { Errors } = require('../utils/errors');

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

function assertSlug(slug) {
    if (!SLUG_RE.test(String(slug || ''))) throw Errors.badRequest('slug must be 3-64 chars, lowercase alphanumeric + hyphens');
}

async function create(data, actor) {
    assertSlug(data.slug);
    const existing = await db.Tenant.findOne({ where: { slug: data.slug } });
    if (existing) throw Errors.conflict(`Tenant slug '${data.slug}' already exists`);
    const t = await db.Tenant.create({
        slug: data.slug, name: data.name, plan: data.plan || 'standard',
        parent_tenant_id: data.parentTenantId ?? null,
        owner_org_id: data.ownerOrgId ?? actor?.orgId ?? null, owner_user_id: data.ownerUserId ?? actor?.userId ?? null,
        contact_email: data.contactEmail ?? null, metadata: data.metadata ?? {}, created_by: actor?.userId ?? null,
    });
    return t.toJSON();
}

/** One-shot provisioning: tenant + default branding + seed entitlements. */
async function provision(data, actor) {
    const t = await create(data, actor);
    if (data.branding) {
        await db.TenantBranding.create({ tenant_id: t.id, app: data.branding.app || 'default', ...mapBranding(data.branding) });
    } else {
        await db.TenantBranding.create({ tenant_id: t.id, app: 'default', brand_name: data.name });
    }
    const ents = data.entitlements || [];
    for (const e of ents) {
        await db.TenantEntitlement.create({ tenant_id: t.id, feature_key: e.featureKey, enabled: e.enabled !== false, limit_value: e.limitValue ?? null, metadata: e.metadata ?? {} });
    }
    await events.publish('tenant.provisioned', { tenantId: t.id, slug: t.slug, orgId: t.owner_org_id, plan: t.plan });
    return getFull(t.id);
}

function mapBranding(b = {}) {
    return {
        brand_name: b.brandName ?? null, logo_url: b.logoUrl ?? null, logo_dark_url: b.logoDarkUrl ?? null,
        favicon_url: b.faviconUrl ?? null, primary_color: b.primaryColor ?? null, secondary_color: b.secondaryColor ?? null,
        accent_color: b.accentColor ?? null, login_bg_url: b.loginBgUrl ?? null, custom_css: b.customCss ?? null,
        support_email: b.supportEmail ?? null, support_url: b.supportUrl ?? null, email_from: b.emailFrom ?? null,
        theme: b.theme ?? {}, enabled: b.enabled !== false,
    };
}

async function list(orgScope, { status, plan, limit = 50, offset = 0 } = {}) {
    const where = {};
    if (orgScope) where.owner_org_id = orgScope;
    if (status) where.status = status;
    if (plan) where.plan = plan;
    const { rows, count } = await db.Tenant.findAndCountAll({
        where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 50, 200), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => r.toJSON()), total: count };
}

async function get(id, orgScope) {
    const t = await db.Tenant.findByPk(id);
    if (!t) throw Errors.notFound('Tenant not found');
    if (orgScope && t.owner_org_id && t.owner_org_id !== orgScope) throw Errors.forbidden('Tenant belongs to another organization');
    return t;
}

async function getFull(id, orgScope) {
    const t = await get(id, orgScope);
    const [branding, domains, entitlements] = await Promise.all([
        db.TenantBranding.findAll({ where: { tenant_id: id } }),
        db.TenantDomain.findAll({ where: { tenant_id: id } }),
        db.TenantEntitlement.findAll({ where: { tenant_id: id } }),
    ]);
    return { ...t.toJSON(), branding: branding.map((b) => b.toJSON()), domains: domains.map((d) => d.toJSON()), entitlements: entitlements.map((e) => e.toJSON()) };
}

async function update(id, data, orgScope) {
    const t = await get(id, orgScope);
    const patch = {};
    for (const [k, col] of [['name', 'name'], ['plan', 'plan'], ['contactEmail', 'contact_email'], ['metadata', 'metadata'], ['parentTenantId', 'parent_tenant_id']]) {
        if (data[k] !== undefined) patch[col] = data[k];
    }
    patch.updated_at = new Date();
    await t.update(patch);
    return t.toJSON();
}

async function setStatus(id, status, orgScope) {
    if (!['active', 'suspended', 'archived'].includes(status)) throw Errors.badRequest('Invalid status');
    const t = await get(id, orgScope);
    await t.update({ status, updated_at: new Date() });
    await events.publish(`tenant.${status}`, { tenantId: t.id, slug: t.slug });
    return t.toJSON();
}

async function remove(id, orgScope) {
    const t = await get(id, orgScope);
    await t.destroy();
    return { id, deleted: true };
}

module.exports = { create, provision, list, get, getFull, update, setStatus, remove, mapBranding, assertSlug };
