require('dotenv').config();
const fs = require('fs');

// Production DB TLS — SECURE BY DEFAULT (verify the server certificate).
// The old hardcoded `rejectUnauthorized: false` silently accepted ANY certificate,
// leaving the DB connection open to MITM. Now:
//   - cert verification is ON unless explicitly opted out
//   - operators on a managed PG whose CA is not in the system trust store should
//     pin it via DB_SSL_CA (PEM string) or DB_SSL_CA_PATH (preferred)
//   - DB_SSL_REJECT_UNAUTHORIZED=false is the last-resort escape hatch (logged intent)
//   - DB_SSL=false disables TLS entirely (only for trusted private networks)
function prodSsl() {
    if (process.env.DB_SSL === 'false') return false;
    const ca = process.env.DB_SSL_CA
        || (process.env.DB_SSL_CA_PATH ? fs.readFileSync(process.env.DB_SSL_CA_PATH, 'utf8') : undefined);
    return {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        ...(ca ? { ca } : {}),
    };
}

module.exports = {
    development: {
        username: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || null,
        database: process.env.DB_NAME || 'baalvion_db',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        schema: 'orders',
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        schema: 'orders',
        dialectOptions: { ssl: prodSsl() },
    },
};
