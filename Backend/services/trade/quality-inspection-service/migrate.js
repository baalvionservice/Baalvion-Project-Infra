'use strict';
/**
 * Production-safe SQL migration runner (no sync/alter). Mirrors trade-service/migrate.js.
 *   node migrate.js          apply pending (each in its own transaction)
 *   node migrate.js status   show applied vs pending
 *   node migrate.js down     revert the most recent (needs *.down.sql)
 *
 * Migrations should run as the privileged owner role (MIGRATION_DB_USER), NOT
 * baalvion_app, so RLS-enabling DDL and table ownership work correctly.
 */
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./config/appConfig');

// F4: migrations run on a DEDICATED connection as the privileged OWNER role
// (MIGRATION_DB_USER), NOT the RLS-patched app connection in ./models. This makes
// table ownership + RLS-enabling DDL correct and keeps baalvion_app subject to RLS.
const db = {
    sequelize: new Sequelize(config.db.name, config.migration.user, config.migration.password, {
        host: config.db.host,
        port: config.db.port,
        dialect: 'postgres',
        logging: false,
    }),
};

const DIR = path.join(__dirname, 'migrations');
const SCHEMA = config.schema;

// Dollar-quote / quote / comment-aware splitter: only splits on a top-level `;`,
// never inside a $$...$$ (or $tag$...$tag$) block, a '...' string, or a comment.
// A naive split-on-semicolon corrupts DO $$ ... $$ migration blocks.
const splitStatements = (sql) => {
    const stmts = [];
    let buf = '';
    let dollar = null; let single = false; let line = false; let block = false;
    for (let i = 0; i < sql.length; i += 1) {
        const ch = sql[i]; const two = sql.slice(i, i + 2);
        if (line) { buf += ch; if (ch === '\n') line = false; continue; }
        if (block) { buf += ch; if (two === '*/') { buf += sql[i + 1]; i += 1; block = false; } continue; }
        if (!dollar && !single && two === '--') { line = true; buf += two; i += 1; continue; }
        if (!dollar && !single && two === '/*') { block = true; buf += two; i += 1; continue; }
        if (!dollar && ch === "'") { single = !single; buf += ch; continue; }
        if (!single && ch === '$') {
            const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
            if (m) { const tag = m[0]; if (!dollar) dollar = tag; else if (dollar === tag) dollar = null; buf += tag; i += tag.length - 1; continue; }
        }
        if (ch === ';' && !dollar && !single) { const t = buf.trim(); if (t) stmts.push(t); buf = ''; continue; }
        buf += ch;
    }
    const t = buf.trim(); if (t) stmts.push(t);
    return stmts.filter((s) => s.replace(/--.*$/gm, '').trim().length > 0);
};

async function ensureTable() {
    await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);
    await db.sequelize.query(`CREATE TABLE IF NOT EXISTS ${SCHEMA}.schema_migrations (
        id varchar(255) PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
}
async function appliedSet() {
    const [rows] = await db.sequelize.query(`SELECT id FROM ${SCHEMA}.schema_migrations ORDER BY id`);
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
            for (const stmt of splitStatements(sql)) await db.sequelize.query(stmt, { transaction: t });
            await db.sequelize.query(`INSERT INTO ${SCHEMA}.schema_migrations (id) VALUES (:id)`, { replacements: { id: f }, transaction: t });
            await t.commit();
            appliedNow.push(f);
            console.log('[migrate] applied', f);
        } catch (e) { await t.rollback(); console.error('[migrate] FAILED', f, '-', e.message); throw e; }
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
    const [rows] = await db.sequelize.query(`SELECT id FROM ${SCHEMA}.schema_migrations ORDER BY id DESC LIMIT 1`);
    if (!rows.length) { console.log('[migrate] nothing to revert'); return; }
    const id = rows[0].id;
    const downFile = path.join(DIR, id.replace(/\.sql$/, '.down.sql'));
    if (!fs.existsSync(downFile)) throw new Error(`no down migration for ${id}`);
    const t = await db.sequelize.transaction();
    try {
        for (const stmt of splitStatements(fs.readFileSync(downFile, 'utf8'))) await db.sequelize.query(stmt, { transaction: t });
        await db.sequelize.query(`DELETE FROM ${SCHEMA}.schema_migrations WHERE id = :id`, { replacements: { id }, transaction: t });
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
