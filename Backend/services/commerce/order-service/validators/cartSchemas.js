'use strict';
const { z } = require('zod');

exports.createCartSchema = z.object({
    currencyCode: z.string().length(3).default('USD'),
    customerId: z.string().uuid().optional().nullable(),
    sessionId: z.string().max(128).optional(),
});

exports.addCartItemSchema = z.object({
    productId: z.string().uuid().optional().nullable(),
    variantId: z.string().uuid().optional().nullable(),
    sku: z.string().min(1).max(200),
    name: z.string().min(1).max(500),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    metadata: z.record(z.unknown()).default({}),
});

exports.updateCartItemSchema = z.object({
    variantId: z.string().uuid().optional().nullable(),
    productId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().min(0),
});

// Admin (cross-store) cart visibility query params — see adminCartRoutes.js.
exports.adminListCartsQuerySchema = z.object({
    storeId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});
exports.adminListAbandonedCartsQuerySchema = exports.adminListCartsQuerySchema.extend({
    abandonedAfterMinutes: z.coerce.number().int().min(1).max(10080).optional(),
});
exports.adminCartHistoryQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});
