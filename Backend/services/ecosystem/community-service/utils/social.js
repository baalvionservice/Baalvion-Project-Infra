'use strict';
// Social links a member may show on their public page. Each is stored as a full https address built from a handle or a pasted link,
// so nothing else (scripts, other schemes, look-alike hosts) can end up in a link.
const PLATFORMS = {
    instagram: { host: /^(www\.)?instagram\.com$/i, base: 'https://instagram.com/', handle: /^@?([A-Za-z0-9._]{1,30})$/ },
    x: { host: /^(www\.)?(x|twitter)\.com$/i, base: 'https://x.com/', handle: /^@?([A-Za-z0-9_]{1,15})$/ },
    tiktok: { host: /^(www\.)?tiktok\.com$/i, base: 'https://tiktok.com/@', handle: /^@?([A-Za-z0-9._]{1,24})$/ },
    youtube: { host: /^(www\.)?youtube\.com$/i, base: 'https://youtube.com/@', handle: /^@?([A-Za-z0-9._-]{1,40})$/ },
    facebook: { host: /^(www\.)?(facebook|fb)\.com$/i, base: 'https://facebook.com/', handle: /^@?([A-Za-z0-9.]{1,50})$/ },
    linkedin: { host: /^(www\.)?linkedin\.com$/i, base: 'https://linkedin.com/in/', handle: /^@?([A-Za-z0-9-]{1,60})$/ },
    snapchat: { host: /^(www\.)?snapchat\.com$/i, base: 'https://snapchat.com/add/', handle: /^@?([A-Za-z0-9._-]{1,30})$/ },
    telegram: { host: /^(www\.)?(t\.me|telegram\.me)$/i, base: 'https://t.me/', handle: /^@?([A-Za-z0-9_]{3,32})$/ },
    spotify: { host: /^open\.spotify\.com$/i, base: null, handle: null },
    soundcloud: { host: /^(www\.)?soundcloud\.com$/i, base: 'https://soundcloud.com/', handle: /^@?([A-Za-z0-9_-]{1,40})$/ },
    website: { host: null, base: null, handle: null },
};
const KEYS = Object.keys(PLATFORMS);

// Returns the clean https address, or null when the value is empty, or throws a message when it is not acceptable.
function normalize(key, raw) {
    const p = PLATFORMS[key];
    const v = String(raw || '').trim();
    if (!p) throw new Error(`${key} is not a supported link`);
    if (!v) return null;
    if (p.handle && p.handle.test(v)) return p.base + v.match(p.handle)[1];
    let u;
    try { u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); } catch { throw new Error(`${key}: that is not a valid link`); }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error(`${key}: use a normal web address`);
    if (u.username || u.password) throw new Error(`${key}: remove the login from the link`);
    if (p.host && !p.host.test(u.hostname)) throw new Error(`${key}: that link is not on ${key}`);
    if (!p.host && (/^(localhost|127\.|10\.|192\.168\.)/.test(u.hostname) || !u.hostname.includes('.'))) throw new Error('website: use your public website address');
    u.protocol = 'https:';
    return u.toString().slice(0, 300);
}

function normalizeAll(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
        const n = normalize(k, v);
        if (n) out[k] = n;
    }
    return out;
}

module.exports = { KEYS, normalize, normalizeAll };
