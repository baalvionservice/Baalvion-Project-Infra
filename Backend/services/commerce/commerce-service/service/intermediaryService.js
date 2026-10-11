'use strict';
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');
const { decodeProofs } = require('../utils/paymentProof');

const T = 'commerce.commerce_intermediaries';
const QR = 'commerce.commerce_intermediary_qrs';
const TRADES = 'commerce.commerce_intermediary_trades';
const SERVICES = ['buy_usdt', 'crypto_trade', 'account_setup', 'other'];
const MAX_QRS = 3;

const bad = (msg) => new AppError('VALIDATION_ERROR', msg, 400);

// What anyone may see about an intermediary: no user id, no UPI IDs, no contact details.
const toPublic = (r, qrs, completedTrades) => ({
    id: r.id, slug: r.slug, displayName: r.display_name, bio: r.bio, services: r.services || [], languages: r.languages || [],
    commissionNote: r.commission_note, tradeLimitUsd: r.trade_limit_usd, verified: r.verified,
    depositUsd: Number(r.deposit_usd) > 0 && r.deposit_confirmed_at ? Number(r.deposit_usd) : 0,
    listedSince: r.approved_at || r.created_at, completedTrades: completedTrades || 0,
    qrs: (qrs || []).map((q) => ({ id: q.id, label: q.label })),
});

const toOwn = (r, qrs) => ({ ...toPublic(r, qrs, 0), status: r.status, userId: r.user_id ? String(r.user_id) : null });

async function qrList(id) {
    return sequelize.query(`SELECT id, label FROM ${QR} WHERE intermediary_id = :id ORDER BY sort, created_at`, { type: QueryTypes.SELECT, replacements: { id } });
}

function cleanProfile(body) {
    const displayName = String(body.displayName || '').replace(/\s+/g, ' ').trim();
    if (displayName.length < 2 || displayName.length > 120) throw bad('Enter the name people will see (2 to 120 characters)');
    const services = [...new Set((body.services || []).filter((s) => SERVICES.includes(s)))];
    if (services.length === 0) throw bad('Choose at least one service you offer');
    const clip = (v, n) => (v ? String(v).trim().slice(0, n) : null);
    return {
        displayName, services,
        bio: clip(body.bio, 1500),
        languages: [...new Set((body.languages || []).map((l) => String(l).trim().slice(0, 40)).filter(Boolean))].slice(0, 8),
        commissionNote: clip(body.commissionNote, 200),
        tradeLimitUsd: body.tradeLimitUsd ? Math.round(Number(body.tradeLimitUsd)) : null,
    };
}

async function uniqueSlug(name, t) {
    const base = slugify(name) || 'intermediary';
    for (let i = 0; i < 50; i += 1) {
        const slug = i === 0 ? base : `${base}-${i + 1}`;
        const [row] = await sequelize.query(`SELECT 1 FROM ${T} WHERE slug = :slug`, { type: QueryTypes.SELECT, replacements: { slug }, transaction: t });
        if (!row) return slug;
    }
    return `${base}-${Date.now()}`;
}

async function insertQrs(intermediaryId, qrs, t) {
    let sort = 0;
    for (const q of qrs) {
        await sequelize.query(
            `INSERT INTO ${QR} (intermediary_id, label, mime, size_bytes, data, sort) VALUES (:id, :label, :mime, :size, :data, :sort)`,
            { replacements: { id: intermediaryId, label: q.label, mime: q.mime, size: q.size, data: q.data, sort: sort += 1 }, transaction: t },
        );
    }
}

