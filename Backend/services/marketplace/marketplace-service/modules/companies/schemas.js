'use strict';
const { z } = require('zod');

// Core company fields a founder controls. Lifecycle fields (status, kyc_status) are owned by
// the submit/review flows — never accepted from the client here.
const createSchema = z.object({
    legal_name: z.string().min(2).max(300),
    brand_name: z.string().max(300).optional(),
    registration_no: z.string().max(60).optional(),
    country: z.string().length(2).optional(),
    industry_code: z.string().max(40).optional(),
    stage: z.enum(['startup', 'sme', 'growth', 'enterprise']).default('startup'),
    website: z.string().url().max(300).optional(),
});

// Partial edit of the core record — at least one field required, all optional individually.
const updateSchema = createSchema.partial().refine(
    (v) => Object.keys(v).length > 0,
    { message: 'Provide at least one field to update' },
);

const profileSchema = z.object({
    summary: z.string().optional(),
    problem: z.string().optional(),
    solution: z.string().optional(),
    traction_json: z.record(z.any()).optional(),
    team_size: z.coerce.number().int().optional(),
    founded_year: z.coerce.number().int().optional(),
    revenue_band: z.string().max(40).optional(),
    funding_raised: z.coerce.number().optional(),
    funding_target: z.coerce.number().optional(),
    valuation_target: z.coerce.number().optional(),
    deck_url: z.string().max(500).optional(),
    is_published: z.boolean().optional(),
});

const founderSchema = z.object({
    name: z.string().min(2).max(200),
    role: z.string().max(120).optional(),
    email: z.string().email().optional(),
    linkedin: z.string().max(300).optional(),
    equity_pct: z.coerce.number().min(0).max(100).optional(),
    bio: z.string().optional(),
});

const documentSchema = z.object({
    type: z.enum(['financial', 'legal', 'ip', 'business_plan', 'cap_table', 'deck']),
    file_url: z.string().min(1).max(600),
    file_size: z.coerce.number().int().optional(),
    mime: z.string().max(120).optional(),
    visibility: z.enum(['private', 'nda', 'approved']).default('private'),
});

module.exports = { createSchema, updateSchema, profileSchema, founderSchema, documentSchema };
