'use strict';
const { z } = require('zod');

const ADDRESS_TYPES = ['pickup', 'delivery', 'warehouse', 'port', 'airport', 'rail_terminal', 'billing', 'company'];

const createAddressSchema = z.object({
    addressType: z.enum(ADDRESS_TYPES).default('pickup'),
    companyName: z.string().optional(),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    line1: z.string().min(1, 'line1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'city is required'),
    stateProvince: z.string().optional(),
    postalCode: z.string().optional(),
    countryCode: z.string().length(2, 'countryCode must be an ISO 3166-1 alpha-2 code'),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    timezone: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

const updateAddressSchema = createAddressSchema.partial();

module.exports = { ADDRESS_TYPES, createAddressSchema, updateAddressSchema };
