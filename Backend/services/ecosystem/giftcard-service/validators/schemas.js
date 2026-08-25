'use strict';
const { z } = require('zod');

const checkoutSchema = z.object({
    method: z.enum(['CRYPTO', 'WALLET']).default('CRYPTO'),
    denomination: z.number().positive(),
    asset: z.enum(['USDT_TRC20', 'ETH_BEP20', 'BTC']).optional(),
}).refine((v) => v.method !== 'CRYPTO' || !!v.asset, {
    message: 'asset is required for CRYPTO checkout',
    path: ['asset'],
});

module.exports = { checkoutSchema };
