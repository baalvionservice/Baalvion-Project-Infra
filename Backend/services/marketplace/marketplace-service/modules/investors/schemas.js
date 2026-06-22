'use strict';
const { z } = require('zod');

const createSchema = z.object({
    type: z.enum(['angel', 'vc', 'family_office', 'pe', 'institutional', 'corporate', 'strategic']),
    legal_name: z.string().min(2).max(300),
    country: z.string().length(2).optional(),
});

// Core editable fields (compliance-managed status fields are not accepted here).
const updateSchema = z.object({
    type: z.enum(['angel', 'vc', 'family_office', 'pe', 'institutional', 'corporate', 'strategic']).optional(),
    legal_name: z.string().min(2).max(300).optional(),
    country: z.string().length(2).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

const profileSchema = z.object({
    thesis: z.string().optional(),
    aum_band: z.string().max(40).optional(),
    website: z.string().max(300).optional(),
    contact_email: z.string().email().optional(),
});

const preferencesSchema = z.object({
    industries: z.array(z.string()).optional(),
    stages: z.array(z.string()).optional(),
    geographies: z.array(z.string()).optional(),
    ticket_min: z.coerce.number().optional(),
    ticket_max: z.coerce.number().optional(),
    risk_appetite: z.enum(['conservative', 'balanced', 'aggressive']).optional(),
});

module.exports = { createSchema, updateSchema, profileSchema, preferencesSchema };
