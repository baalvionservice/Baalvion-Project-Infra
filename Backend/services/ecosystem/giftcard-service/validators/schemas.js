'use strict';
const { z } = require('zod');

const checkoutSchema = z.object({
    denomination: z.number().positive(),
    asset: z.enum(['USDT_TRC20', 'ETH_BEP20', 'BTC']),
});

module.exports = { checkoutSchema };
