'use strict';
const { sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');

const NS = 'commerce.commerce_seller_token_ledger';

async function balanceOf(userId, transaction) {
    const [rows] = await sequelize.query(
        `SELECT COALESCE(SUM(delta), 0)::int AS balance FROM ${NS} WHERE seller_user_id = :userId`,
        { replacements: { userId }, transaction },
    );
    return rows[0].balance;
}

async function activeSession(userId, transaction) {
    const [rows] = await sequelize.query(
        `SELECT id, starts_at AS "startsAt", expires_at AS "expiresAt"
         FROM commerce.commerce_seller_admin_chat_sessions
         WHERE seller_user_id = :userId AND expires_at > NOW()
         ORDER BY expires_at DESC LIMIT 1`,
        { replacements: { userId }, transaction },
    );
    return rows[0] || null;
}

async function getWallet(userId) {
    const [balance, session] = await Promise.all([balanceOf(userId), activeSession(userId)]);
    const { adminChatCostTokens, adminChatMinutes } = config.sellerBond;
    return { balance, withdrawable: false, adminChat: { costTokens: adminChatCostTokens, minutes: adminChatMinutes, activeSession: session } };
}

/**
 * Spend tokens to open a timed chat with the admin. Tokens can't be withdrawn or spent on
 * anything else. A per-seller advisory lock makes the balance check + debit atomic, so two
 * simultaneous requests can't both spend the same tokens.
 */
async function startAdminChat(userId) {
    const { adminChatCostTokens: cost, adminChatMinutes: minutes } = config.sellerBond;
    return sequelize.transaction(async (t) => {
        await sequelize.query('SELECT pg_advisory_xact_lock(:key)', { replacements: { key: Number(userId) }, transaction: t });
        const live = await activeSession(userId, t);
        if (live) return { ...live, alreadyActive: true, balance: await balanceOf(userId, t) };
        const balance = await balanceOf(userId, t);
        if (balance < cost) throw new AppError('INSUFFICIENT_TOKENS', `You need ${cost} tokens to talk to the admin`, 402, { balance, cost });
        const [rows] = await sequelize.query(
            `INSERT INTO commerce.commerce_seller_admin_chat_sessions (seller_user_id, tokens_spent, starts_at, expires_at)
             VALUES (:userId, :cost, NOW(), NOW() + (:minutes || ' minutes')::interval)
             RETURNING id, starts_at AS "startsAt", expires_at AS "expiresAt"`,
            { replacements: { userId, cost, minutes }, transaction: t },
        );
        await sequelize.query(
            `INSERT INTO ${NS} (seller_user_id, delta, reason, ref_id) VALUES (:userId, :delta, 'admin_chat', :ref)`,
            { replacements: { userId, delta: -cost, ref: rows[0].id }, transaction: t },
        );
        return { ...rows[0], alreadyActive: false, balance: balance - cost };
    });
}

const MSG = 'commerce.commerce_seller_admin_chat_messages';
const SESS = 'commerce.commerce_seller_admin_chat_sessions';

async function messagesFor(sessionId, after) {
    const [rows] = await sequelize.query(
        `SELECT id, sender_role AS "senderRole", body, created_at AS "createdAt" FROM ${MSG}
         WHERE session_id = :sessionId AND (:after::timestamptz IS NULL OR created_at > :after::timestamptz)
         ORDER BY created_at ASC LIMIT 500`,
        { replacements: { sessionId, after: after || null } },
    );
    return rows;
}

// The seller's live window: null when there is no paid session running.
async function getSellerChat(userId, after) {
    const session = await activeSession(userId);
    if (!session) return { session: null, messages: [] };
    return { session, messages: await messagesFor(session.id, after) };
}

async function insertMessage(sessionId, role, userId, body) {
    const text = String(body || '').trim();
    if (!text) throw new AppError('VALIDATION_ERROR', 'Message is empty', 400);
    if (text.length > 2000) throw new AppError('VALIDATION_ERROR', 'Message is too long', 400);
    const [rows] = await sequelize.query(
        `INSERT INTO ${MSG} (session_id, sender_role, sender_user_id, body) VALUES (:sessionId, :role, :userId, :text)
         RETURNING id, sender_role AS "senderRole", body, created_at AS "createdAt"`,
        { replacements: { sessionId, role, userId, text } },
    );
    return rows[0];
}

async function sellerSend(userId, body) {
    const session = await activeSession(userId);
    if (!session) throw new AppError('SESSION_EXPIRED', 'Your chat window has ended. Start a new session to keep talking.', 402);
    return insertMessage(session.id, 'seller', userId, body);
}

async function listChatSessions() {
    const [rows] = await sequelize.query(
        `SELECT s.id, s.seller_user_id AS "sellerUserId", s.starts_at AS "startsAt", s.expires_at AS "expiresAt",
                (s.expires_at > NOW()) AS "isActive",
                (SELECT 'HR-' || mp.member_number FROM commerce.commerce_member_profiles mp WHERE mp.user_id = s.seller_user_id) AS "memberNumber",
                (SELECT COUNT(*)::int FROM ${MSG} m WHERE m.session_id = s.id) AS "messageCount",
                (SELECT m.body FROM ${MSG} m WHERE m.session_id = s.id ORDER BY m.created_at DESC LIMIT 1) AS "lastMessage"
         FROM ${SESS} s ORDER BY s.starts_at DESC LIMIT 200`,
    );
    return rows;
}

async function adminGetSession(sessionId, after) {
    const [rows] = await sequelize.query(
        `SELECT id, seller_user_id AS "sellerUserId", starts_at AS "startsAt", expires_at AS "expiresAt", (expires_at > NOW()) AS "isActive"
         FROM ${SESS} WHERE id = :sessionId`, { replacements: { sessionId } },
    );
    if (!rows[0]) throw new AppError('NOT_FOUND', 'Session not found', 404);
    return { session: rows[0], messages: await messagesFor(sessionId, after) };
}

async function adminSend(adminUserId, sessionId, body) {
    const { session } = await adminGetSession(sessionId);
    if (!session.isActive) throw new AppError('SESSION_EXPIRED', 'This chat window has ended', 409);
    return insertMessage(sessionId, 'admin', adminUserId, body);
}

module.exports = { getWallet, startAdminChat, balanceOf, activeSession, getSellerChat, sellerSend, listChatSessions, adminGetSession, adminSend };
