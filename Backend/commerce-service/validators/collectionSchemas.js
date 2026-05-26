'use strict';
const { z } = require('zod');
exports.createCollectionSchema = z.object({ name: z.string().min(1).max(200), slug: z.string().max(200).regex(/^[a-z0-9-]+$/).optional(), description: z.string().max(2000).optional(), imageUrl: z.string().url().optional(), seoMetadata: z.record(z.unknown()).default({}), sortOrder: z.number().int().default(0), isActive: z.boolean().default(true) });
exports.updateCollectionSchema = z.object({ name: z.string().max(200).optional(), description: z.string().max(2000).optional().nullable(), imageUrl: z.string().url().optional().nullable(), seoMetadata: z.record(z.unknown()).optional(), sortOrder: z.number().int().optional(), isActive: z.boolean().optional() });
