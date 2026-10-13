'use strict';
const { z } = require('zod');

const SERVICES = ['buy_usdt', 'crypto_trade', 'account_setup', 'other'];
const image = z.object({
    mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    data: z.string().min(100).max(4 * 1024 * 1024),
});

exports.applySchema = z.object({
    displayName: z.string().trim().min(2).max(120),
    bio: z.string().trim().max(1500).optional(),
    services: z.array(z.enum(SERVICES)).min(1).max(4),
    languages: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
    commissionNote: z.string().trim().max(200).optional(),
    tradeLimitUsd: z.number().int().min(10).max(1000000).optional(),
    qrs: z.array(image.extend({ label: z.string().trim().max(60).optional() })).min(1).max(3),
    // The applicant must accept the intermediary rules.
    acceptTerms: z.literal(true),
    // How the intermediary pays the activation deposit.
    currency: z.enum(['BTC', 'USDT', 'BINANCE']),
    network: z.enum(['TRC20', 'BEP20', 'ERC20', 'SOLANA']).optional(),
});

exports.createTradeSchema = z.object({
    intermediaryId: z.string().uuid(),
    serviceType: z.enum(SERVICES),
    amountUsdt: z.number().positive().max(1000000).optional(),
    // With an amount and a currency, an intermediary who has published a fee gets a locked price straight away.
    currency: z.enum(['INR', 'AED', 'USD']).optional(),
    instructions: z.string().trim().max(1500).optional(),
});
exports.quoteSchema = z.object({
    currency: z.enum(['INR', 'AED', 'USD']),
    totalLocal: z.number().positive().max(100000000),
    usdt: z.number().positive().max(1000000).optional(),
    note: z.string().trim().max(300).optional(),
});
exports.requoteSchema = z.object({ currency: z.enum(['INR', 'AED', 'USD']).optional() });
exports.feeSchema = z.object({ feePercent: z.number().min(0).max(20).nullable() });
exports.messageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
exports.proofsSchema = z.object({ proofs: z.array(image).min(1).max(3) });
exports.paidSchema = z.object({ proofs: z.array(image).min(1).max(3), note: z.string().trim().max(500).optional() });
exports.disputeSchema = z.object({ reason: z.string().trim().min(10).max(1000) });
exports.resolveSchema = z.object({
    outcome: z.enum(['completed', 'cancelled', 'refunded']),
    note: z.string().trim().min(3).max(1000),
    refundUsd: z.number().positive().max(100000).optional(),
}).refine((d) => d.outcome !== 'refunded' || d.refundUsd !== undefined, { message: 'Enter the refund amount' });
exports.releaseSchema = z.object({ note: z.string().trim().max(500).optional() });
