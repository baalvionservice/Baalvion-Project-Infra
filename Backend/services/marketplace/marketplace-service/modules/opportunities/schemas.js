'use strict';
const { z } = require('zod');

const createSchema = z.object({
    company_id: z.string().uuid(),
    title: z.string().min(2).max(300),
    round: z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'growth']).optional(),
    amount_sought: z.coerce.number().min(0).optional(),
    pre_money_valuation: z.coerce.number().min(0).optional(),
    equity_offered_pct: z.coerce.number().min(0).max(100).optional(),
    min_ticket: z.coerce.number().min(0).optional(),
    deadline: z.string().optional(),
    visibility: z.enum(['public', 'private']).optional(),
});

// Edit a draft round — company_id is immutable, status is owned by the publish flow.
const updateSchema = z.object({
    title: z.string().min(2).max(300).optional(),
    round: z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'growth']).optional(),
    amount_sought: z.coerce.number().min(0).optional(),
    pre_money_valuation: z.coerce.number().min(0).optional(),
    equity_offered_pct: z.coerce.number().min(0).max(100).optional(),
    min_ticket: z.coerce.number().min(0).optional(),
    deadline: z.string().optional(),
    visibility: z.enum(['public', 'private']).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

module.exports = { createSchema, updateSchema };
