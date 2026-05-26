'use strict';
const { z } = require('zod');

exports.createWarehouseSchema = z.object({
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(50),
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    countryCode: z.string().length(2),
    isDefault: z.boolean().default(false),
    metadata: z.record(z.unknown()).default({}),
});

exports.updateWarehouseSchema = exports.createWarehouseSchema.partial();

exports.adjustStockSchema = z.object({
    sku: z.string().min(1).max(200),
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().min(1),
    type: z.enum(['inbound', 'outbound', 'adjustment', 'transfer_in', 'transfer_out', 'return']),
    reference: z.string().max(200).optional(),
    notes: z.string().max(1000).optional(),
});
