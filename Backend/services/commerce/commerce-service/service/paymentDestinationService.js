'use strict';
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');
const { isBitcoinAddress, isTronAddress, isEvmAddress, isSolanaAddress, isBinancePayId } = require('../utils/cryptoAddress');

const T = 'commerce.commerce_payment_destinations';
const LOG = 'commerce.commerce_payment_destination_changes';

// One address per (method, network). Binance Pay has no network ('').
const METHODS = {
    BTC: { label: 'Bitcoin (BTC)', idLabel: 'Bitcoin address', networks: ['bitcoin'] },
    USDT: { label: 'USDT', idLabel: 'USDT wallet address', networks: ['TRC20', 'BEP20', 'ERC20', 'SOLANA'] },
    BINANCE: { label: 'Binance Pay', idLabel: 'Binance Pay ID', networks: [''] },
};
const NETWORK_LABEL = { bitcoin: 'Bitcoin', TRC20: 'Tron (TRC20)', BEP20: 'BNB Smart Chain (BEP20)', ERC20: 'Ethereum (ERC20)', SOLANA: 'Solana', '': '' };

const normNetwork = (method, network) => {
    if (method === 'BTC') return 'bitcoin';
    if (method === 'BINANCE') return '';
    return String(network || '').toUpperCase();
};

function validate(method, address, network, label) {
    const m = METHODS[method];
    if (!m) throw new AppError('VALIDATION_ERROR', `Unknown payment method "${method}"`, 400);
    const a = String(address || '').trim();
    if (!a) throw new AppError('VALIDATION_ERROR', 'Address is required', 400);
    const net = normNetwork(method, network);
    if (!m.networks.includes(net)) throw new AppError('VALIDATION_ERROR', `${m.label} network must be one of ${m.networks.join(', ')}`, 400);
    const bad = (msg) => new AppError('INVALID_ADDRESS', msg, 400);
    if (method === 'BTC' && !isBitcoinAddress(a)) throw bad('That is not a valid Bitcoin address (checksum failed). Check every character.');
    if (method === 'USDT') {
        if (net === 'TRC20' && !isTronAddress(a)) throw bad('That is not a valid TRC20 (Tron) address — it must start with T and pass its checksum.');
        if ((net === 'ERC20' || net === 'BEP20') && !isEvmAddress(a)) throw bad(`That is not a valid ${net} address — it must be 0x followed by 40 hex characters.`);
        if (net === 'SOLANA' && !isSolanaAddress(a)) throw bad('That is not a valid Solana address.');
    }
    if (method === 'BINANCE' && !isBinancePayId(a)) throw bad('A Binance Pay ID is digits only (6 to 20 of them).');
    const lab = String(label || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    return { address: a, network: net, label: lab || null };
}

// What sellers are paid to for one (method, network). The database wins; the SELLER_BOND_* env vars
// are only a fallback so a fresh environment still works.
async function resolve(method, network) {
    const m = METHODS[method];
    if (!m) return null;
    const net = normNetwork(method, network);
    if (method === 'USDT' && !net) { // no network chosen: first live one, cheapest rails first
        for (const n of m.networks) { const r = await resolve(method, n); if (r) return r; }
        return null;
    }
    if (!m.networks.includes(net)) return null;
    const [row] = await sequelize.query(`SELECT address, network, label, is_active AS "isActive" FROM ${T} WHERE method = :method AND network = :network`, { type: QueryTypes.SELECT, replacements: { method, network: net } });
    if (row) return row.isActive ? { address: row.address, network: row.network || null, label: row.label, source: 'database' } : null;
    const env = config.sellerBond.addresses[method];
    const envNet = method === 'BTC' ? 'bitcoin' : method === 'USDT' ? config.sellerBond.usdtNetwork : '';
    if (env && envNet === net) return { address: env, network: net || null, label: null, source: 'env' };
    return null;
}

async function listAdmin() {
    const out = [];
    for (const [method, m] of Object.entries(METHODS)) {
        const entries = [];
        for (const network of m.networks) {
            const [row] = await sequelize.query(`SELECT address, label, is_active AS "isActive", updated_by AS "updatedBy", updated_at AS "updatedAt" FROM ${T} WHERE method = :method AND network = :network`, { type: QueryTypes.SELECT, replacements: { method, network } });
            const live = await resolve(method, network);
            entries.push({
                network, networkLabel: NETWORK_LABEL[network] ?? network, configured: !!live, source: live ? live.source : 'none',
                address: live ? live.address : null, label: live ? live.label : (row ? row.label : null),
                isActive: row ? row.isActive : !!live, updatedBy: row ? row.updatedBy : null, updatedAt: row ? row.updatedAt : null,
            });
        }
        out.push({ method, label: m.label, idLabel: m.idLabel, entries });
    }
    return out;
}

// Which ways to pay are on right now. No addresses: those are only issued together with a payment.
async function listAvailable() {
    const out = [];
    for (const [method, m] of Object.entries(METHODS)) {
        const networks = [];
        for (const network of m.networks) {
            const live = await resolve(method, network);
            networks.push({ network, label: NETWORK_LABEL[network] ?? network, available: !!live });
        }
        out.push({ method, label: m.label, available: networks.some((n) => n.available), networks: networks.filter((n) => n.network !== '') });
    }
    return out;
}

async function set(adminUserId, method, body) {
    const { address, confirmAddress, isActive } = body;
    if (confirmAddress !== undefined && String(confirmAddress).trim() !== String(address || '').trim()) {
        throw new AppError('VALIDATION_ERROR', 'The two addresses do not match', 400);
    }
    const v = validate(method, address, body.network, body.label);
    return sequelize.transaction(async (t) => {
        const [old] = await sequelize.query(`SELECT address FROM ${T} WHERE method = :method AND network = :network FOR UPDATE`, { type: QueryTypes.SELECT, replacements: { method, network: v.network }, transaction: t });
        await sequelize.query(
            `INSERT INTO ${T} (method, network, address, label, is_active, updated_by) VALUES (:method, :network, :address, :label, :active, :by)
             ON CONFLICT (method, network) DO UPDATE SET address = :address, label = :label, is_active = :active, updated_by = :by, updated_at = NOW()`,
            { replacements: { method, network: v.network, address: v.address, label: v.label, active: isActive !== false, by: adminUserId }, transaction: t },
        );
        await sequelize.query(
            `INSERT INTO ${LOG} (method, old_address, new_address, old_network, new_network, action, changed_by) VALUES (:method, :oa, :na, :net, :net, :action, :by)`,
            { replacements: { method, oa: old ? old.address : null, na: v.address, net: v.network, action: old ? 'updated' : 'created', by: adminUserId }, transaction: t },
        );
        return { method, network: v.network || null, address: v.address, label: v.label };
    });
}

async function history(limit = 100) {
    return sequelize.query(
        `SELECT method, old_address AS "oldAddress", new_address AS "newAddress", new_network AS "network", action, changed_by AS "changedBy", created_at AS "createdAt"
           FROM ${LOG} ORDER BY created_at DESC LIMIT :limit`,
        { type: QueryTypes.SELECT, replacements: { limit: Math.min(Number(limit) || 100, 500) } },
    );
}

module.exports = { METHODS, NETWORK_LABEL, validate, resolve, listAdmin, listAvailable, set, history };
