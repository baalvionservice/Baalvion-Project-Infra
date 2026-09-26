'use strict';
// Bulk-fills entity photos from Wikimedia Commons, keeping only images whose
// licence permits display (public domain, CC0, CC BY, CC BY-SA), each stored
// in LEN's own database with its credit and licence. Nothing is guessed:
//   * a person needs exactly ONE Wikidata human with that exact label and
//     enough sitelinks to be the notable one (otherwise: skipped as ambiguous);
//   * a film/album/show must match on title AND release year.
//
//   node scripts/harvest-photos.js --type person --file data/harvest/people.json [--limit 50] [--concurrency 3] [--dry-run]
//
// Input rows: { type, slug, name, year?, category? } (produced by the frontend's
// scripts/export-harvest-list.ts). Resumable: entities that already have a
// photo are skipped. Outcomes are appended to data/harvest/harvest-log.jsonl.
const fs = require('fs');
const path = require('path');
const db = require('../models');
const { saveEntityPhoto } = require('../service/entityPhotos');
const { isAllowedLicense } = require('../utils/peopleValidation');

const UA = 'LawEliteNetworkBot/1.0 (https://lawelitenetwork.com; infra.baalvion@gmail.com)';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);

const TYPE = arg('type');
const FILE = arg('file');
const LIMIT = Number(arg('limit', 0)) || Infinity;
const CONCURRENCY = Math.min(4, Number(arg('concurrency', 2)) || 2);
const DRY = flag('dry-run');
const MIN_SITELINKS = 5;
const EXCLUDE = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'harvest', 'exclude.json'), 'utf8')).exclude || []);
const LOG = path.join(__dirname, '..', 'data', 'harvest', 'harvest-log.jsonl');

// Wikidata "instance of" classes accepted per kind of work.
const KIND = {
    movie: new Set(['Q11424', 'Q202866', 'Q24862', 'Q506240', 'Q226730']),          // film, animated film, short film, television film, silent film
    'tv-show': new Set(['Q5398426', 'Q21191270', 'Q15416', 'Q117467246']),           // television series, episode?, TV programme, animated series
    'streaming-show': new Set(['Q5398426', 'Q15416', 'Q117467246', 'Q1259759']),
    album: new Set(['Q482994', 'Q208569', 'Q209939', 'Q59298']),                     // album, studio album, live album, compilation
    'music-release': new Set(['Q482994', 'Q208569', 'Q134556', 'Q169930', 'Q1607992']), // album, single, EP
    song: new Set(['Q134556', 'Q7366', 'Q105543609']),                               // single, song
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 4) {
    for (let i = 0; i < tries; i++) {
        const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) }).catch(() => null);
        if (res && res.ok) return res.json();
        if (res && res.status !== 429 && res.status < 500) return null;
        await sleep(1000 * 2 ** i);
    }
    return null;
}

const wd = (params) => getJson(`https://www.wikidata.org/w/api.php?format=json&${new URLSearchParams(params)}`);
const claim = (e, p) => (e.claims?.[p] || []).filter((c) => c.rank !== 'deprecated' && c.mainsnak?.datavalue).map((c) => c.mainsnak.datavalue.value);
const year = (t) => Number((/^[+-](\d{4})/.exec(t?.time || '') || [])[1]) || null;
const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#\d+;/g, '').replace(/\s+/g, ' ').trim();
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** The single Wikidata entity this row means, or a reason it cannot be decided. */
async function resolve(row) {
    const search = await wd({ action: 'wbsearchentities', search: row.name, language: 'en', type: 'item', limit: '10' });
    const exact = (search?.search || []).filter((s) => norm(s.label) === norm(row.name));
    if (exact.length === 0) return { skip: 'no exact match' };
    const ents = (await wd({ action: 'wbgetentities', ids: exact.map((s) => s.id).join('|'), props: 'claims|sitelinks|descriptions', languages: 'en' }))?.entities || {};
    const items = exact.map((s) => ents[s.id]).filter(Boolean);

    if (row.type === 'person') {
        const humans = items.filter((e) => claim(e, 'P31').some((v) => v.id === 'Q5'));
        const notable = humans.filter((e) => Object.keys(e.sitelinks || {}).length >= MIN_SITELINKS);
        if (notable.length === 1) return { entity: notable[0] };
        return { skip: humans.length === 0 ? 'no human match' : notable.length === 0 ? 'not notable enough' : 'ambiguous' };
    }
    // Works: the item must be the right KIND of thing and its year must agree, so
    // "Jaws" the film is not "Jaws" the novel or a namesake. Awards and events are not attempted.
    if (!KIND[row.category]) return { skip: 'type not harvested' };
    if (!row.year) return { skip: 'no year to verify against' };
    const yearOf = (e) => [...claim(e, 'P577'), ...claim(e, 'P580'), ...claim(e, 'P571')].map(year);
    const matched = items.filter((e) => claim(e, 'P31').some((v) => KIND[row.category].has(v.id)) && yearOf(e).includes(row.year));
    if (matched.length === 1) return { entity: matched[0] };
    return { skip: matched.length === 0 ? 'no title+year match' : 'ambiguous' };
}

