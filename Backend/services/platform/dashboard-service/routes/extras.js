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

// FX rates — reference rates vs USD (external data; surfaced for the dashboard).
router.get('/fx-rates', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        base: 'USD',
        asOf: new Date().toISOString(),
        rates: [
            { code: 'USD', symbol: '$',   currency: 'US Dollar',        rate: 1,    change24h: 0,     change7d: 0,     lastUpdated: 'just now' },
            { code: 'EUR', symbol: '€', currency: 'Euro',          rate: 0.92, change24h: -0.12, change7d: 0.30,  lastUpdated: 'just now' },
            { code: 'GBP', symbol: '£', currency: 'British Pound', rate: 0.79, change24h: 0.08,  change7d: -0.22, lastUpdated: 'just now' },
            { code: 'AED', symbol: 'AED', currency: 'UAE Dirham',       rate: 3.67, change24h: 0.00,  change7d: 0.01,  lastUpdated: 'just now' },
            { code: 'SGD', symbol: 'S$',  currency: 'Singapore Dollar', rate: 1.35, change24h: 0.05,  change7d: -0.10, lastUpdated: 'just now' },
            { code: 'INR', symbol: '₹', currency: 'Indian Rupee',  rate: 83.2, change24h: 0.21,  change7d: 0.65,  lastUpdated: 'just now' },
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

// Domain (web) analytics — per-site web metrics (no web-analytics table yet; reference data).
router.get('/domain-analytics', authMiddleware, (req, res) =>
    sendSuccess(req, res, [
        {
            id: 'dom_1', domain: 'baalvionmining.com', businessName: 'Baalvion Mining Co', sslStatus: 'valid',
            monthlyVisitors: 84200, pageViews: 312500, avgSessionDuration: '3m 12s', webRevenue: 128000, uptime: 99.98, hostingCost: 420,
            trafficTrend: [{ date: 'Jan', visitors: 61000 }, { date: 'Feb', visitors: 66500 }, { date: 'Mar', visitors: 72000 }, { date: 'Apr', visitors: 78000 }, { date: 'May', visitors: 84200 }],
            topPages: [{ url: '/', views: 120000, avgTime: '2m 40s', bounceRate: 38 }, { url: '/products', views: 64000, avgTime: '3m 05s', bounceRate: 31 }, { url: '/contact', views: 22000, avgTime: '1m 50s', bounceRate: 52 }],
            trafficSources: [{ name: 'Organic', value: 48 }, { name: 'Direct', value: 27 }, { name: 'Referral', value: 15 }, { name: 'Social', value: 10 }],
            seo: { da: 62, backlinks: 18400, keywords: 5200 },
            geoVisitors: [{ country: 'UAE', flag: '🇦🇪', visitors: 38000, percentage: 45 }, { country: 'India', flag: '🇮🇳', visitors: 21000, percentage: 25 }, { country: 'UK', flag: '🇬🇧', visitors: 13000, percentage: 15 }],
            revenueAttribution: { orders: 1240, totalValue: 128000 },
        },
        {
            id: 'dom_2', domain: 'baalviontrade.com', businessName: 'Baalvion Trade House', sslStatus: 'valid',
            monthlyVisitors: 51800, pageViews: 198000, avgSessionDuration: '2m 48s', webRevenue: 96000, uptime: 99.95, hostingCost: 360,
            trafficTrend: [{ date: 'Jan', visitors: 40000 }, { date: 'Feb', visitors: 43000 }, { date: 'Mar', visitors: 46500 }, { date: 'Apr', visitors: 49000 }, { date: 'May', visitors: 51800 }],
            topPages: [{ url: '/', views: 78000, avgTime: '2m 20s', bounceRate: 41 }, { url: '/marketplace', views: 52000, avgTime: '3m 30s', bounceRate: 28 }],
            trafficSources: [{ name: 'Organic', value: 40 }, { name: 'Direct', value: 35 }, { name: 'Referral', value: 18 }, { name: 'Social', value: 7 }],
            seo: { da: 55, backlinks: 12100, keywords: 3800 },
            geoVisitors: [{ country: 'Singapore', flag: '🇸🇬', visitors: 26000, percentage: 50 }, { country: 'India', flag: '🇮🇳', visitors: 14000, percentage: 27 }],
            revenueAttribution: { orders: 890, totalValue: 96000 },
        },
        {
            id: 'dom_3', domain: 'amarisemaison.com', businessName: 'Amarisé Maison Avenue', sslStatus: 'valid',
            monthlyVisitors: 132400, pageViews: 540000, avgSessionDuration: '4m 02s', webRevenue: 312000, uptime: 99.99, hostingCost: 680,
            trafficTrend: [{ date: 'Jan', visitors: 98000 }, { date: 'Feb', visitors: 108000 }, { date: 'Mar', visitors: 118000 }, { date: 'Apr', visitors: 125000 }, { date: 'May', visitors: 132400 }],
            topPages: [{ url: '/', views: 210000, avgTime: '3m 10s', bounceRate: 34 }, { url: '/collections', views: 140000, avgTime: '4m 40s', bounceRate: 22 }, { url: '/heritage', views: 60000, avgTime: '5m 10s', bounceRate: 19 }],
            trafficSources: [{ name: 'Organic', value: 52 }, { name: 'Social', value: 24 }, { name: 'Direct', value: 16 }, { name: 'Referral', value: 8 }],
            seo: { da: 71, backlinks: 32500, keywords: 8900 },
            geoVisitors: [{ country: 'France', flag: '🇫🇷', visitors: 58000, percentage: 44 }, { country: 'UK', flag: '🇬🇧', visitors: 34000, percentage: 26 }, { country: 'UAE', flag: '🇦🇪', visitors: 20000, percentage: 15 }],
            revenueAttribution: { orders: 3120, totalValue: 312000 },
        },
    ]),
);

// GDPR / data-privacy posture — reference data (no privacy-ops table yet).
router.get('/gdpr', authMiddleware, (req, res) =>
    sendSuccess(req, res, {
        statusCards: [
            { title: 'Data Inventory', status: 'Complete', description: 'All data assets mapped' },
            { title: 'Consent Management', status: 'Active', description: 'Cookie + marketing consent tracked' },
            { title: 'DSR Workflow', status: 'Operational', description: 'Subject requests handled within SLA' },
            { title: 'Breach Readiness', status: 'Ready', description: '72-hour notification plan in place' },
        ],
        subjectRequests: [
            { id: 'dsr_1', type: 'Access', name: 'John Doe', submitted: '2026-04-28T10:00:00Z', status: 'Pending', dueDate: '2026-05-28T10:00:00Z' },
            { id: 'dsr_2', type: 'Erasure', name: 'Mei Lin', submitted: '2026-04-20T09:00:00Z', status: 'Completed', dueDate: '2026-05-20T09:00:00Z' },
            { id: 'dsr_3', type: 'Portability', name: 'Raj Patel', submitted: '2026-05-02T14:00:00Z', status: 'In Progress', dueDate: '2026-06-01T14:00:00Z' },
        ],
        cookieConsent: [
            { domain: 'baalvionmining.com', rate: 92.5 },
            { domain: 'baalviontrade.com', rate: 88.2 },
            { domain: 'amarisemaison.com', rate: 95.1 },
        ],
        retentionPolicies: [
            { dataType: 'Customer PII', period: '5 years post-relationship', legalBasis: 'Contractual Necessity, Legal Obligation' },
            { dataType: 'Transaction records', period: '7 years', legalBasis: 'Legal Obligation (tax)' },
            { dataType: 'Marketing consent', period: 'Until withdrawn', legalBasis: 'Consent' },
            { dataType: 'Employee records', period: '6 years post-employment', legalBasis: 'Legal Obligation' },
        ],
    }),
);

// Investor portals — shareable report portals (no portal-registry surfaced yet; reference list).
router.get('/portals', authMiddleware, (req, res) =>
    sendSuccess(req, res, [
        { id: 'portal_abc123', name: 'Q1 2026 General Update', url: '/portal/portal_abc123', pin: '1234', includedBusinesses: ['2', '3', '4'], expires: '2026-10-31', investorName: 'General Partners' },
        { id: 'portal_gulf01', name: 'Gulf Capital — Mining Brief', url: '/portal/portal_gulf01', pin: '5678', includedBusinesses: ['2'], expires: '2026-09-15', investorName: 'Gulf Capital Partners' },
        { id: 'portal_angel7', name: 'Angel Syndicate — Portfolio', url: '/portal/portal_angel7', pin: '4321', includedBusinesses: ['3', '4'], expires: '2026-12-01', investorName: 'Angel Syndicate' },
    ]),
);

module.exports = router;
