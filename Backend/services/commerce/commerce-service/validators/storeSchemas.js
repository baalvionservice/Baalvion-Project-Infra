'use strict';
const { z } = require('zod');
// Store-team roles are RBAC roles now (assigned at scope_id = storeId). Keep this list in
// sync with COMMERCE_STORE_ROLES in service/commerceAuthz.js.
const storeRoleEnum = z.enum(['store_admin', 'product_manager', 'ops_manager', 'seo_manager', 'store_viewer']);
exports.createStoreSchema = z.object({ name: z.string().min(1).max(200), code: z.string().min(2).max(20).regex(/^[a-z0-9_]+$/), countryCode: z.string().length(2), currencyCode: z.string().length(3), locale: z.string().max(20).default('en'), timezone: z.string().max(50).default('UTC'), taxInclusive: z.boolean().default(false), defaultTaxRate: z.number().min(0).max(100).default(0), paymentGateways: z.array(z.string()).default([]), shippingConfig: z.record(z.unknown()).default({}), seoConfig: z.record(z.unknown()).default({}) });
exports.updateStoreSchema = z.object({ name: z.string().min(1).max(200).optional(), status: z.enum(['active', 'inactive', 'maintenance']).optional(), taxInclusive: z.boolean().optional(), defaultTaxRate: z.number().min(0).max(100).optional(), paymentGateways: z.array(z.string()).optional(), shippingConfig: z.record(z.unknown()).optional(), seoConfig: z.record(z.unknown()).optional(), meta: z.record(z.unknown()).optional() });
// userId is the platform user id (RBAC role_assignments.user_id is VARCHAR) — accept the
// JWT `sub` as a string; coerce numeric ids for backward compatibility.
exports.addMemberSchema = z.object({ userId: z.coerce.string().min(1).max(64), role: storeRoleEnum.default('store_viewer') });
exports.updateMemberRoleSchema = z.object({ role: storeRoleEnum });
