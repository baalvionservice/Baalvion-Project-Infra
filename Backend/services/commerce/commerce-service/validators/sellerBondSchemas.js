'use strict';
const { z } = require('zod');

exports.createBondSchema = z.object({
    categoryId: z.string().uuid(),
    currency: z.enum(['BTC', 'USDT', 'BINANCE']),
    // USDT only: which chain the seller will pay on.
    network: z.enum(['TRC20', 'BEP20', 'ERC20', 'SOLANA']).optional(),
});
const proofSchema = z.object({
    mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    data: z.string().min(100).max(4 * 1024 * 1024),
});
// A payer proves payment with a screenshot, a transaction reference, or both (at least one).
exports.changeNetworkSchema = z.object({ network: z.enum(['TRC20', 'BEP20', 'ERC20', 'SOLANA']) });
exports.submitPaymentSchema = z.object({
    txHash: z.string().trim().min(6).max(200).optional(),
    proofs: z.array(proofSchema).max(3).optional(),
}).refine((d) => !!d.txHash || (d.proofs && d.proofs.length > 0), { message: 'Attach a screenshot or enter the transaction reference' });
exports.confirmSchema = z.object({ amountReceived: z.string().min(1).max(60), note: z.string().max(500).optional(), creditUsd: z.number().positive().max(100000).optional() });
exports.noteSchema = z.object({ note: z.string().min(1).max(500) });

exports.destinationSchema = z.object({
    address: z.string().trim().min(1).max(200),
    confirmAddress: z.string().trim().min(1).max(200),
    network: z.string().max(30).optional().nullable(),
    label: z.string().max(80).optional().nullable(),
    isActive: z.boolean().optional(),
    qrImageUrl: z.string().trim().max(300).optional().nullable(),
    payLink: z.string().trim().max(300).optional().nullable(),
});

exports.createPassSchema = z.object({
    currency: z.enum(['BTC', 'USDT', 'BINANCE']),
    network: z.enum(['TRC20', 'BEP20', 'ERC20', 'SOLANA']).optional(),
});

exports.topupSchema = z.object({
    amountUsd: z.number().positive().max(100000),
    currency: z.enum(['BTC', 'USDT', 'BINANCE']),
    network: z.enum(['TRC20', 'BEP20', 'ERC20', 'SOLANA']).optional(),
});

exports.startTierSchema = z.object({
    tierSlug: z.enum(['marketplace-access', 'global-elite', 'vip-access']),
    currency: z.enum(['BTC', 'USDT', 'BINANCE']),
    network: z.enum(['TRC20', 'BEP20', 'ERC20', 'SOLANA']).optional(),
});
