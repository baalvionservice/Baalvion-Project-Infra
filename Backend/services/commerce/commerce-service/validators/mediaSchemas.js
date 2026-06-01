'use strict';
const { z } = require('zod');

exports.updateMediaSchema = z.object({
    altText: z.string().max(500).optional().nullable(),
    variantId: z.string().uuid().optional().nullable(),
    isFeatured: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

exports.reorderMediaSchema = z.object({
    orderedIds: z.array(z.string().uuid()).min(1).max(50),
});
