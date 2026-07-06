'use strict';
// Logistics Core Foundation (Phase 1) — first Zod validator in trade-service.
// `zod` was already a declared dependency but unused anywhere in this service;
// existing controllers validate inline. New logistics entities validate with
// Zod per the org's TypeScript coding-style rule.
const { z } = require('zod');

const CONTAINER_TYPES = ['20ft', '40ft', '40hc', '45hc', 'lcl', 'fcl', 'reefer', 'tank', 'open_top', 'flat_rack'];
const CONTAINER_STATUSES = ['empty', 'loaded', 'sealed', 'in_transit', 'at_port', 'customs_hold', 'released', 'returned'];

const createContainerSchema = z.object({
    shipmentId: z.string().uuid().optional(),
    containerNumber: z.string().min(1, 'containerNumber is required'),
    isoCode: z.string().optional(),
    containerType: z.enum(CONTAINER_TYPES).default('20ft'),
    sealNumber: z.string().optional(),
    carrierId: z.string().optional(),
    owner: z.string().optional(),
    status: z.enum(CONTAINER_STATUSES).default('empty'),
    currentLocation: z.string().optional(),
    capacityKg: z.number().nonnegative().optional(),
    weightKg: z.number().nonnegative().optional(),
    temperatureC: z.number().optional(),
    metadata: z.record(z.unknown()).optional(),
});

const updateContainerSchema = createContainerSchema.partial();

module.exports = { CONTAINER_TYPES, CONTAINER_STATUSES, createContainerSchema, updateContainerSchema };
