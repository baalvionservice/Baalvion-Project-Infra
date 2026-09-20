'use strict';
// Loads the site's bundled topics (data/topics-seed.json, produced by the
// frontend's scripts/export-topics-seed.ts) into legal.topics.
//
//   node scripts/seed-topics.js [--force]
//
// Existing rows are left alone unless --force, so admin edits are never overwritten.
const fs = require('fs');
const path = require('path');
const db = require('../models');
const { validateTopic } = require('../utils/topicValidation');

const force = process.argv.includes('--force');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'topics-seed.json'), 'utf8'));

(async () => {
    try {
        for (const t of seed) {
            const values = { slug: t.slug, name: t.name, pillar: t.pillar || 'general', aliases: t.aliases || [], description: '', published: true, indexable: true };
            validateTopic(values, true);
            const existing = await db.Topic.findOne({ where: { slug: values.slug } });
            if (!existing) { await db.Topic.create(values); console.log(`created ${values.slug}`); }
            else if (force) { await existing.update(values); console.log(`replaced ${values.slug}`); }
            else console.log(`kept ${values.slug} (already in the admin panel)`);
        }
    } catch (e) {
        console.error('seed failed:', e.message);
        process.exitCode = 1;
    } finally {
        await db.sequelize.close();
    }
})();
