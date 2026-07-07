'use strict';
// Freight Management — Carrier Directory validators (Phase 3, Prompt 2). Zod, per
// the org's TypeScript coding-style rule (see validators/container.schema.js — the
// first Zod validator in trade-service).
const { z } = require('zod');

const AVAILABILITY_STATUSES = ['active', 'limited', 'inactive'];
const CARRIER_STATUSES = ['active', 'suspended', 'inactive'];
const TRANSPORT_MODES = ['ocean', 'air', 'rail', 'road', 'express', 'courier', 'multimodal'];
const REGION_TYPES = ['country', 'lane', 'port_pair'];

const insuranceSchema = z.object({
    provider: z.string().optional(),
    coverage_amount: z.number().nonnegative().optional(),
    currency: z.string().length(3).optional(),
    valid_until: z.string().optional(),
}).partial();

const supportContactSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
}).partial();

const createCarrierSchema = z.object({
    code: z.string().min(1, 'code is required').max(64),
    name: z.string().min(1, 'name is required'),
    logoUrl: z.string().url().optional(),
    country: z.string().optional(),
    connectorKey: z.enum(['dhl', 'fedex', 'ups', 'maersk']).optional(),
    credentialEnvPrefix: z.string().optional(),
    services: z.array(z.record(z.unknown())).optional(),
    coverage: z.record(z.unknown()).optional(),
    fleet: z.record(z.unknown()).optional(),
    modes: z.array(z.enum(TRANSPORT_MODES)).optional(),
    rating: z.number().min(0).max(5).optional(),
    reliabilityScore: z.number().int().min(0).max(100).optional(),
    insurance: insuranceSchema.optional(),
    certifications: z.array(z.string()).optional(),
    trackingApiSupported: z.boolean().optional(),
    bookingApiSupported: z.boolean().optional(),
    pricingApiSupported: z.boolean().optional(),
    availabilityStatus: z.enum(AVAILABILITY_STATUSES).default('active'),
    operatingRegions: z.array(z.string()).optional(),
    supportContact: supportContactSchema.optional(),
    documents: z.array(z.record(z.unknown())).optional(),
    status: z.enum(CARRIER_STATUSES).default('active'),
});

const updateCarrierSchema = createCarrierSchema.partial();

const createCarrierServiceSchema = z.object({
    serviceType: z.string().min(1, 'serviceType is required'),
    transportMode: z.enum(TRANSPORT_MODES),
    transitTimeDays: z.number().int().nonnegative().optional(),
    baseFee: z.number().nonnegative().optional(),
    ratePerKg: z.number().nonnegative().optional(),
    active: z.boolean().default(true),
});

const createCarrierRegionSchema = z.object({
    regionType: z.enum(REGION_TYPES),
    originCode: z.string().optional(),
    destinationCode: z.string().optional(),
    active: z.boolean().default(true),
});

module.exports = {
    AVAILABILITY_STATUSES,
    CARRIER_STATUSES,
    TRANSPORT_MODES,
    REGION_TYPES,
    createCarrierSchema,
    updateCarrierSchema,
    createCarrierServiceSchema,
    createCarrierRegionSchema,
};
