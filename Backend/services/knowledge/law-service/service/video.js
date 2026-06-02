'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Video consultations. Env-gated provider:
//   • VIDEO_PROVIDER=daily + DAILY_API_KEY  → Daily.co room + short-lived meeting
//     token (private rooms, recording, knocking, etc.).
//   • otherwise                             → a Jitsi Meet public room. This needs
//     NO API key and works in-browser TODAY, so video is functional out of the box
//     and Daily is a drop-in production upgrade.
//
// Rooms are deterministic per booking so both parties land in the same place.
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

// Stable, unguessable room name for a booking (so a leaked id isn't a room name).
function roomName(bookingId) {
    const salt = getSecret('JWT_PUBLIC_KEY') || 'law-elite';
    const h = crypto.createHash('sha256').update(`${salt}:booking:${bookingId}`).digest('hex').slice(0, 16);
    return `lawelite-${bookingId}-${h}`;
}

async function dailyRoom(bookingId) {
    const name = roomName(bookingId);
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
 * Build a join descriptor for a booking's video room.
 * @returns {Promise<{provider:string, roomUrl:string, roomName:string, token?:string|null, embeddable:boolean}>}
 */
async function getRoomForBooking(bookingId, { userName = 'Participant', isOwner = false } = {}) {
    if (PROVIDER === 'daily' && DAILY_KEY) {
        const room = await dailyRoom(bookingId);
        const token = await dailyToken(room.name, userName, isOwner);
        const url = token ? `${room.url}?t=${token}` : room.url;
        return { provider: 'daily', roomUrl: url, roomName: room.name, token, embeddable: true };
    }
    // Jitsi public fallback — works now, no keys.
    const name = roomName(bookingId);
    const display = encodeURIComponent(userName);
    return {
        provider: 'jitsi',
        roomUrl: `https://meet.jit.si/${name}#userInfo.displayName=%22${display}%22`,
        roomName: name,
        token: null,
        embeddable: true,
    };
}

module.exports = { getRoomForBooking, roomName };
