'use strict';
// Applies migrations/*.sql in order against the configured database.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const config = require('../config/appConfig');

(async () => {
    const dir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    const client = new Client({
        host: config.db.host, port: config.db.port, database: config.db.name,
        user: config.db.user, password: config.db.password,
    });
    await client.connect();
    for (const f of files) {
        process.stdout.write(`applying ${f} … `);
        await client.query(fs.readFileSync(path.join(dir, f), 'utf8'));
        console.log('ok');
    }
    await client.end();
    console.log('migrations complete');
})().catch((e) => { console.error('migration failed:', e.message); process.exit(1); });
