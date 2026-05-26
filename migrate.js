'use strict';
/**
 * Lightweight, production-safe migration runner (no sync/alter for evolution).
 *   node migrate.js          -> apply all pending migrations (transactional)
 *   node migrate.js status   -> show applied vs pending (drift detection)
 *   node migrate.js down     -> revert the most recent migration (needs *.down.sql)
 *
 * Migrations are plain .sql files in migrations/, applied in filename order,
 * each in its own transaction, recorded in trade.schema_migrations.
 */
const fs = require('fs');
const path = require('path');
const db = require('./models');

const DIR = path.join(__dirname, 'migrations');

const splitStatements = (sql) => sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s && !s.replace(/--.*$/gm, '').trim().match(/^$/));

async function ensureTable() {
    await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS trade');
    await db.sequelize.query(`CREATE TABLE IF NOT EXISTS trade.schema_migrations (
        id varchar(255) PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
    )`);
}

async function appliedSet() {
    const [rows] = await db.sequelize.query('SELECT id FROM trade.schema_migrations ORDER BY id');
    return new Set(rows.map((r) => r.id));
}

const upFiles = () => (fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql')).sort() : []);

async function run() {
    await ensureTable();
    const done = await appliedSet();
    const pending = upFiles().filter((f) => !done.has(f));
    const appliedNow = [];
    for (const f of pending) {
        const sql = fs.readFileSync(path.join(DIR, f), 'utf8');
        const t = await db.sequelize.transaction();
        try {
            for (const stmt of splitStatements(sql)) {
                await db.sequelize.query(stmt, { transaction: t });
            }
            await db.sequelize.query('INSERT INTO trade.schema_migrations (id) VALUES (:id)', { replacements: { id: f }, transaction: t });
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

async function down() {
    await ensureTable();
    const [rows] = await db.sequelize.query('SELECT id FROM trade.schema_migrations ORDER BY id DESC LIMIT 1');
    if (!rows.length) { console.log('[migrate] nothing to revert'); return; }
    const id = rows[0].id;
    const downFile = path.join(DIR, id.replace(/\.sql$/, '.down.sql'));
    if (!fs.existsSync(downFile)) throw new Error(`no down migration for ${id}`);
    const sql = fs.readFileSync(downFile, 'utf8');
    const t = await db.sequelize.transaction();
    try {
        for (const stmt of splitStatements(sql)) await db.sequelize.query(stmt, { transaction: t });
        await db.sequelize.query('DELETE FROM trade.schema_migrations WHERE id = :id', { replacements: { id }, transaction: t });
        await t.commit();
        console.log('[migrate] reverted', id);
    } catch (e) { await t.rollback(); throw e; }
}

if (require.main === module) {
    const cmd = process.argv[2] || 'up';
    (async () => {
        try {
            if (cmd === 'status') console.table(await status());
            else if (cmd === 'down') await down();
            else { const r = await run(); console.log(`[migrate] done — applied ${r.applied.length || 'no'} migration(s)`); }
            process.exit(0);
        } catch (e) { console.error('[migrate] error:', e.message); process.exit(1); }
    })();
}

module.exports = { run, status, down };
