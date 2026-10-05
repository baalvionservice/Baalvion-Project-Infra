'use strict';
/**
 * Local-only test accounts: one login for every GTI authority role.
 *
 * GTI decides what a person is from the role on their primary membership
 * (Frontend/Global-Trade-Infrastructure-main/src/core/authority-mapping.ts), so one account per
 * role gives one persona per account. Idempotent: running it again resets the password.
 *
 *   Usage:    node scripts/seedGtiRoleAccounts.js
 *   Password: GtiTest!2026#Role for every account (override with SEED_PASSWORD)
 *   Emails:   test.<role>@gti.local, e.g. test.super-admin@gti.local
 *
 * SAFETY: refuses to run unless the database host is local. These accounts share one password
 * and include the highest platform roles; they must never exist on a real environment.
 */
const { Client } = require('pg');
const password = require('../utils/password');

const PW = process.env.SEED_PASSWORD || 'GtiTest!2026#Role';
const HOST = process.env.DB_HOST || 'localhost';

if (!['localhost', '127.0.0.1', '::1'].includes(HOST) || process.env.NODE_ENV === 'production') {
    console.error(`Refusing to seed shared-password test accounts into "${HOST}" (NODE_ENV=${process.env.NODE_ENV || 'unset'}). Local databases only.`);
    process.exit(1);
}

// Organizations, by type. The first listed account owns the organization.
const ORGS = [
    {
        name: 'GTI Test: Sovereign Core', slug: 'gti-test-sovereign', type: 'platform_owner', plan: 'enterprise',
        accounts: [
            ['super_admin', 'Sovereign Master'],
            // Platform roles may not be an organization membership role (auth-service refuses it):
            // they live on auth.users.platform_role, with an ordinary org role alongside.
            ['platform_admin', 'Platform Administrator', { membership: 'admin', platformRole: 'platform_admin' }],
            ['sovereign_admin', 'Sovereign Administrator'],
            ['sovereign_operator', 'Sovereign Operator'],
            ['platform_auditor', 'Sovereign Auditor'],
        ],
    },
    {
        name: 'GTI Test: National Regulator', slug: 'gti-test-regulator', type: 'regulator', plan: 'enterprise',
        accounts: [
            ['national_regulator', 'National Regulator'],
            ['arbitrator', 'Legal Adjudicator'],
        ],
    },
    {
        name: 'GTI Test: Meridian Imports (buyer org)', slug: 'gti-test-buyer', type: 'buyer', plan: 'enterprise',
        accounts: [
            ['org_owner', 'Organization Principal'],
            ['executive_director', 'Executive Command'],
            ['finance_director', 'Treasury Command'],
            ['operations_director', 'Logistics Command'],
            ['buyer', 'Buyer'],
            ['buyer_node', 'Buyer Node'],
            ['treasury_operator', 'Treasury Node'],
            ['trade_analyst', 'Intelligence Node'],
            ['member', 'Trade Participant'],
        ],
    },
    {
        name: 'GTI Test: Atlas Exporters (seller org)', slug: 'gti-test-seller', type: 'seller', plan: 'enterprise',
        accounts: [
            ['seller', 'Seller'],
            ['seller_node', 'Seller Node'],
        ],
    },
    {
        name: 'GTI Test: Vanguard Trade Agency', slug: 'gti-test-agent', type: 'trade_agent', plan: 'pro',
        accounts: [['agent', 'Trade Agent']],
    },
    {
        name: 'GTI Test: Oceanic Logistics', slug: 'gti-test-logistics', type: 'logistics_provider', plan: 'enterprise',
        accounts: [['logistics_coordinator', 'Fulfillment Node']],
    },
    {
        name: 'GTI Test: Compliance Agency', slug: 'gti-test-compliance', type: 'compliance_agency', plan: 'enterprise',
        accounts: [
            ['compliance_director', 'Compliance Command'],
            ['compliance_admin', 'Compliance Administrator'],
            ['compliance_officer', 'Compliance Node'],
        ],
    },
    {
        name: 'GTI Test: National Customs Authority', slug: 'gti-test-customs', type: 'customs_authority', plan: 'enterprise',
        accounts: [['customs_agent', 'Customs Authority']],
    },
    {
        name: 'GTI Test: Bank', slug: 'gti-test-bank', type: 'bank', plan: 'enterprise',
        accounts: [['bank_admin', 'Bank Authority']],
    },
    {
        name: 'GTI Test: Insurance Provider', slug: 'gti-test-insurance', type: 'insurance_provider', plan: 'enterprise',
        accounts: [['insurance_admin', 'Insurance Authority']],
    },
];

const emailFor = (role) => `test.${role.replace(/_/g, '-')}@gti.local`;

async function main() {
    const client = new Client({
        host: HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || 'baalvion_dev_pass',
    });
    await client.connect();
    try {
        await client.query('BEGIN');
        const hash = await password.hash(PW);
        const rows = [];

        for (const org of ORGS) {
            const users = [];
            for (const [role, label, opts = {}] of org.accounts) {
                const email = emailFor(role);
                const u = await client.query(
                    `INSERT INTO auth.users (email, password_hash, full_name, status, email_verified_at, mfa_enabled, created_at, updated_at)
                     VALUES ($1, $2, $3, 'active', NOW(), false, NOW(), NOW())
                     ON CONFLICT (email) DO UPDATE
                        SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, status = 'active',
                            email_verified_at = COALESCE(auth.users.email_verified_at, NOW()), updated_at = NOW()
                     RETURNING id`,
                    [email, hash, `Test ${label}`]
                );
                if (opts.platformRole) {
                    await client.query('UPDATE auth.users SET platform_role = $1 WHERE id = $2', [opts.platformRole, u.rows[0].id]);
                }
                users.push({ role, label, email, id: u.rows[0].id, membership: opts.membership || role });
            }
            const o = await client.query(
                `INSERT INTO auth.organizations (id, name, slug, type, plan, owner_id, created_at, updated_at)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
                 ON CONFLICT (slug) DO UPDATE
                    SET name = EXCLUDED.name, type = EXCLUDED.type, plan = EXCLUDED.plan,
                        owner_id = EXCLUDED.owner_id, updated_at = NOW()
                 RETURNING id`,
                [org.name, org.slug, org.type, org.plan, users[0].id]
            );
            for (const u of users) {
                await client.query(
                    `INSERT INTO auth.team_members (org_id, user_id, role, service_roles, status, joined_at, created_at, updated_at)
                     VALUES ($1, $2, $3, '{}'::jsonb, 'active', NOW(), NOW(), NOW())
                     ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = NOW()`,
                    [o.rows[0].id, u.id, u.membership]
                );
                rows.push({ role: u.role, email: u.email, org: org.name, orgType: org.type });
            }
        }

        await client.query('COMMIT');
        console.log(JSON.stringify({ ok: true, password: PW, count: rows.length, accounts: rows }, null, 2));
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        await client.end();
    }
}

main().catch((e) => { console.error('Role-account seed failed:', e.message); process.exit(1); });
