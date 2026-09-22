'use strict';
// Finds freely licensed photos on Wikimedia Commons for the admin to pick from.
// Only images whose licence permits display are ever offered (public domain, CC0,
// CC BY, CC BY-SA; never NC/ND), and an imported photo carries the credit and
// licence Commons itself records, so what the page prints is true.
const { AppError } = require('../utils/errors');
const { isAllowedLicense } = require('../utils/peopleValidation');
const { saveEntityPhoto } = require('./entityPhotos');

const UA = 'LawEliteNetworkBot/1.0 (https://lawelitenetwork.com; infra.baalvion@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';
const MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();

async function commons(params) {
    const res = await fetch(`${API}?${new URLSearchParams({ format: 'json', ...params })}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (!res || !res.ok) throw new AppError('UPSTREAM_ERROR', 'Wikimedia Commons is not answering right now. Try again in a moment.', 502);
    return res.json();
}

function toCandidate(page) {
    const info = page.imageinfo?.[0];
    if (!info || !MIMES.includes(info.mime)) return null;
    const m = info.extmetadata || {};
    const license = (m.LicenseShortName?.value || '').trim();
    if (!isAllowedLicense(license)) return null;
    return {
        title: page.title,
        thumb: info.thumburl || info.url,
        width: info.width, height: info.height,
        credit: `${stripHtml(m.Artist?.value) || 'Wikimedia Commons contributors'} / Wikimedia Commons`.slice(0, 480),
        license, license_url: m.LicenseUrl?.value || null, source_url: info.descriptionurl,
        description: stripHtml(m.ImageDescription?.value).slice(0, 200),
    };
}

async function wikidata(params) {
    const res = await fetch(`https://www.wikidata.org/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) }).catch(() => null);
    return res && res.ok ? res.json() : null;
}

/**
 * The main image Wikidata records for the one human with this exact name, when there is exactly one
 * such person. It is normally a portrait, so it is offered first, marked as recommended.
 */
async function portraitFor(query) {
    const found = await wikidata({ action: 'wbsearchentities', search: query, language: 'en', type: 'item', limit: '8' });
    const exact = (found?.search || []).filter((e) => String(e.label || '').toLowerCase() === query.toLowerCase());
    if (exact.length === 0) return null;
    const ents = await wikidata({ action: 'wbgetentities', ids: exact.map((e) => e.id).join('|'), props: 'claims', });
    const humans = Object.values(ents?.entities || {}).filter((e) => (e.claims?.P31 || []).some((c) => c.mainsnak?.datavalue?.value?.id === 'Q5'));
    if (humans.length !== 1) return null;
    const file = humans[0].claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!file) return null;
    const r = await commons({ action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '420' });
    const cand = toCandidate(Object.values(r.query?.pages || {})[0] || {});
    return cand ? { ...cand, recommended: true } : null;
}

/** Up to ~24 freely licensed candidates for a text query. */
async function search(query) {
    const q = String(query || '').trim();
    if (q.length < 2 || q.length > 120) throw new AppError('VALIDATION_ERROR', 'Type a name to search for', 400);
    const r = await commons({
        action: 'query', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '40',
        prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '420',
    });
    const rest = Object.values(r.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0)).map(toCandidate).filter(Boolean);
    const portrait = await portraitFor(q).catch(() => null);
    return [...(portrait ? [portrait] : []), ...rest.filter((c) => c.title !== portrait?.title)].slice(0, 24);
}

/** Downloads one Commons file at a sensible size and stores it with its recorded credit and licence. */
async function importFile(entityType, slug, title, altText) {
    if (!/^File:[^\n]{2,240}$/.test(String(title || ''))) throw new AppError('VALIDATION_ERROR', 'Pick a photo from the results', 400);
    const r = await commons({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '1200' });
    const cand = toCandidate(Object.values(r.query?.pages || {})[0] || {});
    if (!cand) throw new AppError('VALIDATION_ERROR', 'That file is not freely licensed for display, so it cannot be added', 400);
    const info = Object.values(r.query.pages)[0].imageinfo[0];
    const url = info.thumburl || info.url;
    // Only ever fetch from Wikimedia's own image hosts.
    if (!['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(new URL(url).hostname)) throw new AppError('VALIDATION_ERROR', 'Unexpected image host', 400);
    const img = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (!img || !img.ok) throw new AppError('UPSTREAM_ERROR', 'Could not download that photo', 502);
    const buffer = Buffer.from(await img.arrayBuffer());
    return saveEntityPhoto(entityType, slug, buffer, info.mime, {
        filename: title, credit: cand.credit, license: cand.license, license_url: cand.license_url, source_url: cand.source_url,
        alt_text: altText || cand.description || cand.title.replace(/^File:/, '').replace(/\.\w+$/, ''),
        width: info.thumbwidth || info.width, height: info.thumbheight || info.height,
    });
}

/**
 * The main Wikidata image of the person whose English Wikipedia page has this exact title. Going through the
 * page (not a name search) means a namesake can never be picked.
 */
async function portraitForWikipediaTitle(title) {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${new URLSearchParams({ format: 'json', action: 'query', titles: title, prop: 'pageprops', ppprop: 'wikibase_item', redirects: '1' })}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) }).catch(() => null);
    const qid = res && res.ok ? Object.values((await res.json()).query?.pages || {})[0]?.pageprops?.wikibase_item : null;
    if (!qid) return null;
    const ents = await wikidata({ action: 'wbgetentities', ids: qid, props: 'claims' });
    const file = ents?.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!file) return null;
    const r = await commons({ action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '420' });
    const cand = toCandidate(Object.values(r.query?.pages || {})[0] || {});
    return cand ? { ...cand, qid, recommended: true } : null;
}

module.exports = { search, importFile, portraitForWikipediaTitle };
