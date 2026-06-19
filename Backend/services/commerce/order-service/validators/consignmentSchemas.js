'use strict';
const { z } = require('zod');

const CONDITION_GRADES = ['pristine', 'excellent', 'very_good', 'good', 'fair'];
const PAYOUT_TYPES = ['consignment', 'buyout'];
const REQUEST_STATUSES = ['submitted', 'quoted', 'accepted', 'rejected', 'received', 'authenticating', 'authenticated', 'listed', 'sold', 'withdrawn'];
const AUTH_STATUSES = ['pending', 'in_review', 'authenticated', 'rejected'];
const CONFIDENCE = ['high', 'medium', 'low'];

// One item the seller wishes to consign. askingPrice is the seller's WISH only — never an
// authoritative sale price (the platform quotes/lists separately). photoUrls/accessories are bounded
// to keep the JSONB small and flat.
const consignmentItemInputSchema = z.object({
    brand: z.string().min(1).max(120),
    model: z.string().max(200).optional().nullable(),
    category: z.string().max(120).optional().nullable(),
    color: z.string().max(120).optional().nullable(),
    material: z.string().max(120).optional().nullable(),
    conditionGrade: z.enum(CONDITION_GRADES).optional().nullable(),
    askingPrice: z.number().min(0).optional().nullable(),
    currency: z.string().length(3).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    photoUrls: z.array(z.string().url().max(500)).max(12).default([]),
    accessories: z.array(z.string().max(120)).max(20).default([]),
    serialNumber: z.string().max(120).optional().nullable(),
});

exports.submitConsignmentSchema = z.object({
    contactEmail: z.string().email().max(254),
    contactName: z.string().max(200).optional().nullable(),
    contactPhone: z.string().max(30).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    items: z.array(consignmentItemInputSchema).min(1),
});

// Admin status transition. The forward-only state machine lives in the service; here we only
// validate shape + bound the optional fields that may accompany a transition. reference/userId/
// ownerSessionId are NEVER accepted from the client.
exports.updateConsignmentStatusSchema = z.object({
    status: z.enum(REQUEST_STATUSES),
    quoteAmount: z.number().min(0).optional().nullable(),
    quoteCurrency: z.string().length(3).optional().nullable(),
    payoutType: z.enum(PAYOUT_TYPES).optional().nullable(),
    commissionRate: z.number().min(0).max(100).optional().nullable(),
    reviewerNotes: z.string().max(2000).optional().nullable(),
    listedProductId: z.string().uuid().optional().nullable(),
});

// Record / update an item's authentication outcome (admin/authenticator). The certificate's
// integrity hash + code are server-generated and never accepted here.
exports.recordAuthenticationSchema = z.object({
    status: z.enum(AUTH_STATUSES),
    authenticatorName: z.string().max(200).optional().nullable(),
    method: z.string().max(100).optional().nullable(),
    findings: z.string().max(2000).optional().nullable(),
    confidence: z.enum(CONFIDENCE).optional().nullable(),
    photoUrls: z.array(z.string().url().max(500)).max(12).default([]),
});

// Issue a certificate of authenticity for an authenticated item. `code` and `verificationHash`
// are SERVER-GENERATED in issueCertificate — intentionally NOT accepted from the client.
exports.issueCertificateSchema = z.object({
    issuerName: z.string().max(200).optional().nullable(),
    serialNumber: z.string().max(120).optional().nullable(),
    productId: z.string().uuid().optional().nullable(),
});

// Self-service seller profile upsert (authenticated). Money totals (totalPaidOut/totalConsignments)
// are platform-owned and never accepted here.
exports.upsertSellerProfileSchema = z.object({
    displayName: z.string().max(200).optional().nullable(),
    email: z.string().email().max(254).optional(),
    phone: z.string().max(30).optional().nullable(),
    payoutMethod: z.string().max(50).optional().nullable(),
    payoutDetails: z.record(z.unknown()).optional().nullable(),
});

exports.CONDITION_GRADES = CONDITION_GRADES;
exports.REQUEST_STATUSES = REQUEST_STATUSES;