// Applicant: save the profile and QR codes, and issue the activation deposit payment.
async function apply(authCtx, body) {
    if (!authCtx.userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    const profile = cleanProfile(body);
    const rawQrs = body.qrs || [];
    if (rawQrs.length < 1 || rawQrs.length > MAX_QRS) throw bad(`Add 1 to ${MAX_QRS} payment QR codes customers will scan`);
    const decoded = decodeProofs(rawQrs.map((q) => ({ mime: q.mime, data: q.data })));
    const qrs = decoded.map((d, i) => ({ ...d, label: String(rawQrs[i].label || '').trim().slice(0, 60) || `QR ${i + 1}` }));

    const [existing] = await sequelize.query(`SELECT id, status FROM ${T} WHERE user_id = :u`, { type: QueryTypes.SELECT, replacements: { u: authCtx.userId } });
    if (existing && existing.status !== 'rejected') throw new AppError('CONFLICT', 'You already have an intermediary application', 409);

    const bondService = require('./sellerBondService');
    const payment = await bondService.issuePayment(authCtx, { kind: 'agent_activation', currency: body.currency, network: body.network });
    try {
        const id = await sequelize.transaction(async (t) => {
            if (existing) await sequelize.query(`DELETE FROM ${T} WHERE id = :id`, { replacements: { id: existing.id }, transaction: t });
            const slug = await uniqueSlug(profile.displayName, t);
            const [[row]] = await sequelize.query(
                `INSERT INTO ${T} (user_id, slug, display_name, bio, services, languages, commission_note, trade_limit_usd, status, deposit_bond_id)
                 VALUES (:u, :slug, :name, :bio, :services::jsonb, :languages::jsonb, :commission, :limit, 'applied', :bond) RETURNING id`,
                { replacements: { u: authCtx.userId, slug, name: profile.displayName, bio: profile.bio, services: JSON.stringify(profile.services), languages: JSON.stringify(profile.languages), commission: profile.commissionNote, limit: profile.tradeLimitUsd, bond: payment.id }, transaction: t },
            );
            await insertQrs(row.id, qrs, t);
            return row.id;
        });
        return { intermediaryId: id, payment };
    } catch (err) {
        await sequelize.query(`UPDATE commerce.commerce_seller_category_bonds SET status = 'rejected', note = 'Application could not be saved', closed_at = NOW() WHERE id = :id AND status = 'awaiting_payment'`, { replacements: { id: payment.id } });
        throw err;
    }
}

// The signed-in user's own application and its payment.
async function mine(userId) {
    const [row] = await sequelize.query(`SELECT * FROM ${T} WHERE user_id = :u`, { type: QueryTypes.SELECT, replacements: { u: userId } });
    if (!row) return { intermediary: null, payment: null };
    const bondService = require('./sellerBondService');
    const payments = await bondService.listMine(userId);
    const payment = payments.find((p) => p.id === row.deposit_bond_id) || null;
    return { intermediary: toOwn(row, await qrList(row.id)), payment };
}

async function listPublic() {
    const rows = await sequelize.query(`SELECT * FROM ${T} WHERE status = 'active' ORDER BY approved_at DESC NULLS LAST, created_at DESC`, { type: QueryTypes.SELECT });
    const out = [];
    for (const r of rows) {
        const [c] = await sequelize.query(`SELECT COUNT(*)::int AS n FROM ${TRADES} WHERE intermediary_id = :id AND status = 'completed'`, { type: QueryTypes.SELECT, replacements: { id: r.id } });
        out.push(toPublic(r, await qrList(r.id), c.n));
    }
    return { items: out, total: out.length };
}

async function getPublic(slugOrId) {
    const [r] = await sequelize.query(`SELECT * FROM ${T} WHERE status = 'active' AND (slug = :k OR id::text = :k)`, { type: QueryTypes.SELECT, replacements: { k: slugOrId } });
    if (!r) throw new AppError('NOT_FOUND', 'Intermediary not found', 404);
    const [c] = await sequelize.query(`SELECT COUNT(*)::int AS n FROM ${TRADES} WHERE intermediary_id = :id AND status = 'completed'`, { type: QueryTypes.SELECT, replacements: { id: r.id } });
    return toPublic(r, await qrList(r.id), c.n);
}

// One QR image, only while the intermediary is listed.
async function qrImage(intermediaryId, qrId) {
    const [q] = await sequelize.query(
        `SELECT q.mime, q.data FROM ${QR} q JOIN ${T} i ON i.id = q.intermediary_id WHERE q.id = :q AND i.id = :i AND i.status = 'active'`,
        { type: QueryTypes.SELECT, replacements: { q: qrId, i: intermediaryId } },
    );
    if (!q) throw new AppError('NOT_FOUND', 'Not found', 404);
    return { mime: q.mime, data: Buffer.from(q.data) };
}

// Admin review: the application with its QR codes as data URLs (a few small images).
async function adminList(status) {
    const rows = await sequelize.query(`SELECT * FROM ${T} ${status ? 'WHERE status = :status' : ''} ORDER BY created_at DESC LIMIT 200`, { type: QueryTypes.SELECT, replacements: { status } });
    return rows.map((r) => ({ ...toOwn(r, []), createdAt: r.created_at, depositBondId: r.deposit_bond_id }));
}

async function adminGet(id) {
    const [r] = await sequelize.query(`SELECT * FROM ${T} WHERE id = :id`, { type: QueryTypes.SELECT, replacements: { id } });
    if (!r) throw new AppError('NOT_FOUND', 'Not found', 404);
    const qrs = await sequelize.query(`SELECT id, label, mime, data FROM ${QR} WHERE intermediary_id = :id ORDER BY sort`, { type: QueryTypes.SELECT, replacements: { id } });
    return { ...toOwn(r, qrs), createdAt: r.created_at, qrImages: qrs.map((q) => ({ id: q.id, label: q.label, dataUrl: `data:${q.mime};base64,${Buffer.from(q.data).toString('base64')}` })) };
}

async function byBond(bondId, t) {
    const [r] = await sequelize.query(`SELECT * FROM ${T} WHERE deposit_bond_id = :b`, { type: QueryTypes.SELECT, replacements: { b: bondId }, transaction: t });
    return r || null;
}

// Hooks called by the payment flow, so listing follows the deposit and nothing else.
async function onPaymentSubmitted(bondId) {
    await sequelize.query(`UPDATE ${T} SET status = 'payment_submitted', updated_at = NOW() WHERE deposit_bond_id = :b AND status = 'applied'`, { replacements: { b: bondId } });
}
async function onPaymentConfirmed(bondId, adminUserId, amountUsd, t) {
    const r = await byBond(bondId, t);
    if (!r) return;
    await sequelize.query(
        `UPDATE ${T} SET status = 'active', verified = TRUE, deposit_usd = :usd, deposit_confirmed_at = NOW(), approved_by = :by, approved_at = NOW(), updated_at = NOW() WHERE id = :id`,
        { replacements: { id: r.id, usd: amountUsd, by: adminUserId }, transaction: t },
    );
}
async function onPaymentClosed(bondId, status) {
    await sequelize.query(`UPDATE ${T} SET status = :status, updated_at = NOW() WHERE deposit_bond_id = :b`, { replacements: { b: bondId, status } });
}

// The intermediary row for a signed-in user, only when listed. Used to authorise the intermediary side of a trade.
async function activeForUser(userId) {
    const [r] = await sequelize.query(`SELECT * FROM ${T} WHERE user_id = :u AND status = 'active'`, { type: QueryTypes.SELECT, replacements: { u: userId } });
    return r || null;
}

module.exports = {
    SERVICES, apply, mine, listPublic, getPublic, qrImage, adminList, adminGet,
    onPaymentSubmitted, onPaymentConfirmed, onPaymentClosed, activeForUser, config,
};
