'use strict';
const { z } = require('zod');

const RETURN_REASONS = ['damaged', 'wrong_item', 'quality_issue', 'customer_request', 'other'];
const RETURN_STATUSES = ['requested', 'approved', 'in_transit', 'received', 'refunded', 'rejected'];

const createReturnSchema = z.object({
    shipmentId: z.string().uuid('shipmentId must be a UUID'),
    reason: z.enum(RETURN_REASONS),
    quantity: z.number().int().positive().default(1),
    notes: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

module.exports = { RETURN_REASONS, RETURN_STATUSES, createReturnSchema };
