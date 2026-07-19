'use strict';
// Live community chat — persistence + realtime fan-out. Distinct from contentService's
// NodeBB-backed discussion threads: chat messages are ephemeral-feeling, high-frequency,
// and don't need NodeBB's topic/reply structure, so they live in their own native table
// and go out over realtime-service's WS gateway instead of a page reload.
const db = require('../models');
const { AppError } = require('../utils/errors');
const realtimePublisher = require('./realtimePublisher');

const MAX_CONTENT_LENGTH = 2000;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

async function loadActiveCommunity(slug) {
    const community = await db.Community.findOne({ where: { slug, is_active: true } });
    if (!community) throw new AppError('NOT_FOUND', 'Community not found', 404);
    return community;
}

function toPublicMessage(row) {
    return {
        id: row.id,
        userId: row.user_id,
        username: row.username,
        content: row.content,
        createdAt: row.created_at,
    };
}

async function listMessages(slug, { before, limit } = {}) {
    const community = await loadActiveCommunity(slug);
    const pageSize = Math.min(Number(limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const where = { community_id: community.id };
    if (before) where.created_at = { [db.Sequelize.Op.lt]: new Date(before) };

    const rows = await db.CommunityChatMessage.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
    });

    // Return oldest-first so the client can append straight to the bottom of the feed.
    return rows.reverse().map(toPublicMessage);
}

async function postMessage(slug, userId, username, content) {
    const trimmed = String(content || '').trim();
    if (!trimmed) throw new AppError('VALIDATION_ERROR', 'Message content is required', 422);
    if (trimmed.length > MAX_CONTENT_LENGTH) {
        throw new AppError('VALIDATION_ERROR', `Message must be ${MAX_CONTENT_LENGTH} characters or fewer`, 422);
    }

    const community = await loadActiveCommunity(slug);
    const row = await db.CommunityChatMessage.create({
        community_id: community.id,
        user_id: userId,
        username: username || null,
        content: trimmed,
    });

    // `slug` rides along in the fan-out payload (not just the room name) so a client
    // subscribed to several community rooms at once can tell which channel a message
    // belongs to without parsing Socket.IO room internals.
    const message = { ...toPublicMessage(row), slug };
    await realtimePublisher.publishToRoom('/community', `community:${slug}`, 'chat:message', message);
    return message;
}

module.exports = { listMessages, postMessage };
