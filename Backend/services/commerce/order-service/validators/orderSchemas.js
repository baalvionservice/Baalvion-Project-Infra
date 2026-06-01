'use strict';
const { z } = require('zod');

const addressSchema = z.object({
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
});

const orderItemSchema = z.object({
    productId: z.string().uuid().optional().nullable(),
    variantId: z.string().uuid().optional().nullable(),
    // sku/name/price are SERVER-AUTHORITATIVE (re-derived from commerce data in createOrder);
    // optional on input so clients send only product/variant refs + quantity.
    sku: z.string().min(1).max(200).optional(),
    name: z.string().min(1).max(500).optional(),
    variantName: z.string().max(200).optional(),
    quantity: z.number().int().min(1),
    price: z.number().min(0).optional(),
    compareAtPrice: z.number().min(0).optional().nullable(),
    taxAmount: z.number().min(0).default(0),
    metadata: z.record(z.unknown()).default({}),
});

exports.createOrderSchema = z.object({
    customerId: z.string().uuid().optional().nullable(),
    currencyCode: z.string().length(3).default('USD'),
    items: z.array(orderItemSchema).min(1),
    shippingAmount: z.number().min(0).default(0),
    taxAmount: z.number().min(0).default(0),
    discountAmount: z.number().min(0).default(0),
    discountCode: z.string().max(100).optional().nullable(),
    notes: z.string().max(2000).optional(),
    billingAddress: addressSchema.optional().nullable(),
    shippingAddress: addressSchema.optional().nullable(),
    metadata: z.record(z.unknown()).default({}),
    idempotencyKey: z.string().max(128).optional(),
});

exports.updateOrderStatusSchema = z.object({ status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']) });
exports.cancelOrderSchema = z.object({ reason: z.string().min(1).max(500) });
exports.recordPaymentSchema = z.object({
    provider: z.string().min(1).max(50),
    transactionId: z.string().max(200).optional(),
    amount: z.number().min(0),
    currencyCode: z.string().length(3),
    status: z.enum(['pending', 'authorized', 'captured', 'refunded', 'voided', 'failed']),
    metadata: z.record(z.unknown()).default({}),
    paidAt: z.string().datetime().optional().nullable(),
});

// Refund a paid order (admin/ops). Omit amount for a full refund of the captured amount.
exports.refundPaymentSchema = z.object({
    amount: z.number().positive().optional(),
    reason: z.string().max(500).optional(),
});

exports.createReturnSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.string().min(1).max(200),
    notes: z.string().max(2000).optional(),
    items: z.array(z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().min(1),
        reason: z.string().max(200).optional(),
        condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).default('good'),
        refundAmount: z.number().min(0).default(0),
    })).optional().default([]),
});

exports.updateReturnStatusSchema = z.object({ status: z.enum(['approved', 'rejected', 'received', 'refunded', 'closed']) });
