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

// Corporate actions / M&A deals — deal pipeline (no dedicated table yet; served as reference data).
router.get('/corporate-actions', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        dueDiligenceItems: [
            { id: 'dd_1', label: 'Financial statements review' },
            { id: 'dd_2', label: 'Legal & compliance audit' },
            { id: 'dd_3', label: 'IP & technology assessment' },
            { id: 'dd_4', label: 'Customer contract review' },
            { id: 'dd_5', label: 'HR & key-personnel review' },
        ],
        activeDeals: [
            { id: 'deal_1', name: 'Project Eagle — Acquisition of Innovate Solutions', type: 'Acquisition', stage: 'Due Diligence', value: '25M', started: '2026-02-15', close: '2026-09-30', owner: 'Aisha Rahman' },
            { id: 'deal_2', name: 'Trade House — Minority Stake in PortLink', type: 'Investment', stage: 'Negotiation', value: '8M', started: '2026-03-01', close: '2026-08-15', owner: 'Marcus Chen' },
            { id: 'deal_3', name: 'Amarisé — Joint Venture (EU Distribution)', type: 'Joint Venture', stage: 'LOI Signed', value: '15M', started: '2026-04-10', close: '2026-11-01', owner: 'Elena Dubois' },
        ],
        completedDeals: [
            { id: 'deal_comp_1', name: 'Acquisition of DataLeap Analytics', type: 'Acquisition', value: '12.5M', completed: '2025-12-20', timeline: [
                { date: '2025-09-01', event: 'Initial contact and NDA signed' },
                { date: '2025-09-20', event: 'Letter of Intent (LOI) signed' },
                { date: '2025-10-05', event: 'Due diligence process started' },
                { date: '2025-11-15', event: 'Definitive agreement signed' },
                { date: '2025-12-18', event: 'Regulatory approvals received' },
                { date: '2025-12-20', event: 'Deal closed and funds transferred' },
            ] },
        ],
    }),
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

// Finance reports — recently generated downloadable reports (no file store yet; reference list).
router.get('/finance-reports', authMiddleware, (req, res) =>
    sendSuccess(req, res, [
        { id: 'rep_1', name: 'Q1 2026 Consolidated P&L', type: 'P&L Statement', period: 'Q1 2026', generated: '2026-04-02', size: '248 KB' },
        { id: 'rep_2', name: 'March 2026 Cash Flow', type: 'Cash Flow', period: 'Mar 2026', generated: '2026-04-01', size: '180 KB' },
        { id: 'rep_3', name: 'Q1 2026 Balance Sheet', type: 'Balance Sheet', period: 'Q1 2026', generated: '2026-04-02', size: '210 KB' },
        { id: 'rep_4', name: 'FY2025 Annual Report', type: 'Annual Report', period: 'FY 2025', generated: '2026-01-31', size: '1.4 MB' },
    ]),
);

module.exports = router;
