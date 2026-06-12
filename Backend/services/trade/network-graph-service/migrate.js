'use strict';
/**
 * Neo4j schema migration runner. Applies *.cypher files in migrations/ in order,
 * recording applied ids on a (:_Migration) node. Idempotent (constraints use IF NOT EXISTS).
 *   node migrate.js
 */
const fs = require('fs');
const path = require('path');
const { read, write, close } = require('./config/neo4j');

const DIR = path.join(__dirname, 'migrations');
const splitStatements = (s) => s.split(/;\s*(?:\r?\n|$)/).map((x) => x.trim()).filter((x) => x && !x.startsWith('//'));

async function appliedSet() {
    const rows = await read('MATCH (m:_Migration) RETURN m.id AS id');
    return new Set(rows.map((r) => r.id));
}
const upFiles = () => (fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.cypher')).sort() : []);

async function run() {
    const done = await appliedSet();
    const pending = upFiles().filter((f) => !done.has(f));
    const applied = [];
    for (const f of pending) {
        const stmts = splitStatements(fs.readFileSync(path.join(DIR, f), 'utf8'));
        for (const stmt of stmts) await write(stmt);
        await write('MERGE (m:_Migration {id: $id}) ON CREATE SET m.applied_at = datetime()', { id: f });
        applied.push(f);
        console.log('[migrate] applied', f);
    }
    return { applied };
}

if (require.main === module) {
    (async () => {
        try { const r = await run(); console.log(`[migrate] done — ${r.applied.length || 'no'} migration(s)`); }
        catch (e) { console.error('[migrate] error:', e.message); process.exitCode = 1; }
        finally { await close(); }
    })();
}
module.exports = { run };
