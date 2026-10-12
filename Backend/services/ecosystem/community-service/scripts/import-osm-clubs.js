'use strict';
// Adds venues from seed/osm-clubs.json (OpenStreetMap, ODbL, fetched with scripts/build-osm-clubs.py) to the directory.
// Re-runnable: a venue already present (same city and name) is only enriched with the facts it lacks, never overwritten,
// and anything an admin edited stays as it is. Imported venues carry no description, photo or rating: only what OSM states.
require('dotenv').config();
const db = require('../models');
const { slugify } = require('../utils/slug');

const norm = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const CITY_ALIAS = { Gurugram: 'Gurgaon' };
const STATE_OF = { Gurugram: 'Delhi NCR', Noida: 'Delhi NCR' };
// Pass another seed file to import it (e.g. seed/osm-clubs-uae.json for the Emirates).
const rows = require(process.argv[2] ? require('path').resolve(process.argv[2]) : '../seed/osm-clubs.json');

async function uniqueSlug(base) {
    let slug = base;
    for (let i = 2; await db.NightClub.count({ where: { slug } }); i += 1) slug = `${base}-${i}`;
    return slug;
}

async function main() {
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS community');
    const existing = await db.NightClub.findAll({ attributes: ['id', 'name', 'city', 'osm_ref', 'website', 'phone', 'opening_hours', 'venue_type', 'latitude', 'longitude', 'address', 'suburb'] });
    const byKey = new Map(existing.map((e) => [`${norm(e.city)}|${norm(e.name)}`, e]));
    const refs = new Set(existing.map((e) => e.osm_ref).filter(Boolean));
    let created = 0; let enriched = 0; let skipped = 0;
    for (const r of rows) {
        const city = CITY_ALIAS[r.city] || r.city;
        const state = STATE_OF[r.city] || r.state;
        if (refs.has(r.osm)) { skipped += 1; continue; }
        const hit = byKey.get(`${norm(city)}|${norm(r.name)}`);
        const facts = { latitude: r.lat, longitude: r.lon, website: r.website, phone: r.phone, opening_hours: r.hours, venue_type: r.type, osm_ref: r.osm };
        if (hit) {
            const fill = {};
            for (const [k, v] of Object.entries(facts)) if (v && !hit[k]) fill[k] = v;
            if (!hit.address && r.address) fill.address = r.address;
            if (!hit.suburb && r.area) fill.suburb = r.area;
            if (Object.keys(fill).length) { await hit.update(fill); enriched += 1; } else skipped += 1;
            continue;
        }
        const slug = await uniqueSlug(slugify(`${r.name}-${city}`));
        const row = await db.NightClub.create({
            slug, name: r.name.slice(0, 160), state, city, suburb: r.area ? r.area.slice(0, 80) : null,
            address: r.address ? r.address.slice(0, 300) : null, music_types: [], required_roles: [], vip_packages: [],
            ...Object.fromEntries(Object.entries(facts).map(([k, v]) => [k, v ? (typeof v === 'string' ? v.slice(0, 300) : v) : null])),
        });
        byKey.set(`${norm(city)}|${norm(r.name)}`, row);
        created += 1;
    }
    console.log(JSON.stringify({ rows: rows.length, created, enriched, skipped }));
    await db.sequelize.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
