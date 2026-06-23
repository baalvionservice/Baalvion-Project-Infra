'use strict';

/**
 * Per-tenant, per-app branding. resolveByDomain() is the public entry point every
 * frontend's custom login page / shell calls to theme itself: domain → tenant →
 * branding (app-specific, falling back to the tenant's 'default' app). Results are
 * cached briefly in Redis since they're read on every page load.
 */

const db = require('../models');
const redis = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const { mapBranding } = require('./tenantService');
const { Errors } = require('../utils/errors');

const CACHE_PREFIX = 'tenant:resolve:';

function publicBranding(b, tenant, domain) {
    if (!b) return null;
    const j = b.toJSON ? b.toJSON() : b;
    return {
        tenantId: tenant.id, tenantSlug: tenant.slug, app: j.app, domain,
        brandName: j.brand_name || tenant.name, logoUrl: j.logo_url, logoDarkUrl: j.logo_dark_url, faviconUrl: j.favicon_url,
        primaryColor: j.primary_color, secondaryColor: j.secondary_color, accentColor: j.accent_color,
        loginBgUrl: j.login_bg_url, customCss: j.custom_css, supportEmail: j.support_email, supportUrl: j.support_url,
        emailFrom: j.email_from, theme: j.theme || {},
    };
}

async function upsert(tenantId, app, data) {
    const [row, created] = await db.TenantBranding.findOrCreate({
        where: { tenant_id: tenantId, app: app || 'default' },
        defaults: { tenant_id: tenantId, app: app || 'default', ...mapBranding(data) },
    });
    if (!created) await row.update({ ...mapBranding(data), updated_at: new Date() });
    await invalidateForTenant(tenantId);
    return row.toJSON();
}

async function getForTenant(tenantId, app) {
    const where = { tenant_id: tenantId };
    if (app) where.app = app;
    const rows = await db.TenantBranding.findAll({ where });
    return rows.map((r) => r.toJSON());
}

/** Public: resolve branding for a custom domain (+ optional app override). */
async function resolveByDomain(domain, app = null) {
    if (!domain) throw Errors.badRequest('domain is required');
    const key = `${CACHE_PREFIX}${domain.toLowerCase()}:${app || 'default'}`;
    const r = redis.getClient();
    if (r) { try { const hit = await r.get(key); if (hit) return JSON.parse(hit); } catch (err) { logger.warn({ err: err.message, key }, '[tenant-service] resolve cache read failed — falling through to DB'); } }

    const dom = await db.TenantDomain.findOne({ where: { domain: domain.toLowerCase(), verified: true } });
    if (!dom) throw Errors.notFound('No verified tenant for that domain');
    const tenant = await db.Tenant.findByPk(dom.tenant_id);
    if (!tenant || tenant.status !== 'active') throw Errors.notFound('Tenant inactive');

    const wantApp = app || dom.app || 'default';
    let branding = await db.TenantBranding.findOne({ where: { tenant_id: tenant.id, app: wantApp, enabled: true } });
    if (!branding && wantApp !== 'default') branding = await db.TenantBranding.findOne({ where: { tenant_id: tenant.id, app: 'default', enabled: true } });

    const out = publicBranding(branding || { app: wantApp, brand_name: tenant.name }, tenant, dom.domain);
    if (r) { try { await r.set(key, JSON.stringify(out), 'EX', config.tenant.resolveCacheTtl); } catch (err) { logger.warn({ err: err.message, key }, '[tenant-service] resolve cache write failed — result not cached'); } }
    return out;
}

async function invalidateForTenant(tenantId) {
    const r = redis.getClient();
    if (!r) return;
    try {
        const domains = await db.TenantDomain.findAll({ where: { tenant_id: tenantId } });
        const keys = [];
        for (const d of domains) { const stream = r.scanStream({ match: `${CACHE_PREFIX}${d.domain}:*` }); for await (const batch of stream) keys.push(...batch); }
        if (keys.length) await r.del(keys);
    } catch (err) { logger.warn({ err: err.message, tenantId }, '[tenant-service] resolve cache invalidation failed (best-effort)'); }
}

module.exports = { upsert, getForTenant, resolveByDomain, invalidateForTenant, publicBranding };
