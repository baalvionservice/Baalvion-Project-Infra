'use strict';
const { z } = require('zod');
const tenantService = require('../services/tenantService');
const brandingService = require('../services/brandingService');
const domainService = require('../services/domainService');
const entitlementService = require('../services/entitlementService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { orgScope } = require('../middleware/guards');

function parse(schema, body) {
    const r = schema.safeParse(body);
    if (!r.success) throw new AppError('VALIDATION_ERROR', 'Invalid request body', 422, r.error.flatten());
    return r.data;
}

const brandingShape = z.object({
    app: z.string().max(64).optional(), brandName: z.string().max(160).optional(), logoUrl: z.string().optional(),
    logoDarkUrl: z.string().optional(), faviconUrl: z.string().optional(), primaryColor: z.string().max(16).optional(),
    secondaryColor: z.string().max(16).optional(), accentColor: z.string().max(16).optional(), loginBgUrl: z.string().optional(),
    customCss: z.string().optional(), supportEmail: z.string().optional(), supportUrl: z.string().optional(),
    emailFrom: z.string().optional(), theme: z.record(z.any()).optional(), enabled: z.boolean().optional(),
}).strip();

const createShape = z.object({
    slug: z.string().min(3).max(64), name: z.string().min(1).max(160), plan: z.string().max(48).optional(),
    parentTenantId: z.string().uuid().optional(), ownerOrgId: z.string().max(128).optional(),
    ownerUserId: z.string().max(64).optional(), contactEmail: z.string().email().optional(), metadata: z.record(z.any()).optional(),
}).strip();

// ── tenants ──
exports.create     = async (req, res) => sendSuccess(req, res, await tenantService.create(parse(createShape, req.body || {}), req.auth), 201);
exports.provision  = async (req, res) => sendSuccess(req, res, await tenantService.provision(parse(createShape.extend({ branding: brandingShape.optional(), entitlements: z.array(z.object({ featureKey: z.string(), enabled: z.boolean().optional(), limitValue: z.number().nullable().optional(), metadata: z.record(z.any()).optional() })).optional() }), req.body || {}), req.auth), 201);
exports.list       = async (req, res) => sendSuccess(req, res, await tenantService.list(orgScope(req), req.query));
exports.get        = async (req, res) => sendSuccess(req, res, await tenantService.getFull(req.params.id, orgScope(req)));
exports.update     = async (req, res) => sendSuccess(req, res, await tenantService.update(req.params.id, parse(createShape.partial(), req.body || {}), orgScope(req)));
exports.setStatus  = async (req, res) => sendSuccess(req, res, await tenantService.setStatus(req.params.id, parse(z.object({ status: z.enum(['active', 'suspended', 'archived']) }), req.body || {}).status, orgScope(req)));
exports.remove     = async (req, res) => sendSuccess(req, res, await tenantService.remove(req.params.id, orgScope(req)));

// ── branding ──
exports.getBranding = async (req, res) => { await tenantService.get(req.params.id, orgScope(req)); sendSuccess(req, res, await brandingService.getForTenant(req.params.id, req.query.app)); };
exports.upsertBranding = async (req, res) => {
    await tenantService.get(req.params.id, orgScope(req));
    const b = parse(brandingShape, req.body || {});
    sendSuccess(req, res, await brandingService.upsert(req.params.id, b.app || 'default', b), 201);
};

// ── domains ──
exports.listDomains = async (req, res) => { await tenantService.get(req.params.id, orgScope(req)); sendSuccess(req, res, await domainService.list(req.params.id)); };
exports.addDomain = async (req, res) => {
    await tenantService.get(req.params.id, orgScope(req));
    const b = parse(z.object({ domain: z.string(), app: z.string().max(64).optional(), isPrimary: z.boolean().optional() }), req.body || {});
    sendSuccess(req, res, await domainService.add({ tenantId: req.params.id, ...b }), 201);
};
exports.verifyDomain = async (req, res) => {
    await tenantService.get(req.params.id, orgScope(req));
    const force = (String(req.query.force) === 'true' || req.body?.force === true) && (req.internal || (req.auth?.roles || []).includes('super_admin'));
    sendSuccess(req, res, await domainService.verify({ id: req.params.domainId, tenantId: req.params.id, force }));
};
exports.setPrimaryDomain = async (req, res) => { await tenantService.get(req.params.id, orgScope(req)); sendSuccess(req, res, await domainService.setPrimary({ id: req.params.domainId, tenantId: req.params.id })); };
exports.removeDomain = async (req, res) => { await tenantService.get(req.params.id, orgScope(req)); sendSuccess(req, res, await domainService.remove({ id: req.params.domainId, tenantId: req.params.id })); };

// ── entitlements ──
exports.listEntitlements = async (req, res) => { await tenantService.get(req.params.id, orgScope(req)); sendSuccess(req, res, await entitlementService.list(req.params.id)); };
exports.setEntitlement = async (req, res) => {
    await tenantService.get(req.params.id, orgScope(req));
    const b = parse(z.object({ featureKey: z.string().min(1).max(96), enabled: z.boolean().optional(), limitValue: z.number().int().nullable().optional(), metadata: z.record(z.any()).optional() }), req.body || {});
    sendSuccess(req, res, await entitlementService.set(req.params.id, b), 201);
};
exports.checkEntitlement = async (req, res) => { await tenantService.get(req.params.id, orgScope(req)); sendSuccess(req, res, await entitlementService.check(req.params.id, req.params.featureKey)); };
exports.consumeEntitlement = async (req, res) => { await tenantService.get(req.params.id, orgScope(req)); sendSuccess(req, res, await entitlementService.consume(req.params.id, req.params.featureKey, Number(req.body?.amount) || 1)); };
exports.removeEntitlement = async (req, res) => { await tenantService.get(req.params.id, orgScope(req)); sendSuccess(req, res, await entitlementService.remove(req.params.id, req.params.featureKey)); };

// ── public resolve (no auth) ──
exports.resolve = async (req, res) => {
    const domain = req.query.domain || req.headers['x-forwarded-host'] || req.headers.host;
    sendSuccess(req, res, await brandingService.resolveByDomain(domain, req.query.app || null));
};
