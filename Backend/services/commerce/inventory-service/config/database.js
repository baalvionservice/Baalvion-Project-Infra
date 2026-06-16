require('dotenv').config();
const fs = require('fs');

// Production DB TLS — SECURE BY DEFAULT (verify the server certificate). The old
// hardcoded `rejectUnauthorized: false` accepted ANY cert (MITM). Pin a CA via
// DB_SSL_CA / DB_SSL_CA_PATH; DB_SSL_REJECT_UNAUTHORIZED=false is a last-resort
// opt-out; DB_SSL=false disables TLS entirely (trusted private networks only).
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
    development: { username: process.env.DB_USER || 'baalvion', password: process.env.DB_PASSWORD || null, database: process.env.DB_NAME || 'baalvion_db', host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432), dialect: 'postgres', schema: 'inventory' },
    production: { username: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432), dialect: 'postgres', schema: 'inventory', dialectOptions: { ssl: prodSsl() } },
};
