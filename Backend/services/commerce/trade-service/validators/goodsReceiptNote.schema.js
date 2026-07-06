'use strict';
const { z } = require('zod');

const GRN_STATUSES = ['draft', 'in_progress', 'completed', 'cancelled'];
const LINE_CONDITIONS = ['good', 'damaged', 'partial', 'rejected'];

const createGoodsReceiptNoteSchema = z.object({
    warehouseId: z.string().uuid(),
    purchaseOrderId: z.string().uuid().optional(),
    shipmentId: z.string().uuid().optional(),
    supplierReference: z.string().optional(),
    notes: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

const updateGoodsReceiptNoteSchema = z.object({
    supplierReference: z.string().optional(),
    notes: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

const createGoodsReceiptLineSchema = z.object({
    packageId: z.string().uuid().optional(),
    sku: z.string().optional(),
    description: z.string().optional(),
    expectedQuantity: z.number().nonnegative().optional(),
    receivedQuantity: z.number().nonnegative().default(0),
    unit: z.string().default('unit'),
    condition: z.enum(LINE_CONDITIONS).default('good'),
    lotNumber: z.string().optional(),
    manufactureDate: z.string().optional(),
    expiryDate: z.string().optional(),
    weightKg: z.number().nonnegative().optional(),
    volumeCbm: z.number().nonnegative().optional(),
    hazardClass: z.string().optional(),
    temperatureRequirement: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

const updateGoodsReceiptLineSchema = createGoodsReceiptLineSchema.partial();

module.exports = {
    GRN_STATUSES,
    LINE_CONDITIONS,
    createGoodsReceiptNoteSchema,
    updateGoodsReceiptNoteSchema,
    createGoodsReceiptLineSchema,
    updateGoodsReceiptLineSchema,
};
