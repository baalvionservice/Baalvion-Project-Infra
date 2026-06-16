'use strict';
/**
 * Idempotent platform super-admin bootstrap.
 *
 * Creates (or repairs) a dedicated super_admin account for the admin-platform
 * console. The token's role is derived from the user's PRIMARY org membership
 * (auth-service login → getPrimaryMembership), so we give this account exactly
 * ONE membership with role='super_admin' to guarantee a clean super-admin token.
 *
 *   Email:    superadmin@baalvion.com   (override: SUPERADMIN_EMAIL)
 *   Password: REQUIRED via SUPERADMIN_PASSWORD env var (no default is shipped)
 *
 * Usage:  node scripts/bootstrapSuperAdmin.js
 */
const { Client } = require('pg');
const password   = require('../utils/password');

const EMAIL = process.env.SUPERADMIN_EMAIL    || 'superadmin@baalvion.com';
// No default password is shipped — it must be provided explicitly (fail-closed).
const PW    = process.env.SUPERADMIN_PASSWORD;
if (!PW) {
    console.error('Refusing to bootstrap: set the SUPERADMIN_PASSWORD env var (no default password is shipped).');
    process.exit(1);
}
const NAME  = 'Platform Super Admin';
const ORG_NAME = 'Baalvion Platform';
const ORG_SLUG = 'baalvion-platform';

async function main() {
    const client = new Client({
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || 'baalvion_dev_pass',
    });
    await client.connect();
    try {
        await client.query('BEGIN');

        const hash = await password.hash(PW);

        // 1 — user (idempotent on unique email)
        const u = await client.query(
            `INSERT INTO auth.users (email, password_hash, full_name, status, email_verified_at, mfa_enabled, created_at, updated_at)
             VALUES ($1, $2, $3, 'active', NOW(), false, NOW(), NOW())
             ON CONFLICT (email) DO UPDATE
                SET password_hash = EXCLUDED.password_hash,
                    status = 'active',
                    email_verified_at = COALESCE(auth.users.email_verified_at, NOW()),
                    updated_at = NOW()
             RETURNING id`,
            [EMAIL, hash, NAME]
        );
        const userId = u.rows[0].id;

        // 2 — org (idempotent on unique slug)
        const o = await client.query(
            `INSERT INTO auth.organizations (id, name, slug, plan, owner_id, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, 'enterprise', $3, NOW(), NOW())
             ON CONFLICT (slug) DO UPDATE
                SET owner_id = EXCLUDED.owner_id, updated_at = NOW()
             RETURNING id`,
            [ORG_NAME, ORG_SLUG, userId]
        );
        const orgId = o.rows[0].id;

        // 3 — membership with role=super_admin (idempotent on org_id+user_id)
        await client.query(
            `INSERT INTO auth.team_members (org_id, user_id, role, service_roles, status, joined_at, created_at, updated_at)
             VALUES ($1, $2, 'super_admin', '{}'::jsonb, 'active', NOW(), NOW(), NOW())
             ON CONFLICT (org_id, user_id) DO UPDATE
                SET role = 'super_admin', status = 'active', updated_at = NOW()`,
            [orgId, userId]
        );

        await client.query('COMMIT');
        console.log(JSON.stringify({
            ok: true, userId: String(userId), orgId, email: EMAIL, role: 'super_admin',
            note: 'Login with the email/password above. Token will carry roles:["super_admin"].',
        }, null, 2));
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        await client.end();
    }
}

main().catch((e) => { console.error('bootstrap failed:', e.message); process.exit(1); });
