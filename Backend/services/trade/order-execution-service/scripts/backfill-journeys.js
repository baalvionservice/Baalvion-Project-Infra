'use strict';
/**
 * Opens the order journey for every order that has a buyer and a seller organisation but no journey
 * yet. Safe to run repeatedly: an order that already has a journey is answered 409 and skipped.
 *
 *   node scripts/backfill-journeys.js            # all orders
 *   node scripts/backfill-journeys.js --dry-run  # only count
 */
const { runWithTenant } = require('@baalvion/tenancy');
const db = require('../models');
const journeyClient = require('../services/journeyClient');

(async () => {
    const dry = process.argv.includes('--dry-run');
    if (!dry && !journeyClient.enabled()) { console.error('JOURNEY_TRADE_URL and JOURNEY_INTERNAL_SECRET must be set.'); process.exit(1); }
    const orders = await runWithTenant({ tenantId: null, bypass: true }, () => db.sequelize.transaction((t) => db.Order.findAll({ transaction: t, order: [['created_at', 'ASC']] })));
    const todo = orders.filter(journeyClient.hasBothParties);
    console.log(`${orders.length} orders, ${todo.length} with a buyer and a different seller organisation`);
    if (dry) process.exit(0);
    const tally = {};
    for (const o of todo) {
        const r = await journeyClient.openJourney(journeyClient.toJourneyRequest(o));
        tally[r.status] = (tally[r.status] || 0) + 1;
        if (!r.ok) console.warn(`  order ${o.id}: ${r.status} ${r.error || ''}`);
    }
    console.log(JSON.stringify(tally));
    process.exit(Object.keys(tally).some((k) => k === 'failed' || k === 'rejected') ? 2 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
