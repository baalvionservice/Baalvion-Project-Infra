'use strict';
// One-off: fill geography for rows written before migration 009. Re-runnable.
const db = require('../models');
const { resolvePlace } = require('../data/gazetteer');

(async () => {
    let changed = 0;
    for (const [model, fields] of [[db.Investor, ['headquarters', 'location']], [db.Profile, ['location']]]) {
        const rows = await model.findAll();
        for (const r of rows) {
            const text = fields.map((f) => r.get(f)).find((v) => v && String(v).trim());
            const place = resolvePlace(text, r.get('region'));
            if (place.country_slug === r.get('country_slug') && place.city_slug === r.get('city_slug')) continue;
            for (const k of Object.keys(place)) r.set(k, place[k]);
            await r.save({ hooks: false });
            changed++;
        }
    }
    console.log(`[backfill-geo] updated ${changed} row(s)`);
    process.exit(0);
})();
