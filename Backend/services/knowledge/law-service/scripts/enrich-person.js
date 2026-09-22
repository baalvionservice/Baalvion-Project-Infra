'use strict';
// Builds a fact sheet for one person from Wikidata and, when a properly
// licensed photo exists, downloads it from Wikimedia Commons.
//
//   node scripts/enrich-person.js --slug ruth-bader-ginsburg --name "Ruth Bader Ginsburg" --category judges [--qid Q...]
//
// Nothing is guessed: the entity must be a human whose label matches the name
// (or be given with --qid), every field comes from a Wikidata claim, and a
// photo is kept only under a licence that permits display. Output goes to
// data/people-enriched/<slug>.json (+ <slug>.jpg) for scripts/import-people.js.
const fs = require('fs');
const path = require('path');
const { isAllowedLicense } = require('../utils/peopleValidation');

const UA = 'LawEliteNetworkBot/1.0 (https://lawelitenetwork.com; infra.baalvion@gmail.com)';
const OUT = path.join(__dirname, '..', 'data', 'people-enriched');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));

async function getJson(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
}

const wd = (params) => getJson(`https://www.wikidata.org/w/api.php?format=json&${new URLSearchParams(params)}`);

const claimValues = (claims, prop) => (claims[prop] || [])
    .filter((c) => c.rank !== 'deprecated' && c.mainsnak?.datavalue)
    .map((c) => ({ value: c.mainsnak.datavalue.value, qualifiers: c.qualifiers || {} }));

const entityId = (v) => v && v.id;
const timeToIso = (t) => {
    // "+1933-03-15T00:00:00Z" with precision 11 (day), 10 (month), 9 (year)
    const m = /^[+-](\d{4})-(\d\d)-(\d\d)/.exec(t.time || '');
    if (!m) return null;
    if (t.precision >= 11) return `${m[1]}-${m[2]}-${m[3]}`;
    if (t.precision === 10) return `${m[1]}-${m[2]}`;
    return m[1];
};

async function labels(ids) {
    const out = {};
    const unique = [...new Set(ids.filter(Boolean))];
    for (let i = 0; i < unique.length; i += 40) {
        const chunk = unique.slice(i, i + 40);
        const r = await wd({ action: 'wbgetentities', ids: chunk.join('|'), props: 'labels|claims', languages: 'en' });
        for (const id of chunk) {
            const e = r.entities[id];
            out[id] = { label: e?.labels?.en?.value, iso2: claimValues(e?.claims || {}, 'P297')[0]?.value };
        }
    }
    return out;
}

async function resolveQid(name) {
    if (args.qid) return args.qid;
    const r = await wd({ action: 'wbsearchentities', search: name, language: 'en', type: 'item', limit: '8' });
    const exact = r.search.filter((s) => (s.label || '').toLowerCase() === name.toLowerCase());
    if (exact.length === 0) throw new Error(`No Wikidata item labelled "${name}". Candidates: ${r.search.map((s) => `${s.id} ${s.label} (${s.description})`).join('; ')}`);
    // Keep only humans, and refuse to choose between several.
    const humans = [];
    for (const c of exact) {
        const e = (await wd({ action: 'wbgetentities', ids: c.id, props: 'claims' })).entities[c.id];
        if (claimValues(e.claims, 'P31').some((v) => v.value.id === 'Q5')) humans.push(c);
    }
    if (humans.length !== 1) throw new Error(`Ambiguous: ${humans.length} human matches for "${name}": ${humans.map((h) => `${h.id} (${h.description})`).join('; ')}. Re-run with --qid.`);
    return humans[0].id;
}

const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

