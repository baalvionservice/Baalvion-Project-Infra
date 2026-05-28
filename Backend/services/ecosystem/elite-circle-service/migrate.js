'use strict';
/**
 * Migration runner for insiders-service.
 *   node migrate.js          -> apply pending migrations (each file = one tx)
 *   node migrate.js status   -> applied vs pending
 *
 * Unlike a naive ;-splitter, each .sql file is executed as a single
 * multi-statement batch inside one transaction, so dollar-quoted PL/pgSQL
 * function bodies ($$ ... $$) are preserved intact. Applied files are recorded
 * in <schema>.schema_migrations.
 */
const fs = require('fs');
const path = require('path');
const db = require('./models');
const config = require('./config/appConfig');

const DIR = path.join(__dirname, 'migrations');
const SCHEMA = config.db.schema;

async function ensureTable() {
    await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);
    await db.sequelize.query(`CREATE TABLE IF NOT EXISTS ${SCHEMA}.schema_migrations (
        id varchar(255) PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
    )`);
}

async function appliedSet() {
    const [rows] = await db.sequelize.query(`SELECT id FROM ${SCHEMA}.schema_migrations ORDER BY id`);
    return new Set(rows.map((r) => r.id));
}

const upFiles = () => (fs.existsSync(DIR)
    ? fs.readdirSync(DIR).filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql')).sort()
    : []);

async function run() {
    await ensureTable();
    const done = await appliedSet();
    const pending = upFiles().filter((f) => !done.has(f));
    const appliedNow = [];
    for (const f of pending) {
        const sql = fs.readFileSync(path.join(DIR, f), 'utf8');
        const t = await db.sequelize.transaction();
        try {
            await db.sequelize.query(sql, { transaction: t });
            await db.sequelize.query(
                `INSERT INTO ${SCHEMA}.schema_migrations (id) VALUES (:id)`,
                { replacements: { id: f }, transaction: t },
            );
            await t.commit();
            appliedNow.push(f);
            console.log('[migrate] applied', f);
        } catch (e) {
            await t.rollback();
            console.error('[migrate] FAILED', f, '-', e.message);
            throw e;
        }
    }
    return { applied: appliedNow };
}

async function status() {
    await ensureTable();
    const done = await appliedSet();
    return upFiles().map((f) => ({ migration: f, applied: done.has(f) }));
}

if (require.main === module) {
    const cmd = process.argv[2] || 'up';
    (async () => {
        try {
            if (cmd === 'status') console.table(await status());
            else { const r = await run(); console.log(`[migrate] done — applied ${r.applied.length || 'no'} migration(s)`); }
            process.exit(0);
        } catch (e) { console.error('[migrate] error:', e.message); process.exit(1); }
    })();
}

module.exports = { run, status };
