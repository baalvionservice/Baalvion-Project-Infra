'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Video/voice rooms. Env-gated provider:
//   • VIDEO_PROVIDER=daily + DAILY_API_KEY  → Daily.co room + short-lived meeting
//     token (private rooms, recording, knocking, etc.).
//   • otherwise                             → a Jitsi Meet public room. This needs
//     NO API key and works in-browser TODAY, so video is functional out of the box
//     and Daily is a drop-in production upgrade.
//
// Rooms are deterministic per ROOM KEY, not just per booking — a scheduled
// consultation keys off `booking:<id>` (unchanged from before), and an ad-hoc
// chat call keys off `conv:<sorted user ids>` so both parties land in the
// same room regardless of who starts the call, with no booking required.
// ─────────────────────────────────────────────────────────────────────────────
const crypto = require('crypto');
const { getSecret } = require('../config/secrets');

const PROVIDER = String(process.env.VIDEO_PROVIDER || '').toLowerCase();
const DAILY_DOMAIN = process.env.DAILY_DOMAIN; // e.g. yourco.daily.co

// API credentials may be sourced from a mounted secrets file. Constrain the
// value to the safe character set of a bearer token (alphanumerics + a few
// token-safe separators) before it is ever placed in an HTTP header, so no
// stray CR/LF/whitespace or other file content can leak into the request.
function safeBearerKey(raw) {
    const key = String(raw == null ? '' : raw).trim();
    return /^[A-Za-z0-9._~+/=-]+$/.test(key) ? key : '';
}
const DAILY_KEY = safeBearerKey(getSecret('DAILY_API_KEY'));

// Stable, unguessable room name for a room key (so a leaked id isn't a room name).
function roomNameForKey(key) {
    const salt = getSecret('JWT_PUBLIC_KEY') || 'law-elite';
    const h = crypto.createHash('sha256').update(`${salt}:${key}`).digest('hex').slice(0, 16);
    const safeKey = String(key).replace(/[^a-zA-Z0-9]+/g, '-');
    return `lawelite-${safeKey}-${h}`;
}

// Backward-compatible: existing booking rooms use the exact same key shape
// ("booking:<id>") that roomName(bookingId) previously hashed directly, so
// scheduled consultations resolve to the identical room as before.
const roomName = (bookingId) => roomNameForKey(`booking:${bookingId}`);

// Ad-hoc chat call: deterministic room for a pair of users regardless of who
// starts it — sort so (A,B) and (B,A) hash to the same key.
function conversationKey(userIdA, userIdB) {
    const [a, b] = [String(userIdA), String(userIdB)].sort();
    return `conv:${a}:${b}`;
}

async function dailyRoom(key) {
    const name = roomNameForKey(key);
    // Create (idempotent-ish: Daily returns 409 if exists — we then just use it).
    const exp = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2h
    const res = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: { Authorization: `Bearer ${DAILY_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, privacy: 'private', properties: { exp, enable_chat: true } }),
    });
    if (!res.ok && res.status !== 409) {
        throw new Error(`Daily room create failed (${res.status})`);
    }
    const domain = DAILY_DOMAIN || (await res.json().catch(() => ({})))?.domain_name;
    return { name, url: `https://${domain}/${name}` };
}

async function dailyToken(name, userName, isOwner) {
    const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: { Authorization: `Bearer ${DAILY_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { room_name: name, user_name: userName, is_owner: !!isOwner, exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60 } }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return json.token || null;
}

/**
 * Build a join descriptor for an arbitrary room key.
 * @param {string} key stable room key, e.g. "booking:42" or "conv:3:9"
 * @param {{userName?:string, isOwner?:boolean, audioOnly?:boolean}} [opts]
 * @returns {Promise<{provider:string, roomUrl:string, roomName:string, token?:string|null, embeddable:boolean}>}
 */
async function getRoomForKey(key, { userName = 'Participant', isOwner = false, audioOnly = false } = {}) {
    if (PROVIDER === 'daily' && DAILY_KEY) {
        const room = await dailyRoom(key);
        const token = await dailyToken(room.name, userName, isOwner);
        const params = new URLSearchParams();
        if (token) params.set('t', token);
        const url = params.toString() ? `${room.url}?${params.toString()}` : room.url;
        return { provider: 'daily', roomUrl: url, roomName: room.name, token, embeddable: true };
    }
    // Jitsi public fallback — works now, no keys. #config.startAudioOnly toggles voice-only.
    const name = roomNameForKey(key);
    const display = encodeURIComponent(userName);
    const hash = `#userInfo.displayName=%22${display}%22${audioOnly ? '&config.startAudioOnly=true' : ''}`;
    return {
        provider: 'jitsi',
        roomUrl: `https://meet.jit.si/${name}${hash}`,
        roomName: name,
        token: null,
        embeddable: true,
    };
}

/** Unchanged shape/behaviour for existing scheduled-consultation callers. */
async function getRoomForBooking(bookingId, opts = {}) {
    return getRoomForKey(`booking:${bookingId}`, opts);
}

/** Ad-hoc video/voice call between two users (no booking required). */
async function getRoomForConversation(userIdA, userIdB, opts = {}) {
    return getRoomForKey(conversationKey(userIdA, userIdB), opts);
}

module.exports = { getRoomForBooking, getRoomForConversation, getRoomForKey, roomName, conversationKey };
