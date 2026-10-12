'use strict';
const { z } = require('zod');

exports.profileSchema = z.object({
    displayName: z.string().trim().min(2).max(80),
    headline: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(600).optional(),
    city: z.string().trim().max(80).optional(),
    isFounder: z.boolean().optional(),
    companyName: z.string().trim().max(120).optional(),
    roleTitle: z.string().trim().max(80).optional(),
    lookingFor: z.enum(['dating', 'relationship', 'friendship', 'networking']).optional(),
    interests: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
    photoAssetId: z.string().uuid().nullable().optional(),
    active: z.boolean().optional(),
});
exports.actSchema = z.object({ action: z.enum(['like', 'pass']) });
exports.reportSchema = z.object({ reason: z.string().trim().min(10, 'Tell us what happened').max(500) });
exports.hideSchema = z.object({ hidden: z.boolean(), reason: z.string().trim().max(300).optional() });
