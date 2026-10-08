'use strict';
require('./_env');
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const crypto = require('../utils/cryptoAddress');

// Well-known public addresses (Bitcoin genesis, a BIP-173 example, the Tron USDT contract).
const BTC_LEGACY = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
const BTC_BECH32 = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const EVM = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

test('real addresses pass their checksum', () => {
    assert.ok(crypto.isBitcoinAddress(BTC_LEGACY));
    assert.ok(crypto.isBitcoinAddress(BTC_BECH32));
    assert.ok(crypto.isTronAddress(TRON));
    assert.ok(crypto.isEvmAddress(EVM));
    assert.ok(crypto.isBinancePayId('123456789'));
});

test('a single wrong character is caught', () => {
    assert.ok(!crypto.isBitcoinAddress(BTC_LEGACY.slice(0, -1) + 'b'));
    assert.ok(!crypto.isBitcoinAddress(BTC_BECH32.slice(0, -1) + 'r'));
    assert.ok(!crypto.isTronAddress(TRON.slice(0, -1) + 'u'));
    assert.ok(!crypto.isEvmAddress(EVM.slice(0, -1)));
});

test('wrong kind of address for the method is rejected', () => {
    assert.ok(!crypto.isBitcoinAddress(TRON));
    assert.ok(!crypto.isTronAddress(BTC_LEGACY));
    assert.ok(!crypto.isBinancePayId('12ab34'));
    assert.ok(!crypto.isBinancePayId('12345'));
});

// Well-known public example addresses (Tether's contracts, wrapped-SOL mint). The marketplace's own
// receiving addresses are deliberately NOT kept in the repository: they live in the database.
const REAL = {
    TRC20: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    EVM: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    SOL: 'So11111111111111111111111111111111111111112',
    BINANCE: '123456789',
};
test('one valid example per network passes validation exactly as entered', () => {
    assert.ok(crypto.isTronAddress(REAL.TRC20), 'TRC20 checksum');
    assert.ok(crypto.isEvmAddress(REAL.EVM));
    assert.ok(crypto.isSolanaAddress(REAL.SOL));
    assert.ok(crypto.isBinancePayId(REAL.BINANCE));
    assert.ok(!crypto.isSolanaAddress(REAL.EVM) && !crypto.isEvmAddress(REAL.SOL) && !crypto.isTronAddress(REAL.EVM));
});

// ── service, with a stubbed database ─────────────────────────────────────────────────────────────
const rows = new Map(); const log = [];
const key = (m, n) => `${m}|${n}`;
const modelsPath = path.join(__dirname, '..', 'models', 'index.js');
const sequelize = {
    query: async (sql, opts = {}) => {
        const r = opts.replacements || {};
        if (/SELECT address, network, label, is_active/.test(sql)) { const x = rows.get(key(r.method, r.network)); return x ? [x] : []; }
        if (/SELECT address, label, is_active/.test(sql)) { const x = rows.get(key(r.method, r.network)); return x ? [x] : []; }
        if (/SELECT address FROM/.test(sql)) { const x = rows.get(key(r.method, r.network)); return x ? [x] : []; }
        if (/INSERT INTO commerce\.commerce_payment_destinations /.test(sql)) { rows.set(key(r.method, r.network), { address: r.address, network: r.network, label: r.label, isActive: r.active }); return []; }
        if (/INSERT INTO commerce\.commerce_payment_destination_changes/.test(sql)) { log.push(r); return []; }
        return [];
    },
    transaction: async (fn) => fn({}),
};
require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: { sequelize } };
const svc = require('../service/paymentDestinationService');

test('USDT keeps a separate address per network', async () => {
    await svc.set(2, 'USDT', { address: REAL.TRC20, confirmAddress: REAL.TRC20, network: 'TRC20' });
    await svc.set(2, 'USDT', { address: REAL.EVM, confirmAddress: REAL.EVM, network: 'BEP20' });
    await svc.set(2, 'USDT', { address: REAL.EVM, confirmAddress: REAL.EVM, network: 'ERC20' });
    await svc.set(2, 'USDT', { address: REAL.SOL, confirmAddress: REAL.SOL, network: 'SOLANA' });
    assert.equal((await svc.resolve('USDT', 'TRC20')).address, REAL.TRC20);
    assert.equal((await svc.resolve('USDT', 'solana')).address, REAL.SOL);
    assert.equal((await svc.resolve('USDT', 'BEP20')).address, REAL.EVM);
    assert.equal((await svc.resolve('USDT')).address, REAL.TRC20, 'no network chosen → first live network');
});

test('the address must match its network', async () => {
    await assert.rejects(svc.set(2, 'USDT', { address: REAL.EVM, confirmAddress: REAL.EVM, network: 'TRC20' }), (e) => e.code === 'INVALID_ADDRESS');
    await assert.rejects(svc.set(2, 'USDT', { address: REAL.TRC20, confirmAddress: REAL.TRC20, network: 'BEP20' }), (e) => e.code === 'INVALID_ADDRESS');
    await assert.rejects(svc.set(2, 'USDT', { address: REAL.TRC20, confirmAddress: REAL.TRC20, network: 'DOGE' }), (e) => e.code === 'VALIDATION_ERROR');
});

test('Binance Pay stores the recipient name sellers will see', async () => {
    await svc.set(2, 'BINANCE', { address: REAL.BINANCE, confirmAddress: REAL.BINANCE, label: '  Mr   Balenciaga ' });
    const d = await svc.resolve('BINANCE');
    assert.equal(d.address, REAL.BINANCE); assert.equal(d.label, 'Mr Balenciaga');
});

test('changes are logged old → new, and a typo or mismatch changes nothing', async () => {
    const before = (await svc.resolve('USDT', 'TRC20')).address;
    await svc.set(2, 'USDT', { address: 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL', confirmAddress: 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL', network: 'TRC20' });
    const last = log[log.length - 1]; assert.equal(last.action, 'updated'); assert.equal(last.oa, before);
    await assert.rejects(svc.set(2, 'USDT', { address: REAL.TRC20, confirmAddress: REAL.TRC20 + 'x', network: 'TRC20' }), /do not match/);
    await assert.rejects(svc.set(2, 'USDT', { address: REAL.TRC20.slice(0, -1) + 'a', confirmAddress: REAL.TRC20.slice(0, -1) + 'a', network: 'TRC20' }), (e) => e.code === 'INVALID_ADDRESS');
    assert.equal((await svc.resolve('USDT', 'TRC20')).address, 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL');
});

test('a switched-off network is unavailable and availability never exposes addresses', async () => {
    await svc.set(2, 'USDT', { address: REAL.SOL, confirmAddress: REAL.SOL, network: 'SOLANA', isActive: false });
    assert.equal(await svc.resolve('USDT', 'SOLANA'), null);
    const usdt = (await svc.listAvailable()).find((m) => m.method === 'USDT');
    assert.equal(usdt.networks.find((n) => n.network === 'SOLANA').available, false);
    assert.equal(usdt.networks.find((n) => n.network === 'TRC20').available, true);
    assert.ok(!JSON.stringify(await svc.listAvailable()).includes(REAL.EVM));
});
