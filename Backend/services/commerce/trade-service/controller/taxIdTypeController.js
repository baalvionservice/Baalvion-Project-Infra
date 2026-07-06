'use strict';
/**
 * Tax ID Types — read-only config catalog (Phase 2 Tax Verification). Lists the
 * country-configurable tax-identifier types (GSTIN, PAN, IEC, VAT, EIN, USCC, ...)
 * a company can register against. Adding a country is a data insert into
 * tradeops.tax_id_types, not a code change.
 */
const db = require('../models');
const { sendSuccess } = require('../utils/response');

const listTaxIdTypes = async (req, res, next) => {
    try {
        const { country_code } = req.query;
        const where = { is_active: true };
        if (country_code) where.country_code = String(country_code).toUpperCase();
        const rows = await db.TaxIdType.findAll({ where, order: [['country_code', 'ASC'], ['type_code', 'ASC']] });
        return sendSuccess(req, res, rows);
    } catch (err) {
        return next(err);
    }
};

module.exports = { listTaxIdTypes };
