'use strict';
/**
 * Set where sellers send their category payment, from the command line (production or local).
 * The address is validated exactly as the admin screen does (checksums), and the change is logged.
 *
 *   node scripts/setPaymentDestination.cjs --method USDT --network TRC20 --address T... [--label "Recipient name"] [--by <adminUserId>]
 *   node scripts/setPaymentDestination.cjs --method BTC --address bc1...
 *   node scripts/setPaymentDestination.cjs --method BINANCE --address 123456789
 *   node scripts/setPaymentDestination.cjs --list
 */
const svc = require('../service/paymentDestinationService');
const { connectDB, sequelize } = require('../models');

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : undefined; };

(async () => {
    await connectDB();
    if (process.argv.includes('--list')) {
        for (const d of await svc.listAdmin()) for (const e of d.entries) console.log(`${d.method.padEnd(8)} ${(e.network || '-').padEnd(8)} ${e.configured ? `${e.address}${e.label ? `  "${e.label}"` : ''}  [${e.source}${e.isActive ? '' : ', OFF'}]` : 'not set'}`);
    } else {
        const method = (arg('method') || '').toUpperCase();
        const address = arg('address');
        if (!method || !address) throw new Error('--method and --address are required');
        const by = arg('by') ? Number(arg('by')) : null;
        const r = await svc.set(by, method, { address, confirmAddress: address, network: arg('network'), label: arg('label') });
        console.log(`saved ${r.method}${r.network ? ` ${r.network}` : ''}: ${r.address}${r.label ? ` (${r.label})` : ''}`);
    }
    await sequelize.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
