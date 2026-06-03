'use strict';
// Public, read-only market registry — currency / locale / tax / FX for the supported
// storefront markets (US/UK/AE/IN/SG). Lets the admin console render a "Markets" view
// and lets clients discover the canonical per-country config without hardcoding it.
const { sendSuccess } = require('../utils/response');
const { listMarkets, BASE_CURRENCY, DEFAULT_MARKET } = require('../config/markets');

const list = async (req, res, next) => {
    try {
        return sendSuccess(req, res, {
            baseCurrency: BASE_CURRENCY,
            defaultMarket: DEFAULT_MARKET,
            markets: listMarkets(),
        });
    } catch (err) { return next(err); }
};

module.exports = { list };
