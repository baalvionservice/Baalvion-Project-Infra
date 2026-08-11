'use strict';
/**
 * Creates (or rotates the secret for) a scoped service-account OAuth client for
 * unattended machine callers — e.g. a scheduled job that only needs to create CMS
 * content drafts, not a human's super_admin session.
 *
 * This script only touches auth-service's own schema (a service-account user +
 * an auth.oauth_clients row). It deliberately does NOT grant any CMS access —
 * that's a separate, explicit step: log in as an admin and call
 *   POST /cms/websites/:websiteId/members  { "userId": "<printed userId>", "role": "cms_contributor" }
 * scoped to exactly the one website the job needs. Until that step runs, this
 * client can authenticate but can't do anything in the CMS.
 *
 * The org this client belongs to must already exist (defaults to the
 * 'baalvion-platform' org created by bootstrapSuperAdmin.js) — this script does not
 * create organizations.
 *
 * Usage:
 *   node scripts/createOauthClient.js --name="law-elite-content-bot" [--org-slug=baalvion-platform] [--rotate]
 *
 * The client_secret is printed exactly once and is never stored in plaintext
 * anywhere (not in the DB, not in this script's output logs if you redirect them
 * — treat the printed value like any other credential). Put it directly into
 * whatever secret store the scheduled job reads from; it is not recoverable
 * afterward — re-run with --rotate to issue a new one if it's lost.
 */
const { Client } = require('pg');
const crypto = require('crypto');
const password = require('../utils/password');

const ARGS = process.argv.slice(2);
const OPT = (n, def) => { const h = ARGS.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : def; };
const NAME = OPT('name', 'service-content-bot');
const ORG_SLUG = OPT('org-slug', 'baalvion-platform');
const ROTATE = ARGS.includes('--rotate');
const CLIENT_ID = OPT('client-id', `${NAME}-${crypto.randomBytes(4).toString('hex')}`);
const EMAIL = `svc-${NAME}@baalvion.internal`;

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || 'baalvion_dev_pass',
    });
    await client.connect();
    try {
        await client.query('BEGIN');

        const org = await client.query('SELECT id FROM auth.organizations WHERE slug = $1', [ORG_SLUG]);
        if (!org.rows.length) {
            throw new Error(`No organization with slug "${ORG_SLUG}" — create it first (e.g. run bootstrapSuperAdmin.js), or pass --org-slug for an existing one.`);
        }
        const orgId = org.rows[0].id;

        // Service-account user — never logs in via /login (random unusable password hash).
        const unusablePassword = await password.hash(crypto.randomBytes(32).toString('hex'));
        const u = await client.query(
            `INSERT INTO auth.users (email, password_hash, full_name, status, email_verified_at, mfa_enabled, created_at, updated_at)
             VALUES ($1, $2, $3, 'active', NOW(), false, NOW(), NOW())
             ON CONFLICT (email) DO UPDATE SET status = 'active', updated_at = NOW()
             RETURNING id`,
            [EMAIL, unusablePassword, `Service Account: ${NAME}`],
        );
        const userId = u.rows[0].id;

        const existing = await client.query('SELECT id, client_id FROM auth.oauth_clients WHERE client_id = $1', [CLIENT_ID]);
        if (existing.rows.length && !ROTATE) {
            throw new Error(`Client "${CLIENT_ID}" already exists. Pass --rotate to issue it a new secret.`);
        }

        const clientSecret = crypto.randomBytes(32).toString('hex');
        const secretHash = await password.hash(clientSecret);

        if (existing.rows.length) {
            await client.query(
                `UPDATE auth.oauth_clients
                 SET client_secret_hash = $1, owner_id = $2, org_id = $3, grant_types = $4, revoked_at = NULL, updated_at = NOW()
                 WHERE client_id = $5`,
                [secretHash, userId, orgId, JSON.stringify(['client_credentials']), CLIENT_ID],
            );
        } else {
            await client.query(
                `INSERT INTO auth.oauth_clients
                    (id, name, client_id, client_secret_hash, redirect_uris, grant_types, scopes, is_confidential, owner_id, org_id, created_at, updated_at)
                 VALUES (gen_random_uuid(), $1, $2, $3, '[]'::jsonb, $4, '[]'::jsonb, true, $5, $6, NOW(), NOW())`,
                [NAME, CLIENT_ID, secretHash, JSON.stringify(['client_credentials']), userId, orgId],
            );
        }

        await client.query('COMMIT');
        console.log(JSON.stringify({
            ok: true,
            userId: String(userId),
            clientId: CLIENT_ID,
            clientSecret,
            note: 'clientSecret is shown ONLY this once — store it in the job\'s secret store now. ' +
                  `Next step (separate, requires an admin session): POST /cms/websites/:websiteId/members ` +
                  `{ "userId": "${userId}", "role": "cms_contributor" } for exactly the website this job should touch. ` +
                  'Until that runs, this client can get a token but has no CMS access.',
        }, null, 2));
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        await client.end();
    }
}

main().catch((e) => { console.error('createOauthClient failed:', e.message); process.exit(1); });
