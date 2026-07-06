'use strict';
const { z } = require('zod');

const VEHICLE_TYPES = ['truck', 'van', 'trailer', 'rail_car', 'ship', 'aircraft'];
const VEHICLE_STATUSES = ['available', 'in_use', 'maintenance', 'out_of_service'];

const createVehicleSchema = z.object({
    vehicleNumber: z.string().min(1, 'vehicleNumber is required'),
    vehicleType: z.enum(VEHICLE_TYPES).default('truck'),
    capacityKg: z.number().nonnegative().optional(),
    capacityVolumeCbm: z.number().nonnegative().optional(),
    status: z.enum(VEHICLE_STATUSES).default('available'),
    currentLocation: z.string().optional(),
    carrierId: z.string().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    gpsDeviceId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

const updateVehicleSchema = createVehicleSchema.partial();

module.exports = { VEHICLE_TYPES, VEHICLE_STATUSES, createVehicleSchema, updateVehicleSchema };
