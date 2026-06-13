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
