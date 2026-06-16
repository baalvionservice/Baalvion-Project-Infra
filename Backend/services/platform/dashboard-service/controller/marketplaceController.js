'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

async function _audit(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId, action, entity_type, entity_id,
            user_id: req.user.id, role: req.user.role, resource: req.originalUrl,
            ip_address: req.ip, status: 'Success', severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

exports.get = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const [apps, installs] = await Promise.all([
            db.MarketplaceApp.findAll({ where: { org_id: orgId }, order: [['featured', 'DESC'], ['installs', 'DESC']], raw: true }),
            db.MarketplaceInstall.findAll({ where: { org_id: orgId }, raw: true }),
        ]);
        return sendSuccess(req, res, {
            apps: apps.map((a) => ({
                slug: a.slug, name: a.name, category: a.category, description: a.description,
                rating: Number(a.rating), installs: a.installs, developer: a.developer,
                version: a.version, lastUpdated: a.last_updated, featured: !!a.featured,
                icon: a.icon, permissions: a.permissions || [], pricing: a.pricing,
                features: a.features || [], screenshots: a.screenshots || [], reviews: a.reviews || [],
            })),
            installed: installs.map((i) => i.app_slug),
        });
    } catch (err) { return next(err); }
};

exports.install = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { slug } = req.body;
        if (!slug) return next(new AppError('VALIDATION_ERROR', 'slug is required', 400));
        const app = await db.MarketplaceApp.findOne({ where: { org_id: orgId, slug } });
        if (!app) return next(new AppError('NOT_FOUND', 'App not found', 404));
        const [row] = await db.MarketplaceInstall.findOrCreate({
            where: { org_id: orgId, app_slug: slug },
            defaults: { org_id: orgId, app_slug: slug, installed_at: new Date() },
        });
        await _audit(req, 'INSTALL_APP', 'marketplace_app', slug);
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
};

exports.uninstall = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const slug = req.params.slug;
        const count = await db.MarketplaceInstall.destroy({ where: { org_id: orgId, app_slug: slug } });
        if (!count) return next(new AppError('NOT_FOUND', 'App not installed', 404));
        await _audit(req, 'UNINSTALL_APP', 'marketplace_app', slug);
        return sendSuccess(req, res, { slug, uninstalled: true });
    } catch (err) { return next(err); }
};
