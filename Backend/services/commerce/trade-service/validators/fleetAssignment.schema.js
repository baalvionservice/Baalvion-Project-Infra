'use strict';
const { z } = require('zod');

const createFleetAssignmentSchema = z.object({
    vehicleId: z.string().uuid('vehicleId must be a UUID'),
    driverId: z.string().uuid('driverId must be a UUID'),
    shipmentId: z.string().uuid().optional(),
    notes: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

module.exports = { createFleetAssignmentSchema };
