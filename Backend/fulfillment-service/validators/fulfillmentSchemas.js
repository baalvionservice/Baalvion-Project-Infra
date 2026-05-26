'use strict';
const { z } = require('zod');

exports.createShipmentSchema = z.object({
    orderId: z.string().uuid(),
    courierId: z.string().uuid().optional().nullable(),
    trackingNumber: z.string().max(200).optional(),
    shippingAddress: z.record(z.unknown()),
    weight: z.number().min(0).optional(),
    estimatedDelivery: z.string().datetime().optional().nullable(),
    items: z.array(z.record(z.unknown())).default([]),
    metadata: z.record(z.unknown()).default({}),
});

exports.updateShipmentSchema = z.object({
    courierId: z.string().uuid().optional().nullable(),
    status: z.enum(['pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned']).optional(),
    trackingNumber: z.string().max(200).optional(),
    shippedAt: z.string().datetime().optional().nullable(),
    estimatedDelivery: z.string().datetime().optional().nullable(),
    deliveredAt: z.string().datetime().optional().nullable(),
});

exports.addTrackingEventSchema = z.object({
    status: z.string().min(1).max(100),
    location: z.string().max(300).optional(),
    description: z.string().max(1000).optional(),
    occurredAt: z.string().datetime().optional(),
});

exports.createZoneSchema = z.object({
    name: z.string().min(1).max(200),
    countries: z.array(z.string().length(2)).default([]),
    regions: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
});

exports.updateZoneSchema = exports.createZoneSchema.partial();

exports.createRateSchema = z.object({
    name: z.string().min(1).max(200),
    carrier: z.string().max(100).optional(),
    method: z.string().max(100).optional(),
    type: z.enum(['flat', 'weight', 'price', 'free']).default('flat'),
    baseRate: z.number().min(0).default(0),
    conditions: z.record(z.unknown()).default({}),
    estimatedDays: z.number().int().min(0).optional(),
    isActive: z.boolean().default(true),
});

exports.updateRateSchema = exports.createRateSchema.partial();

exports.createCourierSchema = z.object({
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(50),
    trackingUrl: z.string().url().optional(),
    isActive: z.boolean().default(true),
    metadata: z.record(z.unknown()).default({}),
});

exports.updateCourierSchema = exports.createCourierSchema.partial();
