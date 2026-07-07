'use strict';
const { z } = require('zod');
const { STRATEGY } = require('../service/warehouse/putaway/schema');

const suggestPutawaySchema = z.object({
    warehouseId: z.string().uuid(),
    grnLineId: z.string().uuid().optional(),
    packageId: z.string().uuid().optional(),
    zoneId: z.string().uuid().optional(),
    quantity: z.number().positive(),
    unit: z.string().default('unit'),
    weightKg: z.number().nonnegative().optional(),
    volumeCbm: z.number().nonnegative().optional(),
    hazardClass: z.string().optional(),
    temperatureRequirement: z.string().optional(),
    abcClass: z.enum(['A', 'B', 'C']).optional(),
    lotNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    strategy: z.enum(Object.values(STRATEGY)).optional(),
});

const assignBinSchema = z.object({
    binId: z.string().uuid(),
    overrideReason: z.string().optional(),
});

const completeTaskSchema = z.object({}).optional();

module.exports = { suggestPutawaySchema, assignBinSchema, completeTaskSchema };
