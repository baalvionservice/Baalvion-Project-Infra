'use strict';
const { z } = require('zod');

const addressSchema = z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    // Optional fields are .nullable() to mirror customerSchemas.createAddressSchema: checkout sends
    // the same shape (blank optional → explicit null), so a plain .optional() would 400 a guest order
    // that omits company/line2/state/zip/phone. Required fields stay non-nullable.
    company: z.string().max(200).optional().nullable(),
    address1: z.string().min(1).max(300),
    address2: z.string().max(300).optional().nullable(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional().nullable(),
    zip: z.string().max(20).optional().nullable(),
    countryCode: z.string().length(2),
    phone: z.string().max(30).optional().nullable(),
    // Optional contact email on the order address — VALIDATED so a guest order can receive an
    // order-confirmation email and an arbitrary/unsafe value can never be persisted or emailed.
    email: z.string().email().max(254).optional(),
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

// 5-market commerce context the storefront/cart already carries (us/uk/ae/in/sg).
// Constrained to known values so a client cannot inject arbitrary market/tax labels;
// the actual line money remains server-authoritative (re-derived from commerce pricing).
const SUPPORTED_MARKETS = ['us', 'uk', 'ae', 'in', 'sg'];
const TAX_TYPES = ['SALES_TAX', 'VAT', 'GST'];

exports.createOrderSchema = z.object({
    customerId: z.string().uuid().optional().nullable(),
    currencyCode: z.string().length(3).default('USD'),
    // Market context (optional, backward-compatible): which market the order was placed in
    // and the tax shape that applied. Persisted for auditability; defaults preserve legacy behaviour.
    country: z.enum(SUPPORTED_MARKETS).optional().nullable(),
    market: z.enum(SUPPORTED_MARKETS).optional().nullable(),
    taxType: z.enum(TAX_TYPES).optional().nullable(),
    taxRate: z.number().min(0).max(100).optional().nullable(),
    taxInclusive: z.boolean().optional(),
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

// Selectable storefront gateways (C1 cross-service contract). The chosen gateway is RECORDED on the
// order/payment metadata so reporting + the success screen reflect the shopper's selection; the
// actual provider that captures money is still resolved server-side by PAYMENT_PROVIDER (the mock in
// non-production). A client can therefore label intent intent without overriding capture authority.
const GATEWAYS = ['stripe', 'razorpay', 'payu', 'bank'];

// Create a payment intent. `gateway` is the shopper's selected storefront gateway (recorded only).
exports.createPaymentIntentSchema = z.object({
    gateway: z.enum(GATEWAYS).optional(),
});

// Confirm a payment intent. `verification` is the gateway (Razorpay) client-handler triple,
// verified SERVER-SIDE (HMAC) — optional so the mock provider's {intentId} body still validates.
// `gateway` (optional) lets confirm carry the selection when intent did not (recorded only).
exports.confirmPaymentSchema = z.object({
    intentId: z.string().min(1).max(200),
    gateway: z.enum(GATEWAYS).optional(),
    verification: z.object({
        razorpay_payment_id: z.string().min(1).max(200),
        razorpay_order_id: z.string().min(1).max(200),
        razorpay_signature: z.string().min(1).max(512),
    }).optional(),
});

// Provider-initiated async payment webhook (signature-verified upstream). Drives an order to
// failed/voided when the gateway reports an out-of-band failure/cancellation. orderId scopes the
// order; intentId (optional) targets the specific payment row.
exports.paymentWebhookSchema = z.object({
    event: z.enum(['payment.failed', 'payment.cancelled']),
    orderId: z.string().uuid(),
    intentId: z.string().min(1).max(200).optional().nullable(),
    reason: z.string().max(500).optional().nullable(),
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
        // NOTE: refundAmount is intentionally NOT accepted from the client — it is derived
        // SERVER-SIDE from the order item's own price×quantity in createReturn (a shopper must
        // never be able to influence how much money is refunded).
    })).optional().default([]),
});

exports.updateReturnStatusSchema = z.object({ status: z.enum(['approved', 'rejected', 'received', 'refunded', 'closed']) });

// Shipment tracking (admin/ops). Status is constrained to the shipment lifecycle enum.
const SHIPMENT_STATUSES = ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'];

exports.createShipmentSchema = z.object({
    carrier: z.string().min(1).max(100),
    trackingNumber: z.string().min(1).max(200),
    trackingUrl: z.string().url().max(500).optional(),
    estimatedDelivery: z.string().datetime().optional().nullable(),
    status: z.enum(SHIPMENT_STATUSES).optional(),
});

exports.updateShipmentSchema = z.object({
    status: z.enum(SHIPMENT_STATUSES),
    location: z.string().max(200).optional(),
    message: z.string().max(500).optional(),
    trackingNumber: z.string().max(200).optional(),
    trackingUrl: z.string().url().max(500).optional(),
});
