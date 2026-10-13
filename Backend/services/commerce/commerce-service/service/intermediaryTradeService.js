'use strict';
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const { decodeProofs } = require('../utils/paymentProof');
const intermediaries = require('./intermediaryService');
const { perUsdt } = require('./usdtRate');
const { buildQuote } = require('./tradeQuote');

const TRADES = 'commerce.commerce_intermediary_trades';
const MSGS = 'commerce.commerce_intermediary_trade_messages';
const PROOFS = 'commerce.commerce_intermediary_trade_proofs';
const INT = 'commerce.commerce_intermediaries';

const OPEN_LIMIT = 5;
const MAX_PROOFS = 8;
const DISPUTE_WINDOW_MS = 72 * 3600 * 1000;
const FINAL = ['completed', 'cancelled'];
const QUOTE_MINUTES = 30; // a locked price stays valid this long, so the rate cannot drift while someone pays
const quoteLive = (r) => !!(r.quote && r.quote_accepted_at && r.quote_expires_at && new Date(r.quote_expires_at).getTime() > Date.now());

const fail = (code, msg, status = 400) => new AppError(code, msg, status);

async function loadTrade(id, t) {
    const [r] = await sequelize.query(
        `SELECT t.*, i.display_name AS intermediary_name, i.slug AS intermediary_slug, i.user_id AS intermediary_user_id
           FROM ${TRADES} t JOIN ${INT} i ON i.id = t.intermediary_id WHERE t.id = :id`,
        { type: QueryTypes.SELECT, replacements: { id }, transaction: t });
    if (!r) throw fail('NOT_FOUND', 'Trade not found', 404);
    return r;
}

// Which side of the trade this user is on; anyone else gets a 404 (not a hint that the trade exists).
function roleOf(userId, trade) {
    if (String(trade.customer_user_id) === String(userId)) return 'customer';
    if (trade.intermediary_user_id && String(trade.intermediary_user_id) === String(userId)) return 'intermediary';
    return null;
}
function mustParticipate(userId, trade) {
    const role = roleOf(userId, trade);
    if (!role) throw fail('NOT_FOUND', 'Trade not found', 404);
    return role;
}

const present = (r, role) => ({
    id: r.id, ref: r.ref, status: r.status, serviceType: r.service_type, amountUsdt: r.amount_usdt === null ? null : Number(r.amount_usdt),
    instructions: r.instructions, intermediary: { id: r.intermediary_id, name: r.intermediary_name, slug: r.intermediary_slug },
    role, customerUserId: String(r.customer_user_id), createdAt: r.created_at, updatedAt: r.updated_at, paidAt: r.paid_at, completedAt: r.completed_at,
    cancelledBy: r.cancelled_by, disputeReason: r.dispute_reason, resolutionNote: r.resolution_note,
    refundUsd: r.refund_usd === null || r.refund_usd === undefined ? null : Number(r.refund_usd), refundPaidAt: r.refund_paid_at || null,
    quote: r.quote || null, quoteAcceptedAt: r.quote_accepted_at || null, quoteExpiresAt: r.quote_expires_at || null,
    quoteRequired: !!r.quote_required, quoteLive: quoteLive(r),
});

