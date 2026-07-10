'use strict';
// Freight Management — Rate Engine validators (Phase 3, Prompt 2).
const { z } = require('zod');

const RULE_TYPES = ['lane', 'weight', 'volume', 'seasonal', 'peak', 'contract', 'country', 'discount', 'markup'];
const ADJUSTMENT_TYPES = ['flat', 'percent', 'per_kg', 'per_cbm'];

const createFreightRateRuleSchema = z.object({
    ruleType: z.enum(RULE_TYPES),
    carrierId: z.string().uuid().optional(),
    originCode: z.string().optional(),
    destinationCode: z.string().optional(),
    mode: z.string().optional(),
    minWeightKg: z.number().nonnegative().optional(),
    maxWeightKg: z.number().nonnegative().optional(),
    minVolumeCbm: z.number().nonnegative().optional(),
    maxVolumeCbm: z.number().nonnegative().optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    currency: z.string().length(3).default('USD'),
    adjustmentType: z.enum(ADJUSTMENT_TYPES),
    adjustmentValue: z.number(),
    priority: z.number().int().nonnegative().default(100),
    active: z.boolean().default(true),
});

const updateFreightRateRuleSchema = createFreightRateRuleSchema.partial();

const ratePreviewSchema = z.object({
    carrierId: z.string().uuid().optional(),
    originCode: z.string().optional(),
    destinationCode: z.string().optional(),
    mode: z.string().optional(),
    baseRate: z.number().nonnegative(),
    weightKg: z.number().nonnegative().default(0),
    volumeCbm: z.number().nonnegative().default(0),
    fuelPct: z.number().min(0).max(1).default(0),
    date: z.string().optional(),
    currency: z.string().length(3).default('USD'),
});

module.exports = {
    RULE_TYPES, ADJUSTMENT_TYPES, createFreightRateRuleSchema, updateFreightRateRuleSchema, ratePreviewSchema,
};