async function pickImage(entity, type) {
    const props = type === 'person' ? ['P18'] : ['P18', 'P3383'];
    for (const p of props) {
        for (const file of claim(entity, p)) {
            const r = await getJson(`https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
                action: 'query', format: 'json', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '1000',
            })}`);
            const info = r && Object.values(r.query?.pages || {})[0]?.imageinfo?.[0];
            if (!info) continue;
            const m = info.extmetadata || {};
            const license = (m.LicenseShortName?.value || '').trim();
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(info.mime)) continue;
            if (!isAllowedLicense(license)) continue;
            return {
                url: info.thumburl || info.url, mime: info.mime, width: info.thumbwidth || info.width, height: info.thumbheight || info.height,
                credit: `${stripHtml(m.Artist?.value) || 'Wikimedia Commons contributors'} / Wikimedia Commons`.slice(0, 480),
                license, license_url: m.LicenseUrl?.value || null, source_url: info.descriptionurl,
            };
        }
    }
    return null;
}

async function processRow(row) {
    if (EXCLUDE.has(`${row.type}:${row.slug}`)) return { outcome: 'skipped', reason: 'excluded (namesake)' };
    const have = await db.EntityPhoto.count({ where: { entity_type: row.type, entity_slug: row.slug } });
    if (have > 0) return { outcome: 'already-has-photo' };
    const r = await resolve(row);
    if (!r.entity) return { outcome: 'skipped', reason: r.skip };
    const img = await pickImage(r.entity, row.type);
    if (!img) return { outcome: 'skipped', reason: 'no freely licensed image' };
    if (DRY) return { outcome: 'would-save', license: img.license, qid: r.entity.id };
    const res = await fetch(img.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (!res || !res.ok) return { outcome: 'skipped', reason: 'download failed' };
    const buf = Buffer.from(await res.arrayBuffer());
    await saveEntityPhoto(row.type, row.slug, buf, img.mime, { ...img, filename: `${row.slug}.jpg`, alt_text: `Photo of ${row.name}` });
    return { outcome: 'saved', license: img.license, qid: r.entity.id };
}

(async () => {
    if (!FILE || !TYPE) { console.error('usage: --type person|entertainment --file <json> [--limit N] [--concurrency N] [--dry-run]'); process.exit(1); }
    const rows = JSON.parse(fs.readFileSync(path.resolve(FILE), 'utf8')).filter((r) => r.type === TYPE).slice(0, LIMIT);
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    const counts = {};
    let next = 0; let done = 0;
    const worker = async () => {
        while (next < rows.length) {
            const row = rows[next++];
            let result;
            try { result = await processRow(row); } catch (e) { result = { outcome: 'error', reason: e.message }; }
            const key = result.outcome === 'skipped' ? `skipped: ${result.reason}` : result.outcome;
            counts[key] = (counts[key] || 0) + 1;
            fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), type: row.type, slug: row.slug, ...result }) + '\n');
            if (++done % 25 === 0) console.log(`${done}/${rows.length}`, JSON.stringify(counts));
            await sleep(250);
        }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log('DONE', JSON.stringify(counts, null, 1));
    await db.sequelize.close();
})().catch((e) => { console.error('harvest failed:', e.message); process.exit(1); });