async function create(authCtx, body) {
    const [i] = await sequelize.query(`SELECT * FROM ${INT} WHERE id = :id AND status = 'active'`, { type: QueryTypes.SELECT, replacements: { id: body.intermediaryId } });
    if (!i) throw fail('NOT_FOUND', 'This intermediary is not available', 404);
    if (i.user_id && String(i.user_id) === String(authCtx.userId)) throw fail('VALIDATION_ERROR', 'You cannot start a trade with yourself');
    if (!(i.services || []).includes(body.serviceType)) throw fail('VALIDATION_ERROR', 'This intermediary does not offer that service');
    if (i.trade_limit_usd && body.amountUsdt && Number(body.amountUsdt) > i.trade_limit_usd) {
        throw fail('VALIDATION_ERROR', `This intermediary takes trades up to $${i.trade_limit_usd}`);
    }
    const [open] = await sequelize.query(
        `SELECT COUNT(*)::int AS n FROM ${TRADES} WHERE customer_user_id = :u AND status NOT IN ('completed','cancelled')`,
        { type: QueryTypes.SELECT, replacements: { u: authCtx.userId } });
    if (open.n >= OPEN_LIMIT) throw fail('CONFLICT', `You already have ${OPEN_LIMIT} trades in progress. Finish or cancel one first.`, 409);

    // With a published fee, the server works out the price itself (live rate + fee) and locks it for the customer.
    let quote = null; let acceptedAt = null; let expiresAt = null;
    if (body.amountUsdt && body.currency && i.fee_percent !== null && i.fee_percent !== undefined) {
        const r = await perUsdt(body.currency);
        quote = buildQuote({ usdt: Number(body.amountUsdt), currency: body.currency, ratePerUsdt: r.rate, feePercent: Number(i.fee_percent), source: r.source, at: r.at, by: 'system' });
        acceptedAt = new Date(); expiresAt = new Date(Date.now() + QUOTE_MINUTES * 60000);
    }
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const ref = `REQ-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
        try {
            const [[row]] = await sequelize.query(
                `INSERT INTO ${TRADES} (ref, intermediary_id, customer_user_id, service_type, amount_usdt, instructions, quote, quote_accepted_at, quote_expires_at, quote_required)
                 VALUES (:ref, :i, :u, :svc, :amt, :ins, :quote::jsonb, :qa, :qe, TRUE) RETURNING id`,
                { replacements: { ref, i: i.id, u: authCtx.userId, svc: body.serviceType, amt: body.amountUsdt || null, ins: body.instructions || null, quote: quote ? JSON.stringify(quote) : null, qa: acceptedAt, qe: expiresAt } });
            return present(await loadTrade(row.id), 'customer');
        } catch (err) {
            if (!/unique|duplicate/i.test(String(err.message))) throw err;
        }
    }
    throw fail('CONFLICT', 'Could not create the trade, please try again', 409);
}

async function list(authCtx) {
    const mineAsInt = await intermediaries.activeForUser(authCtx.userId);
    const rows = await sequelize.query(
        `SELECT t.*, i.display_name AS intermediary_name, i.slug AS intermediary_slug, i.user_id AS intermediary_user_id
           FROM ${TRADES} t JOIN ${INT} i ON i.id = t.intermediary_id
          WHERE t.customer_user_id = :u ${mineAsInt ? 'OR t.intermediary_id = :i' : ''} ORDER BY t.updated_at DESC LIMIT 200`,
        { type: QueryTypes.SELECT, replacements: { u: authCtx.userId, i: mineAsInt ? mineAsInt.id : null } });
    return { items: rows.map((r) => present(r, roleOf(authCtx.userId, r) || 'customer')), total: rows.length, isIntermediary: !!mineAsInt };
}

async function detail(trade, role) {
    const messages = await sequelize.query(
        `SELECT id, sender_user_id AS "senderUserId", sender_role AS "senderRole", body, created_at AS "createdAt" FROM ${MSGS} WHERE trade_id = :id ORDER BY created_at`,
        { type: QueryTypes.SELECT, replacements: { id: trade.id } });
    const proofs = await sequelize.query(
        `SELECT id, uploader_role AS "uploaderRole", mime, size_bytes AS "sizeBytes", created_at AS "createdAt" FROM ${PROOFS} WHERE trade_id = :id ORDER BY created_at`,
        { type: QueryTypes.SELECT, replacements: { id: trade.id } });
    const pub = await intermediaries.getPublic(trade.intermediary_id).catch(() => null);
    // What the intermediary's deposit still holds: the most this trade can be refunded from it.
    // The customer sees the scanner only while a price they have locked is valid; before that, nothing to pay yet.
    const showQr = role !== 'customer' || !trade.quote_required || quoteLive(trade);
    return { ...present(trade, role), messages, proofs, payQrs: pub && showQr ? pub.qrs : [], protectedUpToUsd: await intermediaries.heldUsd(trade.intermediary_id) };
}

async function get(authCtx, id) {
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    return detail(trade, role);
}

async function proofImages(authCtx, id, isAdmin) {
    const trade = await loadTrade(id);
    if (!isAdmin) mustParticipate(authCtx.userId, trade);
    const rows = await sequelize.query(
        `SELECT id, uploader_role AS "uploaderRole", mime, data, created_at AS "createdAt" FROM ${PROOFS} WHERE trade_id = :id ORDER BY created_at`,
        { type: QueryTypes.SELECT, replacements: { id } });
    return rows.map((r) => ({ id: r.id, uploaderRole: r.uploaderRole, createdAt: r.createdAt, dataUrl: `data:${r.mime};base64,${Buffer.from(r.data).toString('base64')}` }));
}

async function addMessage(userId, trade, role, body) {
    await sequelize.query(`INSERT INTO ${MSGS} (trade_id, sender_user_id, sender_role, body) VALUES (:t, :u, :r, :b)`, { replacements: { t: trade.id, u: userId, r: role, b: body } });
    await sequelize.query(`UPDATE ${TRADES} SET updated_at = NOW() WHERE id = :t`, { replacements: { t: trade.id } });
}

async function message(authCtx, id, body) {
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    await addMessage(authCtx.userId, trade, role, body);
    return detail(await loadTrade(id), role);
}

async function storeProofs(trade, userId, role, decoded, t) {
    const [c] = await sequelize.query(`SELECT COUNT(*)::int AS n FROM ${PROOFS} WHERE trade_id = :id`, { type: QueryTypes.SELECT, replacements: { id: trade.id }, transaction: t });
    if (c.n + decoded.length > MAX_PROOFS) throw fail('VALIDATION_ERROR', `A trade can hold at most ${MAX_PROOFS} screenshots`);
    for (const p of decoded) {
        await sequelize.query(
            `INSERT INTO ${PROOFS} (trade_id, uploaded_by, uploader_role, mime, size_bytes, data) VALUES (:tr, :u, :r, :m, :s, :d)`,
            { replacements: { tr: trade.id, u: userId, r: role, m: p.mime, s: p.size, d: p.data }, transaction: t });
    }
}

async function addProofs(authCtx, id, proofs) {
    const decoded = decodeProofs(proofs);
    if (decoded.length === 0) throw fail('VALIDATION_ERROR', 'Attach at least one screenshot');
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    if (FINAL.includes(trade.status)) throw fail('CONFLICT', `This trade is ${trade.status}`, 409);
    await sequelize.transaction((t) => storeProofs(trade, authCtx.userId, role, decoded, t));
    await addMessage(authCtx.userId, trade, role, `Attached ${decoded.length} screenshot${decoded.length > 1 ? 's' : ''}.`);
    return detail(await loadTrade(id), role);
}

// Customer says they have paid the intermediary; at least one screenshot is required so the intermediary can check.
async function markPaid(authCtx, id, { proofs, note }) {
    const decoded = decodeProofs(proofs);
    if (decoded.length === 0) throw fail('VALIDATION_ERROR', 'Attach a screenshot of your payment');
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    if (role !== 'customer') throw fail('FORBIDDEN', 'Only the customer can mark a trade as paid', 403);
    if (trade.status !== 'created') throw fail('CONFLICT', `This trade is ${trade.status}`, 409);
    if (trade.quote_required && !trade.quote_accepted_at) throw fail('PRICE_NOT_AGREED', 'Agree the price first. Lock it (or accept the intermediary\'s price) before you pay.', 409);
    await sequelize.transaction(async (t) => {
        await storeProofs(trade, authCtx.userId, role, decoded, t);
        await sequelize.query(`UPDATE ${TRADES} SET status = 'payment_submitted', paid_at = NOW(), updated_at = NOW() WHERE id = :id`, { replacements: { id }, transaction: t });
        await sequelize.query(`INSERT INTO ${MSGS} (trade_id, sender_user_id, sender_role, body) VALUES (:t, :u, 'customer', :b)`,
            { replacements: { t: id, u: authCtx.userId, b: note ? `I have paid. ${note}` : 'I have paid. Screenshot attached.' }, transaction: t });
    });
    return detail(await loadTrade(id), role);
}

// The intermediary sends the customer a final price in the chat when they have no published fee (or want a different one).
async function sendQuote(authCtx, id, { currency, totalLocal, usdt, note }) {
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    if (role !== 'intermediary') throw fail('FORBIDDEN', 'Only the intermediary can send a price', 403);
    if (trade.status !== 'created') throw fail('CONFLICT', `This trade is ${trade.status}`, 409);
    const amount = usdt || (trade.amount_usdt === null ? null : Number(trade.amount_usdt));
    const quote = { by: 'intermediary', currency, usdt: amount, totalLocal: Number(totalLocal), note: note || null, at: new Date().toISOString() };
    await sequelize.query(`UPDATE ${TRADES} SET quote = :q::jsonb, quote_accepted_at = NULL, quote_expires_at = NULL, updated_at = NOW() WHERE id = :id`, { replacements: { id, q: JSON.stringify(quote) } });
    await addMessage(authCtx.userId, trade, role, `Sent a price: ${Number(totalLocal)} ${currency}${amount ? ` for ${amount} USDT` : ''}. Open "Accept this price" to continue.`);
    return detail(await loadTrade(id), role);
}

// The customer accepts the intermediary's price; it is then locked for QUOTE_MINUTES and the scanner appears.
async function acceptQuote(authCtx, id) {
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    if (role !== 'customer') throw fail('FORBIDDEN', 'Only the customer can accept a price', 403);
    if (trade.status !== 'created') throw fail('CONFLICT', `This trade is ${trade.status}`, 409);
    if (!trade.quote) throw fail('CONFLICT', 'There is no price to accept yet', 409);
    if (quoteLive(trade)) return detail(trade, role);
    await sequelize.query(`UPDATE ${TRADES} SET quote_accepted_at = NOW(), quote_expires_at = NOW() + (:m || ' minutes')::interval, updated_at = NOW() WHERE id = :id`, { replacements: { id, m: QUOTE_MINUTES } });
    await addMessage(authCtx.userId, trade, role, 'Accepted the price. I will pay now.');
    return detail(await loadTrade(id), role);
}

// The customer asks for a fresh price at today's rate (only where the server prices the trade from a published fee).
async function requote(authCtx, id, currency) {
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    if (role !== 'customer') throw fail('FORBIDDEN', 'Only the customer can ask for a new price', 403);
    if (trade.status !== 'created') throw fail('CONFLICT', `This trade is ${trade.status}`, 409);
    const [i] = await sequelize.query(`SELECT fee_percent FROM ${INT} WHERE id = :id`, { type: QueryTypes.SELECT, replacements: { id: trade.intermediary_id } });
    const cur = currency || (trade.quote && trade.quote.currency);
    if (!i || i.fee_percent === null || !trade.amount_usdt || !cur) throw fail('CONFLICT', 'This price is set by the intermediary. Ask them for a new one in the chat.', 409);
    const r = await perUsdt(cur);
    const quote = buildQuote({ usdt: Number(trade.amount_usdt), currency: cur, ratePerUsdt: r.rate, feePercent: Number(i.fee_percent), source: r.source, at: r.at, by: 'system' });
    await sequelize.query(`UPDATE ${TRADES} SET quote = :q::jsonb, quote_accepted_at = NOW(), quote_expires_at = NOW() + (:m || ' minutes')::interval, updated_at = NOW() WHERE id = :id`, { replacements: { id, q: JSON.stringify(quote), m: QUOTE_MINUTES } });
    await addMessage(authCtx.userId, trade, role, `Locked a new price: ${quote.totalLocal} ${quote.currency}.`);
    return detail(await loadTrade(id), role);
}

// One of the intermediary's QR images, for a trade. A customer can open it only while a price they locked is valid.
async function qrForTrade(authCtx, id, qrId) {
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    if (role === 'customer' && trade.quote_required && !quoteLive(trade)) throw fail('PRICE_NOT_LOCKED', 'Lock the price first. The scanner appears once the price is agreed.', 403);
    return intermediaries.qrImage(trade.intermediary_id, qrId);
}

async function move(authCtx, id, { roles, from, to, set = '', noteBody }) {
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    if (!roles.includes(role)) throw fail('FORBIDDEN', 'You cannot do that on this trade', 403);
    if (!from.includes(trade.status)) throw fail('CONFLICT', `This trade is ${trade.status}`, 409);
    await sequelize.query(`UPDATE ${TRADES} SET status = :to, ${set} updated_at = NOW() WHERE id = :id`, { replacements: { id, to, by: role } });
    if (noteBody) await addMessage(authCtx.userId, trade, role, noteBody);
    return detail(await loadTrade(id), role);
}

const confirmPayment = (a, id) => move(a, id, { roles: ['intermediary'], from: ['payment_submitted'], to: 'in_progress', noteBody: 'Payment received. Working on your request.' });
const complete = (a, id) => move(a, id, { roles: ['intermediary'], from: ['in_progress'], to: 'completed', set: 'completed_at = NOW(),', noteBody: 'Marked as completed.' });

async function cancel(authCtx, id) {
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    const allowed = role === 'customer' ? ['created'] : ['created', 'payment_submitted', 'in_progress'];
    if (!allowed.includes(trade.status)) throw fail('CONFLICT', role === 'customer' ? 'After you have paid, ask the intermediary to cancel or raise a dispute' : `This trade is ${trade.status}`, 409);
    await sequelize.query(`UPDATE ${TRADES} SET status = 'cancelled', cancelled_by = :by, updated_at = NOW() WHERE id = :id`, { replacements: { id, by: role } });
    await addMessage(authCtx.userId, trade, role, 'Cancelled this trade.');
    return detail(await loadTrade(id), role);
}

async function dispute(authCtx, id, reason) {
    const trade = await loadTrade(id);
    const role = mustParticipate(authCtx.userId, trade);
    const recent = trade.status === 'completed' && trade.completed_at && Date.now() - new Date(trade.completed_at).getTime() <= DISPUTE_WINDOW_MS;
    if (!['payment_submitted', 'in_progress'].includes(trade.status) && !recent) throw fail('CONFLICT', 'A dispute can be raised while a trade is paid or in progress, or within 72 hours after it completes', 409);
    await sequelize.query(`UPDATE ${TRADES} SET status = 'disputed', dispute_reason = :r, disputed_by = :u, updated_at = NOW() WHERE id = :id`, { replacements: { id, r: reason, u: authCtx.userId } });
    await addMessage(authCtx.userId, trade, role, `Raised a dispute: ${reason}`);
    return detail(await loadTrade(id), role);
}

// Admin
async function adminList(status) {
    const rows = await sequelize.query(
        `SELECT t.*, i.display_name AS intermediary_name, i.slug AS intermediary_slug, i.user_id AS intermediary_user_id
           FROM ${TRADES} t JOIN ${INT} i ON i.id = t.intermediary_id ${status ? 'WHERE t.status = :status' : ''} ORDER BY t.updated_at DESC LIMIT 200`,
        { type: QueryTypes.SELECT, replacements: { status } });
    return { items: rows.map((r) => present(r, 'admin')), total: rows.length };
}
async function adminGet(id) { return detail(await loadTrade(id), 'admin'); }

// outcome 'refunded' = decided for the customer: the refund is taken from the intermediary's deposit (up to what it holds)
// and recorded on the trade; the admin then pays the customer and marks the refund paid.
async function resolve(authCtx, id, { outcome, note, refundUsd }) {
    const trade = await loadTrade(id);
    if (trade.status !== 'disputed') throw fail('CONFLICT', `This trade is ${trade.status}`, 409);
    if (outcome === 'refunded' && !(Number(refundUsd) > 0)) throw fail('VALIDATION_ERROR', 'Enter the refund amount in USD');
    const to = outcome === 'completed' ? 'completed' : 'cancelled';
    await sequelize.transaction(async (t) => {
        if (outcome === 'refunded') {
            await intermediaries.debit(trade.intermediary_id, refundUsd, { reason: 'refund_customer', tradeId: id, note, adminUserId: authCtx.userId }, t);
        }
        await sequelize.query(
            `UPDATE ${TRADES} SET status = :to, resolution_note = :note, resolved_by = :by, refund_usd = :refund,
                    ${to === 'completed' ? 'completed_at = COALESCE(completed_at, NOW()),' : ''} updated_at = NOW() WHERE id = :id`,
            { replacements: { id, to, note, by: authCtx.userId, refund: outcome === 'refunded' ? Number(refundUsd) : null }, transaction: t });
    });
    const text = outcome === 'refunded' ? `Dispute decided for the customer: $${Number(refundUsd).toFixed(2)} refunded from the intermediary's deposit.` : `Dispute resolved as ${to}.`;
    await addMessage(authCtx.userId, trade, 'admin', `${text} ${note}`);
    return detail(await loadTrade(id), 'admin');
}

async function markRefundPaid(authCtx, id) {
    const trade = await loadTrade(id);
    if (!(Number(trade.refund_usd) > 0)) throw fail('CONFLICT', 'This trade has no refund', 409);
    if (trade.refund_paid_at) throw fail('CONFLICT', 'The refund is already marked paid', 409);
    await sequelize.query(`UPDATE ${TRADES} SET refund_paid_at = NOW(), updated_at = NOW() WHERE id = :id`, { replacements: { id } });
    await addMessage(authCtx.userId, trade, 'admin', `Refund of $${Number(trade.refund_usd).toFixed(2)} has been paid to the customer.`);
    return detail(await loadTrade(id), 'admin');
}

module.exports = { sendQuote, acceptQuote, requote, qrForTrade, create, list, get, proofImages, message, addProofs, markPaid, confirmPayment, complete, cancel, dispute, adminList, adminGet, resolve, markRefundPaid };
