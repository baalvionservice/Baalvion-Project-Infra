'use strict';
const { z } = require('zod');

const CHARGE_TYPES = ['freight', 'customs_duty', 'insurance_premium', 'handling', 'documentation', 'demurrage', 'detention', 'other'];
const CHARGE_STATUSES = ['pending', 'approved', 'invoiced', 'paid', 'disputed'];

const createShipmentChargeSchema = z.object({
    shipmentId: z.string().uuid('shipmentId must be a UUID'),
    chargeType: z.enum(CHARGE_TYPES),
    description: z.string().optional(),
    amount: z.number().nonnegative('amount must be >= 0'),
    currency: z.string().length(3).default('USD'),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

module.exports = { CHARGE_TYPES, CHARGE_STATUSES, createShipmentChargeSchema };
