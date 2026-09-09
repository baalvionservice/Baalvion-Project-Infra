'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, f = []) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : f);
const bool = (v, f = false) => (v === undefined ? f : /^(1|true|yes|on)$/i.test(String(v)));

const PORT = Number(process.env.PORT || 3070);

module.exports = {
    env: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production',
    port: PORT,
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3071']),
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema: process.env.DB_SCHEMA || 'canwemarry',
    },
    jwt: {
        // RS256 only. The service never signs — @baalvion/auth-node is the platform's single
        // token authority (contract rules C3/C6), so only the verification key is needed here.
        publicKey: require('@baalvion/auth-node').requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
        issuer: process.env.JWT_ISSUER || 'baalvion-auth',
        audience: process.env.JWT_AUDIENCE || 'baalvion-platform',
        jwksUri: process.env.BAALVION_JWKS_URI || process.env.JWKS_URI || null,
    },
    security: {
        // Global IP ceiling. Write and report paths get tighter limits of their own.
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 240),
        writeRateLimit: Number(process.env.RATE_LIMIT_WRITE_MAX || 30),
        reportRateLimit: Number(process.env.RATE_LIMIT_REPORT_MAX || 10),
        // Salts the IP/user-agent hashes written to audit_logs so the raw values never land in
        // the database. Rotating it makes historical hashes unlinkable, which is intended.
        auditHashSecret: process.env.AUDIT_HASH_SECRET || '',
        // Bootstrap operator: the one platform user id granted ADMIN on first sight, so a fresh
        // deployment has someone who can grant roles. Empty in production once roles are seeded.
        bootstrapAdminUserId: process.env.BOOTSTRAP_ADMIN_USER_ID || '',
        // Refuse gated actions when verification state is UNKNOWN. Off by default, and must
        // stay off until auth-service emits an `email_verified` claim — turning it on before
        // then refuses every action for every account. See domain/verification.js.
        requireEmailVerification: /^(1|true|yes|on)$/i.test(String(process.env.REQUIRE_EMAIL_VERIFICATION || '')),
    },
    limits: {
        pageSize: Number(process.env.DEFAULT_PAGE_SIZE || 20),
        maxPageSize: Number(process.env.MAX_PAGE_SIZE || 100),
        maxOpenCasesPerUser: Number(process.env.MAX_OPEN_CASES_PER_USER || 3),
    },
    features: {
        // Off by default: a case is discoverable by the wider internet only when an operator
        // has decided the moderation capacity exists to support it.
        allowPublicCases: bool(process.env.ALLOW_PUBLIC_CASES, false),
    },
};
