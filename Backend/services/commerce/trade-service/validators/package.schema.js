'use strict';
const { z } = require('zod');

const PACKAGE_TYPES = ['box', 'pallet', 'container', 'loose_cargo', 'hazardous', 'oversized', 'temperature_controlled'];

const createPackageSchema = z.object({
    shipmentId: z.string().uuid('shipmentId must be a UUID'),
    containerId: z.string().uuid().optional(),
    packageType: z.enum(PACKAGE_TYPES).default('box'),
    lengthCm: z.number().nonnegative().optional(),
    widthCm: z.number().nonnegative().optional(),
    heightCm: z.number().nonnegative().optional(),
    weightKg: z.number().nonnegative().optional(),
    volumeCbm: z.number().nonnegative().optional(),
    barcode: z.string().optional(),
    qrCode: z.string().optional(),
    rfidTag: z.string().optional(),
    sku: z.string().optional(),
    hsCode: z.string().optional(),
    commodityDescription: z.string().optional(),
    packagingMaterial: z.string().optional(),
    sealNumber: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

const updatePackageSchema = createPackageSchema.partial().omit({ shipmentId: true });

module.exports = { PACKAGE_TYPES, createPackageSchema, updatePackageSchema };
