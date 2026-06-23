'use strict';
// Device-token registry + per-user channel preferences, stored in Redis (the
// service is otherwise stateless). Tokens feed the push channel; preferences let
// the dispatcher honor per-user opt-outs.
const config = require('../config/appConfig');
const redis  = require('../config/redis');
const logger = require('../utils/logger');

const CHANNELS = ['email', 'sms', 'push', 'inapp', 'webhook'];

const devKey  = (userId) => `${config.keys.devices}:${userId}`;
const prefKey = (userId) => `${config.keys.prefs}:${userId}`;

// ── Device tokens ───────────────────────────────────────────────────────────
async function registerDevice(userId, token, platform = 'web') {
    const r = redis.getClient();
    if (!r) throw new Error('Redis unavailable');
    await r.hset(devKey(userId), token, JSON.stringify({ platform, ts: Date.now() }));
    return { userId, token, platform };
}

async function unregisterDevice(userId, token) {
    const r = redis.getClient();
    if (!r) throw new Error('Redis unavailable');
    const removed = await r.hdel(devKey(userId), token);
    return { userId, token, removed: removed > 0 };
}

async function listDevices(userId) {
    const r = redis.getClient();
    if (!r) return [];
    const map = await r.hgetall(devKey(userId));
    return Object.entries(map || {}).map(([token, meta]) => {
        let parsed = {}; try { parsed = JSON.parse(meta); } catch (err) { logger.warn({ err: err && err.message, userId }, 'listDevices: skipping unparseable device entry'); }
        return { token, ...parsed };
    });
}

async function getTokens(userId) {
    const r = redis.getClient();
    if (!r) return [];
    return Object.keys((await r.hgetall(devKey(userId))) || {});
}

// ── Preferences ─────────────────────────────────────────────────────────────
async function getPreferences(userId) {
    const r = redis.getClient();
    const stored = r ? await r.hgetall(prefKey(userId)) : {};
    // Default: every channel enabled unless explicitly turned 'off'.
    const prefs = {};
    for (const c of CHANNELS) prefs[c] = (stored?.[c] ?? 'on') !== 'off';
    return prefs;
}

async function setPreferences(userId, updates = {}) {
    const r = redis.getClient();
    if (!r) throw new Error('Redis unavailable');
    const pairs = [];
    for (const [channel, enabled] of Object.entries(updates)) {
        if (!CHANNELS.includes(channel)) continue;
        pairs.push(channel, enabled ? 'on' : 'off');
    }
    if (pairs.length) await r.hset(prefKey(userId), ...pairs);
    return getPreferences(userId);
}

async function isChannelEnabled(userId, channel) {
    if (!userId) return true; // anonymous/explicit recipient → no stored prefs
    const prefs = await getPreferences(userId);
    return prefs[channel] !== false;
}

module.exports = {
    CHANNELS, registerDevice, unregisterDevice, listDevices, getTokens,
    getPreferences, setPreferences, isChannelEnabled,
};
