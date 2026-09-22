'use strict';

/**
 * Wikimedia Commons photo search, with a strict licence check.
 *
 * Pure over its inputs (`getJson` is injected) so it can be tested offline. Only images whose Commons licence
 * lets a commercial news site use them with credit are ever returned: CC0, public domain, CC BY and CC BY-SA.
 * NonCommercial, NoDerivatives, "fair use" and anything unlabelled are dropped, because a photo we may not use
 * is worse than no photo.
 */

const API = 'https://commons.wikimedia.org/w/api.php';
const META = ['LicenseShortName', 'LicenseUrl', 'Artist', 'Credit', 'ImageDescription', 'Restrictions', 'Copyrighted'].join('|');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const THUMB_WIDTH = 1200;

// Tags come out first (repeated until stable, then any stray bracket), and `&amp;` is decoded LAST: decoding it first
// would turn "&amp;quot;" into "&quot;" and then into a quotation mark, a double-unescape.
const stripHtml = (s) => {
    let out = String(s || '');
    let prev;
    do { prev = out; out = out.replace(/<[^>]*>/g, ' '); } while (out !== prev);
    return out.replace(/[<>]/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
};

/** True only for licences that allow commercial reuse: CC0, public domain, CC BY, CC BY-SA. */
function isAllowedLicense(name) {
    const n = String(name || '').trim().toLowerCase();
    if (!n) return false;
    if (/(^|[\s-])(nc|nd)([\s-]|$)|non-?commercial|no ?derivs|fair use|non-?free|all rights reserved|gfdl-?only/.test(n)) return false;
    return /^cc0\b|^public domain|^pd\b|^pd-|^cc[- ]by\b/.test(n);
}

/** A candidate the editor can look at, or null when the file is not a usable, licensed photo. */
function toCandidate(page) {
    const info = page && page.imageinfo && page.imageinfo[0];
    if (!info || !ALLOWED_MIME.has(info.mime) || !info.thumburl) return null;
    const m = info.extmetadata || {};
    const val = (k) => (m[k] && m[k].value) || '';
    const licenseName = stripHtml(val('LicenseShortName'));
    if (!isAllowedLicense(licenseName)) return null;
    const artist = stripHtml(val('Artist')) || null;
    return {
        title: page.title,
        pageUrl: info.descriptionurl,
        thumbUrl: info.thumburl,
        width: info.thumbwidth || info.width,
        height: info.thumbheight || info.height,
        mime: info.mime,
        license: { name: licenseName, url: val('LicenseUrl') || null },
        artist,
        description: stripHtml(val('ImageDescription')).slice(0, 240),
        // Commons flags images of identifiable people that carry extra rights (personality/publicity). Shown as a caution.
        personalityRights: /personality|publicity|privacy/i.test(stripHtml(val('Restrictions'))),
        credit: `${artist || 'Unknown author'} / Wikimedia Commons, ${licenseName}`,
    };
}

const baseQuery = `${API}?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=${THUMB_WIDTH}&iiextmetadatafilter=${META}`;

async function searchOnce(q, { getJson, limit }) {
    const j = await getJson(`${baseQuery}&generator=search&gsrnamespace=6&gsrlimit=${limit}&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}`);
    return Object.values((j.query && j.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0)).map(toCandidate).filter(Boolean);
}

/**
 * Exact-phrase matches first: an unquoted "Taylor Tomlinson" matches any file mentioning "Taylor" or "Tomlinson", and
 * past the first few results was returning unrelated photos. Looser matches are added only when the phrase finds few.
 */
async function searchCommons(query, { getJson, limit = 16 }) {
    const q = String(query || '').trim().replace(/"/g, '');
    if (q.length < 2) return [];
    const exact = /\s/.test(q) ? await searchOnce(`"${q}"`, { getJson, limit }) : [];
    if (exact.length >= 6) return exact;
    const seen = new Set(exact.map((c) => c.title));
    const loose = (await searchOnce(q, { getJson, limit })).filter((c) => !seen.has(c.title));
    return [...exact, ...loose].slice(0, limit);
}

/** One file by its Commons title ("File:Name.jpg"), re-read from Commons so nothing the client sent is trusted. */
async function commonsFile(title, { getJson }) {
    if (!/^File:.{3,240}$/.test(String(title || ''))) return null;
    const j = await getJson(`${baseQuery}&titles=${encodeURIComponent(title)}`);
    const page = Object.values((j.query && j.query.pages) || {})[0];
    return page && !page.missing ? toCandidate(page) : null;
}

module.exports = { searchCommons, commonsFile, isAllowedLicense, toCandidate, stripHtml, THUMB_WIDTH };
