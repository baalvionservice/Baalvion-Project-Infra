'use strict';
const { z } = require('zod');
const storeRoleEnum = z.enum(['store_admin', 'commerce_manager', 'inventory_manager', 'seo_manager', 'fulfillment_manager', 'support_agent', 'content_editor', 'reviewer']);
exports.createStoreSchema = z.object({ name: z.string().min(1).max(200), code: z.string().min(2).max(20).regex(/^[a-z0-9_]+$/), countryCode: z.string().length(2), currencyCode: z.string().length(3), locale: z.string().max(20).default('en'), timezone: z.string().max(50).default('UTC'), taxInclusive: z.boolean().default(false), defaultTaxRate: z.number().min(0).max(100).default(0), paymentGateways: z.array(z.string()).default([]), shippingConfig: z.record(z.unknown()).default({}), seoConfig: z.record(z.unknown()).default({}) });
exports.updateStoreSchema = z.object({ name: z.string().min(1).max(200).optional(), status: z.enum(['active', 'inactive', 'maintenance']).optional(), taxInclusive: z.boolean().optional(), defaultTaxRate: z.number().min(0).max(100).optional(), paymentGateways: z.array(z.string()).optional(), shippingConfig: z.record(z.unknown()).optional(), seoConfig: z.record(z.unknown()).optional(), meta: z.record(z.unknown()).optional() });
exports.addMemberSchema = z.object({ userId: z.number().int().positive(), role: storeRoleEnum.default('content_editor') });
exports.updateMemberRoleSchema = z.object({ role: storeRoleEnum });
