'use strict';
// Freight Management — Quote Request validator (Phase 3, Prompt 2).
const { z } = require('zod');

const addressSchema = z.object({
    country: z.string().min(1, 'country is required'),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    line1: z.string().optional(),
    residential: z.boolean().optional(),
});

const pieceSchema = z.object({
    quantity: z.number().int().positive().default(1),
    weightKg: z.number().nonnegative().default(0),
    lengthCm: z.number().nonnegative().default(0),
    widthCm: z.number().nonnegative().default(0),
    heightCm: z.number().nonnegative().default(0),
});

const createFreightQuoteSchema = z.object({
    shipmentId: z.string().uuid().optional(),
    tradeOperationId: z.string().uuid().optional(),
    origin: addressSchema,
    destination: addressSchema,
    cargoType: z.string().optional(),
    commodity: z.string().optional(),
    hsCode: z.string().optional(),
    hazardous: z.boolean().default(false),
    containerType: z.string().optional(),
    pieces: z.array(pieceSchema).min(1, 'at least one piece is required'),
    totalWeightKg: z.number().nonnegative().optional(),
    incoterm: z.string().optional(),
    transportMode: z.enum(['express', 'air', 'ocean', 'road', 'rail', 'multimodal']).optional(),
    preferredCarrierId: z.string().uuid().optional(),
    deliverySpeed: z.enum(['economy', 'standard', 'express']).optional(),
    insuranceRequested: z.boolean().default(false),
    declaredValue: z.number().nonnegative().default(0),
    currency: z.string().length(3).default('USD'),
    expectedPickup: z.string().optional(),
    expectedDelivery: z.string().optional(),
    fuelPct: z.number().min(0).max(1).optional(),
});

module.exports = { createFreightQuoteSchema };
