'use strict';
const db = require('../models');

// Mirrors the Supabase create_notification RPC / deal+application triggers.
// Best-effort: notification failures never block the primary action.
async function createNotification({ userId, type, title, message, link = null }) {
    try {
        const row = await db.Notification.create({ user_id: userId, type, title, message, link });
        return row.id;
    } catch (err) {
        console.error('[notify] failed to create notification:', err.message);
        return null;
    }
}

module.exports = { createNotification };
