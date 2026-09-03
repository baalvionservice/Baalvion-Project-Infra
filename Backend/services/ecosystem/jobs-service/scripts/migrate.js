'use strict';
/**
 * Idempotent SQL migrations for the jobs schema.
 *
 * The service otherwise relies on sequelize.sync({ alter: false }), which creates missing
 * TABLES but never missing COLUMNS — so anything added to an existing table has to land
 * here. Every statement is written IF NOT EXISTS / ADD COLUMN IF NOT EXISTS, so this is
 * safe to replay; index.js runs it on every boot, right after sync.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'migrations');

async function runMigrations(sequelize) {
    if (!fs.existsSync(DIR)) return [];
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
        const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
        await sequelize.query(sql);
    }
    return files;
}

module.exports = { runMigrations };

if (require.main === module) {
    const db = require('../models');
    runMigrations(db.sequelize)
        .then((files) => { console.log(`[migrate] applied ${files.length}: ${files.join(', ')}`); process.exit(0); })
        .catch((err) => { console.error('[migrate] failed:', err.message); process.exit(1); });
}
