'use strict';
const { z } = require('zod');

exports.createBondSchema = z.object({
    categoryId: z.string().uuid(),
    currency: z.enum(['BTC', 'USDT', 'BINANCE']),
    // USDT only: which chain the seller will pay on.
    network: z.enum(['TRC20', 'BEP20', 'ERC20', 'SOLANA']).optional(),
});
exports.submitPaymentSchema = z.object({ txHash: z.string().min(8).max(200) });
exports.confirmSchema = z.object({ amountReceived: z.string().min(1).max(60), note: z.string().max(500).optional(), creditUsd: z.number().positive().max(100000).optional() });
exports.noteSchema = z.object({ note: z.string().min(1).max(500) });

exports.destinationSchema = z.object({
    address: z.string().trim().min(1).max(200),
    confirmAddress: z.string().trim().min(1).max(200),
    network: z.string().max(30).optional().nullable(),
    label: z.string().max(80).optional().nullable(),
    isActive: z.boolean().optional(),
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
