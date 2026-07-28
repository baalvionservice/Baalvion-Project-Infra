'use strict';
// Applies migrations/*.sql in order against the configured database.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const config = require('../config/appConfig');

// Same DB_SSL_REJECT_UNAUTHORIZED convention used by every other service's sequelize
// config/database.js (e.g. fulfillment-service). Without an explicit ssl object here,
// pg's Client falls back to whatever PGSSLMODE happens to be set in the environment
// (defaulting to strict certificate verification), which fails against box2's RDS
// self-signed cert with "self-signed certificate in certificate chain" -- confirmed
// live the first time this script was wired into the deploy pipeline.
function ssl() {
    if (process.env.DB_SSL === 'false') return false;
    return { require: true, rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
}

(async () => {
    const dir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    const client = new Client({
        host: config.db.host, port: config.db.port, database: config.db.name,
        user: config.db.user, password: config.db.password, ssl: ssl(),
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
