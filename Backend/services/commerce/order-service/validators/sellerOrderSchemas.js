'use strict';
const { z } = require('zod');

exports.rateBuyerSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional(),
});

exports.sellerStatusSchema = z.object({ status: z.enum(['confirmed', 'processing', 'shipped', 'delivered']) });
