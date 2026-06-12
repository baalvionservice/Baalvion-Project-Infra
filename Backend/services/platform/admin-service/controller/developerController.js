'use strict';
// Developer Platform console controller. Mirrors adminController.js exactly:
//   - thin handlers: parse/clamp input, delegate to developerService, sendSuccess
//   - all errors flow through next(err) to the central error handler
//   - acting admin = req.auth.userId; client ip = req.ip
//
// Paginated endpoints (webhooks/deliveries/sandboxes/changelog) return the console's
// PaginatedResponse shape { success, data:[...], pagination } as the `data` payload of
// the standard envelope — identical to how getRiskEvents wraps listRiskEvents.

const developerService = require('../service/developerService');
const { sendSuccess } = require('../utils/response');

// ── API usage stats ─────────────────────────────────────────────────────────────
exports.getApiStats = async (req, res, next) => {
    try {
        const period = ['1d', '7d', '30d'].includes(req.query.period) ? req.query.period : '7d';
        const result = await developerService.getApiStats({ period });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// ── Webhooks ─────────────────────────────────────────────────────────────────────
exports.listWebhooks = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, orgId } = req.query;
        const result = await developerService.listWebhooks({
            page:  Math.max(1, parseInt(page, 10)),
            limit: Math.min(200, Math.max(1, parseInt(limit, 10))),
            orgId: orgId || undefined,
        });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.getWebhook = async (req, res, next) => {
    try {
        const hook = await developerService.getWebhook(req.params.id);
        sendSuccess(req, res, hook);
    } catch (err) { next(err); }
};

exports.createWebhook = async (req, res, next) => {
    try {
        const { url, description, events, secret, enabled, orgId, org_id } = req.body || {};
        const hook = await developerService.createWebhook(
            { url, description, events, secret, enabled, orgId: orgId !== undefined ? orgId : org_id },
            req.auth.userId, req.ip,
        );
        sendSuccess(req, res, hook, 201);
    } catch (err) { next(err); }
};

exports.updateWebhook = async (req, res, next) => {
    try {
        const { url, description, events, enabled } = req.body || {};
        const hook = await developerService.updateWebhook(
            req.params.id, { url, description, events, enabled }, req.auth.userId, req.ip,
        );
        sendSuccess(req, res, hook);
    } catch (err) { next(err); }
};

exports.deleteWebhook = async (req, res, next) => {
    try {
        const result = await developerService.deleteWebhook(req.params.id, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.testWebhook = async (req, res, next) => {
    try {
        const result = await developerService.testWebhook(req.params.id, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// ── Webhook deliveries ────────────────────────────────────────────────────────────
exports.listDeliveries = async (req, res, next) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const result = await developerService.listDeliveries(req.params.webhookId, {
            page:  Math.max(1, parseInt(page, 10)),
            limit: Math.min(200, Math.max(1, parseInt(limit, 10))),
        });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.retryDelivery = async (req, res, next) => {
    try {
        const result = await developerService.retryDelivery(req.params.deliveryId, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// ── Changelog ───────────────────────────────────────────────────────────────────
exports.listChangelog = async (req, res, next) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const result = await developerService.listChangelog({
            page:  Math.max(1, parseInt(page, 10)),
            limit: Math.min(200, Math.max(1, parseInt(limit, 10))),
        });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// ── SDK registry ──────────────────────────────────────────────────────────────────
exports.listSdks = async (req, res, next) => {
    try {
        const sdks = await developerService.listSdks();
        sendSuccess(req, res, sdks);
    } catch (err) { next(err); }
};

// ── Sandboxes ─────────────────────────────────────────────────────────────────────
exports.listSandboxes = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const result = await developerService.listSandboxes({
            page:  Math.max(1, parseInt(page, 10)),
            limit: Math.min(100, Math.max(1, parseInt(limit, 10))),
        });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.createSandbox = async (req, res, next) => {
    try {
        const { name, orgId, org_id } = req.body || {};
        const sandbox = await developerService.createSandbox(
            { name, orgId: orgId !== undefined ? orgId : org_id }, req.auth.userId, req.ip,
        );
        sendSuccess(req, res, sandbox, 201);
    } catch (err) { next(err); }
};

exports.resetSandbox = async (req, res, next) => {
    try {
        const result = await developerService.resetSandbox(req.params.id, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.deleteSandbox = async (req, res, next) => {
    try {
        const result = await developerService.deleteSandbox(req.params.id, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};
