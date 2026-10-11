'use strict';
/**
 * List an intermediary directly (for someone who paid the deposit outside the site and was confirmed by an admin).
 * Idempotent on --slug. Run inside the commerce container image.
 *
 *   node scripts/seedIntermediary.cjs --name "Full Name" --slug full-name --services buy_usdt,crypto_trade,account_setup \
 *        --bio "..." --commission "..." --deposit 1000 --verified \
 *        --qr "PhonePe=/path/a.jpg" --qr "Bank account (UPI)=/path/b.jpg" [--user-id 123]
 */
const fs = require('fs');
const { QueryTypes } = require('sequelize');
const { connectDB, sequelize } = require('../models');
const { decodeProofs } = require('../utils/paymentProof');

const args = process.argv.slice(2);
const one = (n) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : undefined; };
const many = (n) => args.reduce((a, v, i) => (v === `--${n}` ? [...a, args[i + 1]] : a), []);

(async () => {
    await connectDB();
    const name = one('name'); const slug = one('slug');
    if (!name || !slug) throw new Error('--name and --slug are required');
    const services = (one('services') || '').split(',').filter(Boolean);
    const qrs = many('qr').map((s) => { const [label, file] = [s.slice(0, s.indexOf('=')), s.slice(s.indexOf('=') + 1)]; const buf = fs.readFileSync(file); const mime = /\.png$/i.test(file) ? 'image/png' : /\.webp$/i.test(file) ? 'image/webp' : 'image/jpeg'; return { label, mime, data: buf.toString('base64') }; });
    const decoded = decodeProofs(qrs.map((q) => ({ mime: q.mime, data: q.data })));
    const deposit = Number(one('deposit') || 0);
    await sequelize.transaction(async (t) => {
        const [existing] = await sequelize.query('SELECT id FROM commerce.commerce_intermediaries WHERE slug = :slug', { type: QueryTypes.SELECT, replacements: { slug }, transaction: t });
        if (existing) await sequelize.query('DELETE FROM commerce.commerce_intermediaries WHERE id = :id', { replacements: { id: existing.id }, transaction: t });
        const [[row]] = await sequelize.query(
            `INSERT INTO commerce.commerce_intermediaries (user_id, slug, display_name, bio, services, languages, commission_note, trade_limit_usd, status, verified, deposit_usd, deposit_confirmed_at, approved_at)
             VALUES (:u, :slug, :name, :bio, :services::jsonb, :languages::jsonb, :commission, :limit, 'active', :verified, :deposit, :depositAt, NOW()) RETURNING id`,
            { replacements: { u: one('user-id') || null, slug, name, bio: one('bio') || null, services: JSON.stringify(services), languages: JSON.stringify((one('languages') || '').split(',').filter(Boolean)), commission: one('commission') || null, limit: one('limit') ? Number(one('limit')) : null, verified: args.includes('--verified'), deposit, depositAt: deposit > 0 ? new Date() : null }, transaction: t });
        if (deposit > 0) await sequelize.query("INSERT INTO commerce.commerce_intermediary_deposit_ledger (intermediary_id, delta_usd, reason, note) VALUES (:id, :d, 'deposit', 'Deposit confirmed by the owner (paid directly)')", { replacements: { id: row.id, d: deposit }, transaction: t });
        let sort = 0;
        for (let i = 0; i < decoded.length; i += 1) {
            await sequelize.query('INSERT INTO commerce.commerce_intermediary_qrs (intermediary_id, label, mime, size_bytes, data, sort) VALUES (:id, :label, :mime, :size, :data, :sort)',
                { replacements: { id: row.id, label: qrs[i].label || `QR ${i + 1}`, mime: decoded[i].mime, size: decoded[i].size, data: decoded[i].data, sort: sort += 1 }, transaction: t });
        }
        console.log(`listed ${name} (${slug}) id=${row.id} qrs=${decoded.length} verified=${args.includes('--verified')} deposit=$${deposit}`);
    });
    await sequelize.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
