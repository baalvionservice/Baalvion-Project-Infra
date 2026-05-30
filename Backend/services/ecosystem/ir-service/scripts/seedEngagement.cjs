'use strict';
/**
 * Seeds the IR engagement tables (notifications, subscriptions, votes) + the settings singleton
 * for the single-tenant IR org, mirroring the data the frontend used to hold in-memory. Idempotent.
 *
 *   node scripts/seedEngagement.cjs
 */
require('dotenv').config();
const db = require('../models');

const ORG = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';

async function main() {
    await db.sequelize.authenticate();
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS ir');
    await db.sequelize.sync({ alter: false });

    let n = 0, s = 0, v = 0;

    if ((await db.IrNotification.count({ where: { org_id: ORG } })) === 0) {
        await db.IrNotification.bulkCreate([
            {
                org_id: ORG, title: 'Q4 Financials Released',
                message: 'The Q4 2025 performance reports are now available in the institutional data room.',
                module_source: 'DataRoom', target_roles: ['p1_institutional', 'p2_spv'], status: 'Sent',
                sent_at: '2026-01-15T08:00:00Z',
                delivery_stats: { totalRecipients: 142, deliveredCount: 142, failedCount: 0 }, version_history: [],
            },
            {
                org_id: ORG, title: 'Annual Board Vote Open',
                message: 'The 2026 Board election is now open for eligible shareholders.',
                module_source: 'Voting', target_roles: ['BoardMember', 'p1_institutional'], status: 'Sent',
                sent_at: '2026-01-01T09:00:00Z',
                delivery_stats: { totalRecipients: 38, deliveredCount: 38, failedCount: 0 }, version_history: [],
            },
        ]);
        n = await db.IrNotification.count({ where: { org_id: ORG } });
    }

    if ((await db.IrSubscription.count({ where: { org_id: ORG } })) === 0) {
        await db.IrSubscription.bulkCreate([
            { org_id: ORG, role: 'p1_institutional', email: 'alex@investor.com', preferences: { News: true, Governance: true, Voting: true, DataRoom: true }, active: true },
            { org_id: ORG, role: 'p2_spv', email: 'contact@acme-cap.com', preferences: { News: true, Governance: true, Voting: true, DataRoom: true }, active: true },
            { org_id: ORG, role: 'p3_operator', email: 'elena.p@logistics.ai', preferences: { News: true, Governance: true, Voting: false, DataRoom: true }, active: true },
            { org_id: ORG, role: 'BoardMember', email: 'gregg.l@board.com', preferences: { News: true, Governance: true, Voting: true, DataRoom: true }, active: true },
            { org_id: ORG, role: 'p1_institutional', email: 'jane.smith@fund.com', preferences: { News: false, Governance: true, Voting: true, DataRoom: false }, active: true },
        ]);
        s = await db.IrSubscription.count({ where: { org_id: ORG } });
    }

    if ((await db.IrVote.count({ where: { org_id: ORG } })) === 0) {
        await db.IrVote.bulkCreate([
            {
                org_id: ORG, title: 'Election of Gregg Lemkau to Board',
                description: 'Annual Board election for the 2026 fiscal year.',
                resolution_text: 'Be it resolved that Gregg Lemkau is hereby elected as a Director of the Company...',
                created_by_role: 'IRManager', eligible_roles: ['BoardMember', 'p1_institutional', 'p2_spv'],
                status: 'Closed', start_date: '2026-01-01T00:00:00Z', end_date: '2026-01-15T00:00:00Z',
                votes: [{ voterId: 'user-1', voterRole: 'BoardMember', choice: 'Approve', timestamp: '2026-01-05T10:00:00Z' }],
                version_history: [],
            },
        ]);
        v = await db.IrVote.count({ where: { org_id: ORG } });
    }

    let a = 0;
    if ((await db.IrAlert.count({ where: { org_id: ORG } })) === 0) {
        await db.IrAlert.bulkCreate([
            { org_id: ORG, title: 'Capital Call #4 Issued', message: 'A drawdown notice for 10% of remaining commitment has been issued for Project Olympus.', category: 'CapitalCall', priority: 'High', target_roles: ['phase1', 'phase2', 'admin'], read: false, action_url: '/performance' },
            { org_id: ORG, title: 'Q4 NAV Updated', message: 'The Q4 2025 Net Asset Value has been published to the data room.', category: 'NAVUpdate', priority: 'Medium', target_roles: ['phase1', 'phase2', 'phase3', 'admin'], read: false, action_url: '/performance' },
            { org_id: ORG, title: 'Board Resolution Open for Voting', message: 'The 2026 Board election is open. Cast your vote before Jan 15.', category: 'Governance', priority: 'High', target_roles: ['BoardMember', 'phase1', 'admin'], read: true, action_url: '/governance/my-voting' },
        ]);
        a = await db.IrAlert.count({ where: { org_id: ORG } });
    }

    let bm = 0, gr = 0;
    if ((await db.IrBoardMaterial.count({ where: { org_id: ORG } })) === 0) {
        await db.IrBoardMaterial.bulkCreate([
            { org_id: ORG, title: 'Q4 Strategic M&A Briefing', meeting_date: '2026-02-15', classification: 'Confidential', related_votes: [], document_ids: [], workflow_status: 'Published', version_history: [] },
            { org_id: ORG, title: 'FY2026 Budget & Capital Plan', meeting_date: '2026-03-01', classification: 'Restricted', related_votes: [], document_ids: [], workflow_status: 'Published', version_history: [] },
        ]);
        bm = await db.IrBoardMaterial.count({ where: { org_id: ORG } });
    }

    if ((await db.IrGeneratedReport.count({ where: { org_id: ORG } })) === 0) {
        await db.IrGeneratedReport.bulkCreate([
            { org_id: ORG, title: 'FY2025 Annual Governance Review', report_type: 'Governance', date_range: { start: '2025-01-01', end: '2025-12-31' }, included_modules: ['Governance', 'AuditLogs'], generated_by_role: 'ComplianceOfficer', status: 'Generated', generated_at: '2026-01-05T10:00:00Z', export_format: 'PDF', data_snapshot: { summary: 'Historical baseline for 2025 compliance.' }, version_history: [] },
        ]);
        gr = await db.IrGeneratedReport.count({ where: { org_id: ORG } });
    }

    // Performance snapshot singleton (NAV history, IRR metrics, SPV performance, capital timeline,
    // factsheet documents). force-recreate so the `documents` column applies to an existing table.
    await db.IrPerformance.sync({ force: true });
    await db.IrPerformance.findOrCreate({
        where: { org_id: ORG },
        defaults: {
            org_id: ORG,
            documents: [
                { id: 'doc-p1', title: 'Q4 2025 Audited Valuation Report', category: 'Audit', restrictedTo: ['p1_institutional', 'admin'], lastUpdated: '2026-01-15', mockUrl: '#' },
                { id: 'doc-p2', title: 'Detailed IRR Attribution Analysis', category: 'Performance', restrictedTo: ['p1_institutional', 'p2_spv', 'admin'], lastUpdated: '2026-01-20', mockUrl: '#' },
                { id: 'doc-p3', title: 'Portfolio Liquidity Framework', category: 'Governance', restrictedTo: ['admin', 'compliance'], lastUpdated: '2025-12-10', mockUrl: '#' },
            ],
            nav_history: [
                { date: '2024-Q1', nav: 100000000 }, { date: '2024-Q2', nav: 102500000 }, { date: '2024-Q3', nav: 105000000 }, { date: '2024-Q4', nav: 108200000 },
                { date: '2025-Q1', nav: 112000000 }, { date: '2025-Q2', nav: 115500000 }, { date: '2025-Q3', nav: 119800000 }, { date: '2025-Q4', nav: 124500000 },
            ],
            metrics: { netIRR: 0.184, grossIRR: 0.221, DPI: 0.45, TVPI: 1.38, RVPI: 0.93 },
            spv_performance: [
                { id: 'spv-1', name: 'Project Alpha (Growth Tech)', deployed: 40000000, currentValue: 58200000, gainPercent: 45.5 },
                { id: 'spv-2', name: 'Project Beta (Energy Infra)', deployed: 25000000, currentValue: 31000000, gainPercent: 24.0 },
                { id: 'spv-3', name: 'Project Gamma (Logistics)', deployed: 15000000, currentValue: 18500000, gainPercent: 23.3 },
                { id: 'spv-4', name: 'Project Delta (Fintech)', deployed: 10000000, currentValue: 12800000, gainPercent: 28.0 },
                { id: 'spv-5', name: 'Strategic Liquidity Pool', deployed: 10000000, currentValue: 10500000, gainPercent: 5.0 },
            ],
            capital_timeline: [
                { period: '2024-Q1', called: 50000000, distributed: 0 }, { period: '2024-Q2', called: 10000000, distributed: 2500000 },
                { period: '2024-Q3', called: 5000000, distributed: 5000000 }, { period: '2024-Q4', called: 15000000, distributed: 1200000 },
                { period: '2025-Q1', called: 8000000, distributed: 8500000 }, { period: '2025-Q2', called: 12000000, distributed: 15000000 },
            ],
        },
    });

    // Settings singleton (defaults applied by the model)
    await db.IrSetting.findOrCreate({ where: { org_id: ORG }, defaults: { org_id: ORG } });

    console.log(JSON.stringify({ ok: true, org: ORG, notifications: n, subscriptions: s, votes: v, alerts: a, boardMaterials: bm, generatedReports: gr, performance: 1, settings: 1 }, null, 2));
    process.exit(0);
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
