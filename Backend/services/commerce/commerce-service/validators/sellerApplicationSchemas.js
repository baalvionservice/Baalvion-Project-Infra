'use strict';
const { z } = require('zod');

// Mirrors createStoreSchema's code/countryCode/currencyCode constraints (storeSchemas.js) —
// the application is approved by handing these exact fields to storeService.createStore, so
// they must already satisfy that schema or approval will fail.
exports.createApplicationSchema = z.object({
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

exports.rejectApplicationSchema = z.object({
    reason: z.string().min(1).max(500),
});
