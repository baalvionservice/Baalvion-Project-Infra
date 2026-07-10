'use strict';
const { z } = require('zod');

const WAREHOUSE_TYPES = ['distribution', 'fulfillment', 'cold_storage', 'bonded', 'cross_dock'];
const WAREHOUSE_STATUSES = ['active', 'inactive', 'full', 'maintenance'];

const createWarehouseSchema = z.object({
    name: z.string().min(1, 'name is required'),
    code: z.string().optional(),
    warehouseType: z.enum(WAREHOUSE_TYPES).default('distribution'),
    addressId: z.string().uuid().optional(),
    capacitySqm: z.number().nonnegative().optional(),
    capacityUnits: z.number().int().nonnegative().optional(),
    status: z.enum(WAREHOUSE_STATUSES).default('active'),
    managerName: z.string().optional(),
    contactPhone: z.string().optional(),
    operatingHours: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
});

const updateWarehouseSchema = createWarehouseSchema.partial();

module.exports = { WAREHOUSE_TYPES, WAREHOUSE_STATUSES, createWarehouseSchema, updateWarehouseSchema };
