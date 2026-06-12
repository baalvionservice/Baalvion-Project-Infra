'use strict';
const { z } = require('zod');
exports.createDiscountSchema = z.object({ code: z.string().min(1).max(100), name: z.string().min(1).max(200), type: z.enum(['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y']), value: z.number().min(0), minPurchaseAmount: z.number().min(0).optional(), maxDiscountAmount: z.number().min(0).optional(), usageLimit: z.number().int().min(1).optional(), appliesTo: z.enum(['all', 'specific_products', 'specific_categories', 'specific_collections']).default('all'), targetIds: z.array(z.string().uuid()).default([]), isActive: z.boolean().default(true), startsAt: z.string().datetime().optional().nullable(), endsAt: z.string().datetime().optional().nullable() });
exports.updateDiscountSchema = exports.createDiscountSchema.partial();
exports.validateDiscountSchema = z.object({ code: z.string().min(1), orderAmount: z.number().min(0) });
// Public storefront preview: orderAmount is optional (shopper may check a code before a final cart
// total exists). code is length-capped to avoid abusive payloads on the anonymous endpoint.
exports.previewDiscountSchema = z.object({ code: z.string().min(1).max(100), orderAmount: z.number().min(0).optional().default(0) });
