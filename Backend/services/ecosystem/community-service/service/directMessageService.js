'use strict';
// Private 1:1 messaging — distinct from chatService.js (per-community GROUP chat). REST-persisted
// and real end to end; live push (the same realtimePublisher.publishToRoom pattern chatService
// uses) is a deliberate follow-up, not wired here yet — see PR/summary notes. A client polls
// GET .../messages while a conversation is open, same tradeoff many production apps ship first.
const db = require('../models');
const { AppError } = require('../utils/errors');

const MAX_CONTENT_LENGTH = 4000;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Canonical (userA, userB) ordering — user_a_id < user_b_id always, so a UNIQUE(user_a_id,
// user_b_id) constraint can never be bypassed by initiating from either side.
function orderPair(userId, otherUserId) {
    const a = String(userId), b = String(otherUserId);
    return a < b ? [a, b] : [b, a];
}

function toPublicConversation(row, viewerId) {
    const otherUserId = String(row.user_a_id) === String(viewerId) ? row.user_b_id : row.user_a_id;
    return {
        id: row.id,
        otherUserId,
        contextLabel: row.context_label,
        lastMessageAt: row.last_message_at,
        createdAt: row.created_at,
    };
}

function toPublicMessage(row) {
    return {
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        content: row.content,
        readAt: row.read_at,
        createdAt: row.created_at,
    };
}

async function assertParticipant(conversation, userId) {
    if (String(conversation.user_a_id) !== String(userId) && String(conversation.user_b_id) !== String(userId)) {
        throw new AppError('FORBIDDEN', 'You are not part of this conversation', 403);
    }
}

async function getOrCreateConversation(userId, otherUserId, contextLabel) {
    if (String(userId) === String(otherUserId)) throw new AppError('VALIDATION_ERROR', 'Cannot start a conversation with yourself', 400);
    const [userAId, userBId] = orderPair(userId, otherUserId);
    const [conversation] = await db.DirectConversation.findOrCreate({
        where: { user_a_id: userAId, user_b_id: userBId },
        defaults: { user_a_id: userAId, user_b_id: userBId, context_label: contextLabel || null },
    });
    return toPublicConversation(conversation, userId);
}

async function listConversations(userId) {
    const rows = await db.DirectConversation.findAll({
        where: { [db.Sequelize.Op.or]: [{ user_a_id: userId }, { user_b_id: userId }] },
        order: [['last_message_at', 'DESC'], ['created_at', 'DESC']],
    });
    const conversations = rows.map((r) => toPublicConversation(r, userId));
    // Attach the most recent message as a preview (small N, one query per row is acceptable here —
    // a conversation list is not a hot path and N is bounded by how many people message this user).
    await Promise.all(conversations.map(async (c) => {
        const last = await db.DirectMessage.findOne({ where: { conversation_id: c.id }, order: [['created_at', 'DESC']] });
        c.lastMessage = last ? toPublicMessage(last) : null;
    }));
    return conversations;
}

async function listMessages(conversationId, userId, { before, limit } = {}) {
    const conversation = await db.DirectConversation.findByPk(conversationId);
    if (!conversation) throw new AppError('NOT_FOUND', 'Conversation not found', 404);
    await assertParticipant(conversation, userId);

    const pageSize = Math.min(Number(limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const where = { conversation_id: conversationId };
    if (before) where.created_at = { [db.Sequelize.Op.lt]: new Date(before) };

    const rows = await db.DirectMessage.findAll({ where, order: [['created_at', 'DESC']], limit: pageSize });
    return rows.reverse().map(toPublicMessage);
}

async function sendMessage(conversationId, userId, content) {
    const trimmed = String(content || '').trim();
    if (!trimmed) throw new AppError('VALIDATION_ERROR', 'Message content is required', 422);
    if (trimmed.length > MAX_CONTENT_LENGTH) throw new AppError('VALIDATION_ERROR', `Message must be ${MAX_CONTENT_LENGTH} characters or fewer`, 422);

    const conversation = await db.DirectConversation.findByPk(conversationId);
    if (!conversation) throw new AppError('NOT_FOUND', 'Conversation not found', 404);
    await assertParticipant(conversation, userId);

    const row = await db.DirectMessage.create({ conversation_id: conversationId, sender_id: userId, content: trimmed });
    await conversation.update({ last_message_at: row.created_at });
    return toPublicMessage(row);
}

module.exports = { getOrCreateConversation, listConversations, listMessages, sendMessage };