async function fetchPhoto(fileName, slug) {
    const title = `File:${fileName}`;
    const r = await getJson(`https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
        action: 'query', format: 'json', titles: title, prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '1000',
    })}`);
    const page = Object.values(r.query.pages)[0];
    const info = page?.imageinfo?.[0];
    if (!info) return { skipped: 'no image info' };
    const m = info.extmetadata || {};
    const license = (m.LicenseShortName?.value || '').trim();
    const usable = ['image/jpeg', 'image/png', 'image/webp'].includes(info.mime);
    if (!usable) return { skipped: `unsupported type ${info.mime}` };
    if (!isAllowedLicense(license)) return { skipped: `licence not usable: "${license || 'unknown'}"` };
    const author = stripHtml(m.Artist?.value) || 'Unknown author';
    const res = await fetch(info.thumburl || info.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return { skipped: `download failed ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = info.mime === 'image/png' ? 'png' : info.mime === 'image/webp' ? 'webp' : 'jpg';
    const file = `${slug}.${ext}`;
    fs.writeFileSync(path.join(OUT, file), buf);
    return {
        file, mime: info.mime, width: info.thumbwidth || info.width, height: info.thumbheight || info.height,
        credit: `${author} / Wikimedia Commons`, license, license_url: m.LicenseUrl?.value || null, source_url: info.descriptionurl,
    };
}

async function main() {
    const { slug, name, category } = args;
    if (!slug || !name || !category) throw new Error('usage: --slug <slug> --name "<Full Name>" --category <category> [--qid Q...]');
    fs.mkdirSync(OUT, { recursive: true });

    const qid = await resolveQid(name);
    const entity = (await wd({ action: 'wbgetentities', ids: qid, props: 'labels|descriptions|claims', languages: 'en' })).entities[qid];
    const c = entity.claims;

    const idsToLabel = [];
    const grab = (prop) => claimValues(c, prop).map((v) => entityId(v.value)).filter(Boolean);
    const birthPlaceIds = grab('P19'); const deathPlaceIds = grab('P20'); const citizenshipIds = grab('P27');
    const occupationIds = grab('P106'); const educationIds = grab('P69'); const workIds = grab('P800').slice(0, 12);
    const awardVals = claimValues(c, 'P166').slice(0, 20);
    const positionVals = claimValues(c, 'P39').slice(0, 20);
    idsToLabel.push(...birthPlaceIds, ...deathPlaceIds, ...citizenshipIds, ...occupationIds, ...educationIds, ...workIds, ...awardVals.map((a) => entityId(a.value)), ...positionVals.map((a) => entityId(a.value)));
    const L = await labels(idsToLabel);
    const lab = (id) => L[id]?.label;

    const birth = claimValues(c, 'P569')[0]; const death = claimValues(c, 'P570')[0];
    const site = (prop, base) => { const v = claimValues(c, prop)[0]?.value; return v ? base + v : undefined; };
    const social = {
        x: site('P2002', 'https://x.com/'), instagram: site('P2003', 'https://www.instagram.com/'), facebook: site('P2013', 'https://www.facebook.com/'),
    };
    Object.keys(social).forEach((k) => !social[k] && delete social[k]);

    const awards = awardVals.map((a) => {
        const when = a.qualifiers.P585?.[0]?.datavalue?.value;
        return { title: lab(entityId(a.value)), year: when ? Number(String(timeToIso(when)).slice(0, 4)) : undefined };
    }).filter((a) => a.title);

    const yearOf = (q, prop) => { const v = q[prop]?.[0]?.datavalue?.value; return v ? Number(String(timeToIso(v)).slice(0, 4)) : undefined; };
    const positions = positionVals
        .map((p) => ({ title: lab(entityId(p.value)), start: yearOf(p.qualifiers, 'P580'), end: yearOf(p.qualifiers, 'P582') }))
        .filter((p) => p.title)
        .sort((a, b) => (a.start || 0) - (b.start || 0));

    const photoFile = claimValues(c, 'P18')[0]?.value;
    const photo = photoFile ? await fetchPhoto(photoFile, slug) : { skipped: 'no image on Wikidata' };

    const sheet = {
        slug, category, wikidata_id: qid,
        full_name: (entity.labels.en || entity.labels.mul || { value: name }).value,
        description: entity.descriptions?.en?.value || null,
        birth_date: birth ? timeToIso(birth.value) : null,
        birth_place: birthPlaceIds[0] ? lab(birthPlaceIds[0]) : null,
        death_date: death ? timeToIso(death.value) : null,
        death_place: deathPlaceIds[0] ? lab(deathPlaceIds[0]) : null,
        status: death ? 'deceased' : 'active',
        country_code: citizenshipIds.map((id) => L[id]?.iso2).find(Boolean) || null,
        citizenship: citizenshipIds.map(lab).filter(Boolean),
        occupations: occupationIds.map(lab).filter(Boolean),
        education: educationIds.map(lab).filter(Boolean).map((institution) => ({ institution })),
        positions,
        awards,
        notable_works: workIds.map(lab).filter(Boolean).map((title) => ({ title })),
        social,
        official_website: claimValues(c, 'P856')[0]?.value || null,
        sources: [{ label: 'Wikidata', url: `https://www.wikidata.org/wiki/${qid}` }],
        photo,
        fetched_at: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(sheet, null, 2) + '\n');
    console.log(JSON.stringify(sheet, null, 2));
}

main().catch((e) => { console.error('enrich failed:', e.stack); process.exit(1); });
