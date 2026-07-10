'use strict';
const { z } = require('zod');

const ZONE_TYPES = ['storage', 'receiving', 'staging', 'packing', 'hazmat', 'cold_storage', 'quarantine', 'cross_dock'];
const TEMPERATURE_ZONES = ['ambient', 'chilled', 'frozen', 'controlled'];
const ZONE_STATUSES = ['active', 'inactive', 'maintenance', 'full'];

const createWarehouseZoneSchema = z.object({
    warehouseId: z.string().uuid(),
    code: z.string().optional(),
    name: z.string().min(1, 'name is required'),
    zoneType: z.enum(ZONE_TYPES).default('storage'),
    temperatureZone: z.enum(TEMPERATURE_ZONES).optional(),
    hazardClass: z.string().optional(),
    capacityUnits: z.number().int().nonnegative().optional(),
    sequenceOrder: z.number().int().nonnegative().optional(),
    status: z.enum(ZONE_STATUSES).default('active'),
    metadata: z.record(z.unknown()).optional(),
});

const updateWarehouseZoneSchema = createWarehouseZoneSchema.omit({ warehouseId: true }).partial();

module.exports = { ZONE_TYPES, TEMPERATURE_ZONES, ZONE_STATUSES, createWarehouseZoneSchema, updateWarehouseZoneSchema };
