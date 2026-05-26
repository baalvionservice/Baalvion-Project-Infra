'use strict';
// Idempotent reference + demo seed. Re-running clears each managed collection
// and reinserts a known set, so the long-tail pages render populated data.
// Run with: node seed.js
const db = require('./models');

const now = Date.now();
const iso = (offsetDays = 0) => new Date(now + offsetDays * 86400000).toISOString();

const ORGS = [
    { code: 'COMP-101', tenant_id: 'T-DEMO', name: 'Apex Renewable Industries', type: 'buyer', country: 'United States', status: 'active', kyc_status: 'verified', risk_score: 12.5, contact_email: 'ops@apex.demo' },
    { code: 'COMP-102', tenant_id: 'T-DEMO', name: 'Global Power Systems', type: 'seller', country: 'China', status: 'active', kyc_status: 'verified', risk_score: 8.0, contact_email: 'sales@gps.demo' },
];

// Generic-store collections (frontend reads these via res.data||[] arrays).
const COLLECTIONS = {
    wallets: [
        { companyId: 'COMP-101', currency: 'USD', balance: 2500000, escrow: 0 },
        { companyId: 'COMP-101', currency: 'EUR', balance: 480000, escrow: 0 },
        { companyId: 'COMP-102', currency: 'USD', balance: 1840000, escrow: 0 },
    ],
    alerts: [
        { type: 'CUSTOMS_HOLD', message: 'Container MSKU7782341 held at Rotterdam pending documentation review.', status: 'active', category: 'LOGISTICS', severity: 'high' },
        { type: 'WEATHER_DELAY', message: 'Typhoon advisory on the Shanghai–Long Beach corridor; +36h ETA risk.', status: 'active', category: 'LOGISTICS', severity: 'medium' },
        { type: 'SLA_BREACH', message: 'Carrier acknowledgement SLA exceeded on booking BKG-4471.', status: 'active', category: 'LOGISTICS', severity: 'medium' },
    ],
    ledger_entries: [
        { companyId: 'COMP-101', type: 'debit', amount: 1696000, currency: 'USD', referenceType: 'escrow', referenceId: '1', description: 'Escrow funding for Order 1', hash: '0x9f2a1c' },
        { companyId: 'COMP-101', type: 'credit', amount: 250000, currency: 'USD', referenceType: 'deposit', referenceId: 'TOPUP-9001', description: 'Treasury top-up (wire)', hash: '0x4b7e02' },
        { companyId: 'COMP-102', type: 'credit', amount: 1696000, currency: 'USD', referenceType: 'order', referenceId: '1', description: 'Settlement received for Order 1', hash: '0x77d3aa' },
    ],
    approvals: [
        { referenceType: 'kyc', referenceId: 'COMP-103', status: 'pending', requestedBy: 'SYSTEM_IDENTITY', requiredRole: 'Compliance Admin', reason: 'Institutional KYC verification for node COMP-103.' },
        { referenceType: 'deal', referenceId: '2', status: 'pending', requestedBy: 'COMP-101', requiredRole: 'Executive Director', reason: 'High-value deal authorization (>$1M) requires two-key sign-off.' },
        { referenceType: 'payment', referenceId: 'ESC-1', status: 'approved', requestedBy: 'COMP-101', requiredRole: 'Treasury Officer', reason: 'Escrow release authorization for delivered Order 1.', decidedBy: 'ARBITER-001', decidedAt: iso(-1) },
    ],
    contracts: [
        { companyId: 'COMP-101', title: 'Master Supply Agreement — Copper Cathodes', buyerId: 'COMP-101', sellerId: 'COMP-102', parties: 'Apex Renewable Industries / Global Power Systems', value: 1696000, currency: 'USD', status: 'EXECUTED', version: 2, clauses: [], effectiveDate: iso(-30), expiryDate: iso(335) },
        { companyId: 'COMP-101', title: 'Framework Agreement — Solar PV Modules', buyerId: 'COMP-101', sellerId: 'COMP-102', parties: 'Apex / GPS', value: 840000, currency: 'USD', status: 'LEGAL_REVIEW', version: 1, clauses: [] },
    ],
    policies: [
        { companyId: 'COMP-101', orderId: '1', shipmentId: '1', coverage: 'marine_cargo', insuredAmount: 1696000, premium: 8480, currency: 'USD', status: 'active', underwriterId: 'BAALVION_RE_01', validFrom: iso(-10), validUntil: iso(80) },
        { companyId: 'COMP-101', orderId: '2', coverage: 'trade_credit', insuredAmount: 840000, premium: 5200, currency: 'USD', status: 'underwriting', underwriterId: 'BAALVION_RE_01' },
    ],
    claims: [
        { policyId: 'P-1', shipmentId: '1', reason: 'Cargo damage', description: 'Water ingress detected on 12 pallets during transit inspection.', claimedAmount: 120000, currency: 'USD', status: 'under_review', evidenceRefs: [] },
    ],
    risk_signals: [
        { orgId: 'COMP-102', isResolved: false, type: 'VELOCITY_ANOMALY', severity: 'medium', description: 'Order velocity 3.2x above 90-day baseline.' },
        { orgId: 'COMP-101', isResolved: false, type: 'GEO_MISMATCH', severity: 'low', description: 'Billing/shipping jurisdiction mismatch flagged for review.' },
    ],
    sanctions_signals: [
        { entityId: 'COMP-880', entityName: 'Restricted Holdings LLC', type: 'OFAC', severity: 'critical', matchConfidence: 0.94, description: 'Strong name match against OFAC SDN list.', isResolved: false, timestamp: iso(-2) },
        { entityId: 'COMP-902', entityName: 'Meridian Freight Co', type: 'EU', severity: 'medium', matchConfidence: 0.61, description: 'Partial match against EU consolidated list; manual review.', isResolved: false, timestamp: iso(-1) },
    ],
};

(async () => {
    try {
        await db.sequelize.authenticate();

        for (const o of ORGS) {
            const [row, created] = await db.Organization.findOrCreate({ where: { code: o.code }, defaults: o });
            if (!created) await row.update(o);
            console.log(`org ${o.code} ${created ? 'created' : 'updated'} -> id ${row.id}`);
        }

        for (const [collection, docs] of Object.entries(COLLECTIONS)) {
            await db.Collection.destroy({ where: { collection } });
            await db.Collection.bulkCreate(docs.map((data) => ({ collection, data })));
            console.log(`collection ${collection}: seeded ${docs.length}`);
        }

        console.log('SEED DONE');
        process.exit(0);
    } catch (e) {
        console.error('SEED ERROR', e.message);
        process.exit(1);
    }
})();
