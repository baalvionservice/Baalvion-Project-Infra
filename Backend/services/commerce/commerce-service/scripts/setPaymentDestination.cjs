'use strict';
/**
 * Set where sellers send their category payment, from the command line (production or local).
 * The address is validated exactly as the admin screen does (checksums), and the change is logged.
 *
 *   node scripts/setPaymentDestination.cjs --method USDT --network TRC20 --address T... [--label "Recipient name"] [--by <adminUserId>]
 *   node scripts/setPaymentDestination.cjs --method BTC --address bc1...
 *   node scripts/setPaymentDestination.cjs --method BINANCE --address 123456789
 *   node scripts/setPaymentDestination.cjs --method BINANCE --label "Mr Balenciaga" --qr /pay/binance-pay.jpg --link https://app.binance.com/uni-qr/XXXX   (Pay ID optional with a QR)
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
        if (!method) throw new Error('--method is required');
        if (!address && !(method === 'BINANCE' && (arg('qr') || arg('link')))) throw new Error('--address is required (Binance Pay may use --qr/--link instead)');
        const by = arg('by') ? Number(arg('by')) : null;
        const r = await svc.set(by, method, { address: address || '', confirmAddress: address || '', network: arg('network'), label: arg('label'), qrImageUrl: arg('qr'), payLink: arg('link') });
        console.log(`saved ${r.method}${r.network ? ` ${r.network}` : ''}: ${r.address || '(QR only)'}${r.label ? ` (${r.label})` : ''}${r.qrImageUrl ? ` qr=${r.qrImageUrl}` : ''}`);
    }
    await sequelize.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
