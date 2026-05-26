'use strict';
const { z } = require('zod');

exports.upsertCustomerSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().max(30).optional(),
    userId: z.number().int().optional().nullable(),
});

exports.updateCustomerSchema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(30).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    isActive: z.boolean().optional(),
});

exports.createAddressSchema = z.object({
    addressType: z.enum(['shipping', 'billing', 'both']).default('shipping'),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    company: z.string().max(200).optional(),
    address1: z.string().min(1).max(300),
    address2: z.string().max(300).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    zip: z.string().max(20).optional(),
    countryCode: z.string().length(2),
    phone: z.string().max(30).optional(),
    isDefault: z.boolean().default(false),
});

exports.updateAddressSchema = exports.createAddressSchema.partial();
