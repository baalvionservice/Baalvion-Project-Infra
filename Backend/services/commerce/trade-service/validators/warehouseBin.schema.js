'use strict';
const { z } = require('zod');

const BIN_TYPES = ['aisle', 'rack', 'shelf', 'bin'];
const TEMPERATURE_ZONES = ['ambient', 'chilled', 'frozen', 'controlled'];
const ABC_CLASSES = ['A', 'B', 'C'];
const BIN_STATUSES = ['active', 'inactive', 'blocked', 'full', 'maintenance'];

const createWarehouseBinSchema = z.object({
    warehouseId: z.string().uuid(),
    zoneId: z.string().uuid(),
    parentBinId: z.string().uuid().optional(),
    binType: z.enum(BIN_TYPES).default('bin'),
    code: z.string().optional(),
    name: z.string().optional(),
    capacityWeightKg: z.number().nonnegative().optional(),
    capacityVolumeCbm: z.number().nonnegative().optional(),
    capacityUnits: z.number().int().nonnegative().optional(),
    temperatureZone: z.enum(TEMPERATURE_ZONES).optional(),
    hazardClass: z.string().optional(),
    abcClass: z.enum(ABC_CLASSES).optional(),
    status: z.enum(BIN_STATUSES).default('active'),
    metadata: z.record(z.unknown()).optional(),
});

// barcode/qr_payload are deliberately excluded from update — immutable once
// generated (see service/warehouse/locationCode.js), so a printed label never
// goes stale.
const updateWarehouseBinSchema = createWarehouseBinSchema.omit({ warehouseId: true, zoneId: true }).partial();

module.exports = { BIN_TYPES, TEMPERATURE_ZONES, ABC_CLASSES, BIN_STATUSES, createWarehouseBinSchema, updateWarehouseBinSchema };
