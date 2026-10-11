'use strict';
const { z } = require('zod');

exports.joinSchema = z.object({
    males: z.number().int().min(0).max(10),
    females: z.number().int().min(0).max(10),
    note: z.string().trim().max(300).optional(),
}).refine((d) => d.males + d.females >= 1, { message: 'Add at least one guest' });
exports.decideSchema = z.object({ approve: z.boolean() });
