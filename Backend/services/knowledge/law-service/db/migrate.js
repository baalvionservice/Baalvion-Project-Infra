'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Production-safe migration runner (zero extra dependencies — uses the Sequelize
// connection the app already has). Replaces "sync({alter}) + manual ALTER TABLE",
// which drifts between environments and cannot express tsvector columns, GIN
// indexes, triggers, generated columns or data back-fills.
//
//   • Each migration is a .sql file in db/migrations/, lexically ordered
//     (NNNN_description.sql). Statements run inside ONE transaction per file.
//   • Applied files are recorded in legal.schema_migrations with a checksum, so
//     a file that changed after being applied is detected and refused (drift guard).
//   • Idempotent: re-running applies only pending files. Safe on an existing DB
//     because every migration uses IF NOT EXISTS / additive DDL.
//
// Usage:  node db/migrate.js            (apply all pending)
//         node db/migrate.js --status   (list applied/pending, apply nothing)
// Also invoked automatically on service boot (see index.js).
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

async function ensureTable(sequelize) {
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS legal');
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS legal.schema_migrations (
            filename    TEXT PRIMARY KEY,
            checksum    TEXT NOT NULL,
            applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
}

function listFiles() {
    if (!fs.existsSync(MIGRATIONS_DIR)) return [];
    return fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();
}

async function appliedMap(sequelize) {
    const [rows] = await sequelize.query('SELECT filename, checksum FROM legal.schema_migrations');
    const map = new Map();
    rows.forEach((r) => map.set(r.filename, r.checksum));
    return map;
}

/**
 * Apply all pending migrations. Returns the list of filenames applied.
 * @param {import('sequelize').Sequelize} sequelize
 * @param {(msg:string)=>void} [log]
 */
async function runMigrations(sequelize, log = () => {}) {
    await ensureTable(sequelize);
    const files = listFiles();
    const applied = await appliedMap(sequelize);
    const done = [];

    for (const file of files) {
        const full = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(full, 'utf8');
        const checksum = sha1(sql);

        if (applied.has(file)) {
            if (applied.get(file) !== checksum) {
                throw new Error(
                    `[migrate] checksum mismatch for already-applied migration "${file}". ` +
                    `Migrations are immutable once applied — create a new migration instead of editing this one.`,
                );
            }
            continue;
        }

        const t = await sequelize.transaction();
        try {
            // Run the whole file as one script (statements separated by ';' inside the SQL).
            await sequelize.query(sql, { transaction: t });
            await sequelize.query(
                'INSERT INTO legal.schema_migrations (filename, checksum) VALUES (:f, :c)',
                { replacements: { f: file, c: checksum }, transaction: t },
            );
            await t.commit();
            log(`[migrate] applied ${file}`);
            done.push(file);
        } catch (err) {
            await t.rollback();
            throw new Error(`[migrate] failed on ${file}: ${err.message}`);
        }
    }
    if (!done.length) log('[migrate] no pending migrations');
    return done;
}

async function status(sequelize) {
    await ensureTable(sequelize);
    const files = listFiles();
    const applied = await appliedMap(sequelize);
    return files.map((f) => ({ filename: f, applied: applied.has(f) }));
}

module.exports = { runMigrations, status };

// ── CLI entrypoint ───────────────────────────────────────────────────────────
if (require.main === module) {
    (async () => {
        const db = require('../models');
        try {
            await db.sequelize.authenticate();
            if (process.argv.includes('--status')) {
                const rows = await status(db.sequelize);
                rows.forEach((r) => console.log(`${r.applied ? '✓' : '·'}  ${r.filename}`));
            } else {
                const done = await runMigrations(db.sequelize, console.log);
                console.log(`[migrate] complete (${done.length} applied)`);
            }
            process.exit(0);
        } catch (err) {
            console.error(err.message);
            process.exit(1);
        }
    })();
}
