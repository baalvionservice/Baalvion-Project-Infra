'use strict';
const { z } = require('zod');

// Mirrors createStoreSchema's code/countryCode/currencyCode constraints (storeSchemas.js) —
// the application is approved by handing these exact fields to storeService.createStore, so
// they must already satisfy that schema or approval will fail.
const short = (n) => z.string().trim().max(n);
// Unknown keys are dropped, so only these fields are ever stored.
const detailsSchema = z.object({
    businessType: z.enum(['individual', 'business']).optional(),
    city: short(80).optional(),
    address: short(300).optional(),
    contactEmail: z.string().trim().email().max(200).optional(),
    whatsapp: short(30).optional(),
    website: short(300).optional(),
    instagram: short(120).optional(),
    yearsSelling: z.enum(['new', 'under_1', '1_to_3', 'over_3']).optional(),
    sellsWhat: short(600).optional(),
    productTypes: z.array(short(60)).max(12).optional(),
    stockLevel: z.enum(['under_20', '20_to_100', 'over_100']).optional(),
    sampleProducts: z.array(z.object({ name: short(120), price: short(40).optional(), note: short(300).optional() })).max(3).optional(),
    shippingMethod: z.enum(['self', 'courier', 'pickup']).optional(),
    handlingDays: z.number().int().min(0).max(30).optional(),
    shipsTo: short(200).optional(),
    returns: z.enum(['7_days', '14_days', '30_days', 'none']).optional(),
    idNumberLast4: z.string().trim().regex(/^[0-9A-Za-z]{4}$/, 'Enter the last 4 characters of your ID number').optional(),
}).strip();

exports.createApplicationSchema = z.object({
    details: detailsSchema.optional(),
    storeName: z.string().min(1).max(200),
    storeCode: z.string().min(2).max(20).regex(/^[a-z0-9_]+$/),
    countryCode: z.string().length(2),
    currencyCode: z.string().length(3),
    description: z.string().max(2000).optional(),
    // KYC-lite — see commerceSellerApplication.js model comment.
    legalFullName: z.string().min(1).max(200).optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD').optional(),
    phoneNumber: z.string().min(1).max(30).optional(),
    // Crypto payout destination.
    payoutCurrency: z.string().max(10).optional(),
    payoutWalletAddress: z.string().max(200).optional(),
});

exports.detailsSchema = detailsSchema;

exports.rejectApplicationSchema = z.object({
    reason: z.string().min(1).max(500),
});
