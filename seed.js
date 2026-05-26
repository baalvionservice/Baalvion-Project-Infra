'use strict';
// Idempotent reference-data seed: demo organizations + their wallet documents.
// Run with: node seed.js
const db = require('./models');

const ORGS = [
    { code: 'COMP-101', tenant_id: 'T-DEMO', name: 'Apex Renewable Industries', type: 'buyer', country: 'United States', status: 'active', kyc_status: 'verified', risk_score: 12.5, contact_email: 'ops@apex.demo' },
    { code: 'COMP-102', tenant_id: 'T-DEMO', name: 'Global Power Systems', type: 'seller', country: 'China', status: 'active', kyc_status: 'verified', risk_score: 8.0, contact_email: 'sales@gps.demo' },
];

// Wallets live in the generic store ('wallets' collection): the frontend reads
// GET /wallets?companyId=&currency= which falls through to the collection store.
const WALLETS = [
    { companyId: 'COMP-101', currency: 'USD', balance: 2500000, escrow: 0 },
    { companyId: 'COMP-101', currency: 'EUR', balance: 480000, escrow: 0 },
    { companyId: 'COMP-102', currency: 'USD', balance: 1840000, escrow: 0 },
];

(async () => {
    try {
        await db.sequelize.authenticate();

        for (const o of ORGS) {
            const [row, created] = await db.Organization.findOrCreate({ where: { code: o.code }, defaults: o });
            if (!created) await row.update(o);
            console.log(`org ${o.code} ${created ? 'created' : 'updated'} -> id ${row.id}`);
        }

        const existingWallets = await db.Collection.findAll({ where: { collection: 'wallets' } });
        for (const w of WALLETS) {
            const match = existingWallets.find((r) => r.data && r.data.companyId === w.companyId && r.data.currency === w.currency);
            if (match) {
                await match.update({ data: { ...match.data, ...w } });
                console.log(`wallet ${w.companyId}/${w.currency} updated`);
            } else {
                await db.Collection.create({ collection: 'wallets', data: w });
                console.log(`wallet ${w.companyId}/${w.currency} created`);
            }
        }

        console.log('SEED DONE');
        process.exit(0);
    } catch (e) {
        console.error('SEED ERROR', e.message);
        process.exit(1);
    }
})();
