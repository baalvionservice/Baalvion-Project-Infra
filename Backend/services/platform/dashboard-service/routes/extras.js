'use strict';
// Countries reference panel — aggregated from the org's businesses (domains), grouped by country.
// (All other former "reference" panels — corporate-actions, fx-rates, finance-reports,
// domain-analytics, gdpr, docs, ai, sync, billing, marketplace, automation, portals — are now
// real DB-backed feature modules mounted in v1.js.)
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

module.exports = router;
