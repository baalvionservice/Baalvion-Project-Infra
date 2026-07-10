'use strict';
const { z } = require('zod');

const DRIVER_STATUSES = ['available', 'on_trip', 'off_duty', 'suspended'];

const createDriverSchema = z.object({
    fullName: z.string().min(1, 'fullName is required'),
    licenseNumber: z.string().optional(),
    licenseExpiry: z.string().optional(), // DATEONLY, validated by DB
    phone: z.string().optional(),
    email: z.string().email().optional(),
    status: z.enum(DRIVER_STATUSES).default('available'),
    currentVehicleId: z.string().uuid().optional(),
    rating: z.number().min(0).max(5).optional(),
    metadata: z.record(z.unknown()).optional(),
});

const updateDriverSchema = createDriverSchema.partial();

module.exports = { DRIVER_STATUSES, createDriverSchema, updateDriverSchema };
