const { z } = require('zod');

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
}).passthrough();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

// Public self-service signup. role/orgId are intentionally NOT accepted (the
// registrant is always the OWNER of a brand-new org); unknown keys are stripped
// by zod's default strip behavior, closing a privilege-escalation vector.
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2).max(100).optional(),
    orgName: z.string().min(1).max(120).optional(),
    plan: z.string().max(40).optional(),
});

const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({ email: z.string().email(), newPassword: z.string().min(8) });
const verifyEmailSchema = z.object({ email: z.string().email() });
const mfaVerifySchema = z.object({ code: z.string().min(6).max(8) });
const changePasswordSchema = z.object({ oldPassword: z.string().min(8), newPassword: z.string().min(8) });
const proxySchema = z.object({
    name: z.string().min(2),
    host: z.string().min(3),
    port: z.number().int().positive(),
    username: z.string().min(1),
    password: z.string().min(1),
    country: z.string().min(2).max(2),
    type: z.string().min(2),
    protocol: z.string().min(2),
    providerId: z.string().optional(),
}).passthrough();
const presetSchema = z.object({ name: z.string().min(2), country: z.string().min(2).max(2), type: z.string(), protocol: z.string() }).passthrough();
const planChangeSchema = z.object({ planSlug: z.string().min(2) });
const creditPurchaseSchema = z.object({ amountUsd: z.coerce.number().positive().max(10000), paymentRef: z.string().max(128).optional() });
// Activation may carry the exact charged total + interval so the invoice reflects the real amount.
const activateSchema = z.object({
    planSlug: z.string().min(2),
    amount: z.coerce.number().nonnegative().max(1000000).optional(),
    interval: z.enum(['monthly', 'yearly']).optional(),
});
// Bank/wire create a PENDING order (settled offline) — recorded as a pending invoice.
const orderSchema = z.object({
    planSlug: z.string().min(2),
    method: z.enum(['bank', 'wire']),
    interval: z.enum(['monthly', 'yearly']).optional(),
    amount: z.coerce.number().nonnegative().max(1000000).optional(),
});
const paymentMethodSchema = z.object({ type: z.string(), brand: z.string(), last4: z.string().min(4).max(4), expiry: z.string(), isDefault: z.boolean().optional() }).passthrough();
const orgUpdateSchema = z.object({ name: z.string().optional(), slug: z.string().optional(), status: z.string().optional() }).passthrough();
const inviteUserSchema = z.object({ email: z.string().email(), name: z.string().min(2).optional(), role: z.string() }).passthrough();
const roleSchema = z.object({ role: z.string().min(2) });
const ipSchema = z.object({ ip: z.string().min(3) });
const ticketSchema = z.object({ subject: z.string().min(3), priority: z.string().optional(), description: z.string().optional() }).passthrough();
const ticketReplySchema = z.object({ message: z.string().min(1) });
const apiKeySchema = z.object({
    name: z.string().min(2),
    scopes: z.array(z.string()).optional(),
    expiresAt: z.string().optional(),
    keyType: z.enum(['api', 'proxy']).optional(),
});
const genericObjectSchema = z.object({}).passthrough();

module.exports = {
    paginationSchema,
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    verifyEmailSchema,
    mfaVerifySchema,
    changePasswordSchema,
    proxySchema,
    presetSchema,
    planChangeSchema,
    creditPurchaseSchema,
    activateSchema,
    orderSchema,
    paymentMethodSchema,
    orgUpdateSchema,
    inviteUserSchema,
    roleSchema,
    ipSchema,
    ticketSchema,
    ticketReplySchema,
    apiKeySchema,
    genericObjectSchema,
};