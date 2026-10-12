'use strict';
const { z } = require('zod');

// Only departments that exist; the labels live with the frontend.
const DEPARTMENTS = ['clubs_team', 'marketplace_team', 'support_team', 'forum_moderation', 'education_team', 'events_team', 'account_access', 'other'];

exports.DEPARTMENTS = DEPARTMENTS;
exports.profileSchema = z.object({
    bio: z.string().trim().max(300).optional(),
    city: z.string().trim().max(80).optional(),
    interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    learnGoal: z.string().trim().max(500).optional(),
    handle: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,29}$/, 'Use 3 to 30 letters, numbers, dashes or underscores').or(z.literal('')).optional(),
    publicProfile: z.boolean().optional(),
    searchIndex: z.boolean().optional(),
    isFounder: z.boolean().optional(),
    companyName: z.string().trim().max(120).optional(),
    roleTitle: z.string().trim().max(80).optional(),
    publicName: z.string().trim().max(80).optional(),
    headline: z.string().trim().max(120).optional(),
    knownFor: z.string().trim().max(600).optional(),
    socialLinks: z.record(z.string(), z.string().trim().max(300)).optional(),
    gender: z.enum(['woman', 'man', 'other', '']).optional(),
    photoAssetId: z.string().uuid().nullable().optional(),
});
exports.requestSchema = z.object({
    department: z.enum(DEPARTMENTS),
    message: z.string().trim().min(10, 'Tell us in a sentence or two why you want to join').max(600),
});
exports.decisionSchema = z.object({
    approve: z.boolean(),
    note: z.string().trim().max(300).optional(),
});
