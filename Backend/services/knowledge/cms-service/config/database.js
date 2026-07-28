const dotenv = require('dotenv');
dotenv.config();
// Same TLS helper models/index.js already uses at runtime (buildPgSsl, respects
// DB_SSL_REJECT_UNAUTHORIZED). This file is sequelize-cli's separate config, which
// previously hardcoded rejectUnauthorized:true with no escape hatch -- confirmed live:
// `npm run migrate` failed with "self-signed certificate in certificate chain" against
// box2's RDS, even though the app itself connects fine via the shared helper.
const { buildPgSsl } = require('@baalvion/auth-node');

module.exports = {
    development: {
        username: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'baalvion_db',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        schema: 'cms',
        define: { underscored: true, timestamps: true },
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        schema: 'cms',
        logging: false,
        dialectOptions: {
            ssl: buildPgSsl(),
        },
        define: { underscored: true, timestamps: true },
    },
};
