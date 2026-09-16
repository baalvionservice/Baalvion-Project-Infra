'use strict';
/**
 * Migration runner.
 *   node migrate.js          apply pending migrations, one transaction per file
 *   node migrate.js status   show applied vs pending
 *
 * Each .sql file runs as a single multi-statement batch rather than being split on
 * semicolons, so dollar-quoted PL/pgSQL bodies survive intact. Applied files are
 * recorded in <schema>.schema_migrations.
 */
const fs = require('node:fs');
const path = require('node:path');
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

    if (!pending.length) {
        console.log('[canwemarry] no pending migrations');
        return;
    }

    for (const file of pending) {
        const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
        await db.sequelize.transaction(async (tx) => {
            await db.sequelize.query(sql, { transaction: tx });
            await db.sequelize.query(
                `INSERT INTO ${SCHEMA}.schema_migrations (id) VALUES (:id)`,
                { replacements: { id: file }, transaction: tx },
            );
        });
        console.log(`[canwemarry] applied ${file}`);
    }
}

async function status() {
    await ensureTable();
    const done = await appliedSet();
    for (const f of upFiles()) console.log(`${done.has(f) ? 'applied ' : 'pending '} ${f}`);
}

const cmd = process.argv[2] || 'up';
(cmd === 'status' ? status() : run())
    .then(() => db.sequelize.close())
    .then(() => process.exit(0))
    .catch(async (err) => {
        console.error('[canwemarry] migration failed:', err.message);
        await db.sequelize.close().catch(() => {});
        process.exit(1);
    });
