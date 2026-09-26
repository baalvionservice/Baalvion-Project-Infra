'use strict';
// Loads enriched profiles into legal.people, layering the reviewed
// <slug>.editorial.json over the raw <slug>.json fact sheet.
//
//   node scripts/import-people.js data/people-enriched/ruth-bader-ginsburg.json [--force]
//
// Re-running never clobbers admin edits: an existing profile is only filled in
// where a field is still empty, unless --force is given.
const fs = require('fs');
const path = require('path');
const db = require('../models');
const { validatePerson } = require('../utils/peopleValidation');
const { savePersonPhoto } = require('../service/peoplePhotos');
const { overlap, passes, LIMITS } = require('../utils/originality');

const force = process.argv.includes('--force');
const skipOriginality = process.argv.includes('--skip-originality');
const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const FIELDS = ['full_name', 'display_name', 'category', 'country_code', 'status', 'birth_date', 'birth_place', 'death_date', 'short_bio', 'biography',
    'career', 'education', 'awards', 'notable_works', 'timeline', 'social', 'official_website', 'sources', 'wikidata_id', 'source_note', 'published', 'indexable'];

const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

// Refuses to import prose that copies a cited Wikipedia article. Facts are free to reuse; sentences are not.
async function assertOriginal(person, sources) {
    const text = [person.short_bio, person.biography].filter(Boolean).join('\n');
    if (!text) return;
    for (const src of (sources || []).filter((x) => /wikipedia\.org\/wiki\//.test(x.url))) {
        const title = decodeURIComponent(src.url.split('/wiki/')[1]);
        const res = await fetch(`https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', prop: 'extracts', explaintext: '1', titles: title, format: 'json' })}`,
            { headers: { 'User-Agent': 'LawEliteNetworkBot/1.0 (infra.baalvion@gmail.com)' } });
        if (!res.ok) throw new Error(`could not fetch ${src.url} to check originality (${res.status})`);
        const page = Object.values((await res.json()).query.pages)[0];
        const r = overlap(text, page.extract || '');
        console.log(`originality vs ${src.label}: ${r.sixGramPct}% of 6-word runs copied, longest shared run ${r.longestRun} words`);
        if (!passes(r)) {
            throw new Error(`biography copies "${src.label}" (${r.sixGramPct}% > ${LIMITS.sixGramPct}% or a ${r.longestRun}-word run > ${LIMITS.longestRun}: "${r.longestText}"). Rewrite it in your own words.`);
        }
    }
}

async function importOne(file) {
    const sheet = JSON.parse(fs.readFileSync(file, 'utf8'));
    const edPath = file.replace(/\.json$/, '.editorial.json');
    const editorial = fs.existsSync(edPath) ? JSON.parse(fs.readFileSync(edPath, 'utf8')) : {};
    const merged = { ...sheet, ...editorial };
    // Career shown on the page = dated positions from the fact sheet, unless the editors wrote their own.
    merged.career = editorial.career || (sheet.positions || []).map((p) => ({ title: p.title, startYear: p.start, endYear: p.end }));

    if (!skipOriginality) await assertOriginal(merged, merged.sources);

    const values = {};
    for (const f of FIELDS) if (merged[f] !== undefined && merged[f] !== null) values[f] = merged[f];
    values.slug = sheet.slug;
    values.verified = false;

    let person = await db.Person.findOne({ where: { slug: sheet.slug } });
    if (!person) {
        validatePerson(values, true);
        person = await db.Person.create(values);
        console.log(`created ${sheet.slug} (#${person.id})`);
    } else {
        const patch = {};
        for (const [k, v] of Object.entries(values)) if (k !== 'slug' && (force || isEmpty(person[k]))) patch[k] = v;
        validatePerson(patch, false);
        await person.update(patch);
        console.log(`updated ${sheet.slug}: ${Object.keys(patch).join(', ') || 'nothing to fill'}`);
    }

    for (const l of merged.links || []) {
        await db.PersonLink.findOrCreate({ where: { person_id: person.id, kind: l.kind, target_slug: l.target_slug }, defaults: { relationship: l.relationship || null } });
    }

    const ph = sheet.photo;
    if (ph && ph.file && editorial.photo !== false) {
        const buf = fs.readFileSync(path.join(path.dirname(file), ph.file));
        const { photo, created } = await savePersonPhoto(person.id, buf, ph.mime, { ...ph, filename: ph.file, alt_text: `${person.full_name}` });
        console.log(`photo ${created ? 'stored' : 'already stored'} (#${photo.id}, ${ph.license})`);
    } else {
        console.log(`no photo: ${ph?.skipped || 'none supplied'}`);
    }
}

(async () => {
    try {
        for (const f of files) await importOne(f);
    } catch (e) {
        console.error('import failed:', e.message);
        process.exitCode = 1;
    } finally {
        await db.sequelize.close();
    }
})();
