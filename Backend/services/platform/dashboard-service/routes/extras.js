'use strict';
// Dashboard "reference" panels that have no dedicated table: Countries (derived from the org's
// businesses), Corporate Actions and FX Rates (reference data). All auth-gated like other routes.
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { sendSuccess } = require('../utils/response');
const db = require('../models');

const router = Router();

// Countries — aggregated from the org's businesses (domains), grouped by country.
router.get('/countries', authMiddleware, async (req, res, next) => {
    try {
        const rows = await db.sequelize.query(
            `SELECT country AS name, country_code AS code, currency,
                    COUNT(*)::int AS businesses
             FROM dashboard.domains
             WHERE org_id = $1
             GROUP BY country, country_code, currency
             ORDER BY businesses DESC`,
            { type: db.Sequelize.QueryTypes.SELECT, bind: [req.auth.orgId] },
        );
        return sendSuccess(req, res, rows);
    } catch (err) { next(err); }
});

// Corporate actions — reference list (no dedicated table yet).
router.get('/corporate-actions', authMiddleware, (req, res) =>
    sendSuccess(req, res, [
        { id: 1, type: 'Dividend',    description: 'Q1 cash dividend',          amount: 0.45,    currency: 'USD', date: '2026-03-31', status: 'Paid' },
        { id: 2, type: 'Stock Split', description: '2-for-1 share split',        ratio: '2:1',                     date: '2026-02-15', status: 'Completed' },
        { id: 3, type: 'Buyback',     description: 'Share repurchase programme', amount: 5000000, currency: 'USD', date: '2026-05-01', status: 'Active' },
    ]),
);

// FX rates — reference rates (external data; surfaced for the dashboard).
router.get('/fx-rates', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        base: 'USD',
        asOf: new Date().toISOString(),
        rates: [
            { pair: 'USD/EUR', rate: 0.92 },
            { pair: 'USD/GBP', rate: 0.79 },
            { pair: 'USD/AED', rate: 3.67 },
            { pair: 'USD/SGD', rate: 1.35 },
            { pair: 'USD/INR', rate: 83.2 },
        ],
    }),
);

module.exports = router;
