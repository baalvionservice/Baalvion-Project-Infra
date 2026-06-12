'use strict';
/**
 * Idempotent GTI multi-tenant seed.
 *
 * Creates one organization per ORGANIZATION TYPE and attaches real user + membership
 * records — replacing the old single-company persona-switching demo data with a true
 * multi-tenant fixture. Every seeded user logs in normally (auth-service /login) and is
 * routed to their organization-type dashboard by the frontend; NO superadmin
 * impersonation is involved.
 *
 *   Default password for every seeded account: Gti!Trade2026  (override: SEED_PASSWORD)
 *
 * Usage:  node scripts/seedGtiOrganizations.js
 *
 * Requires migration 004_org_type.sql to have been applied (auth.organizations.type).
 */
const { Client } = require('pg');
const password   = require('../utils/password');

const PW = process.env.SEED_PASSWORD || 'Gti!Trade2026';

// ─── Fixture: orgs + members ─────────────────────────────────────────────────────
// Each org's `owner` (the first member) becomes auth.organizations.owner_id.
const ORGS = [
    {
        name: 'GTI Platform', slug: 'gti-platform', type: 'platform_owner', plan: 'enterprise',
        members: [
            { email: 'owner@gti.local', name: 'Platform Owner', role: 'owner' },
        ],
    },
    {
        name: 'Meridian Imports', slug: 'gti-buyer-meridian', type: 'buyer', plan: 'enterprise',
        members: [
            { email: 'buyer.admin@gti.local',   name: 'Buyer Admin',   role: 'admin' },
            { email: 'buyer.manager@gti.local', name: 'Buyer Manager', role: 'manager' },
        ],
    },
    {
        name: 'Atlas Exporters', slug: 'gti-seller-atlas', type: 'seller', plan: 'enterprise',
        members: [
            { email: 'seller.admin@gti.local', name: 'Seller Admin', role: 'admin' },
        ],
    },
    {
        name: 'Vanguard Trade Agency', slug: 'gti-agent-vanguard', type: 'trade_agent', plan: 'pro',
        members: [
            { email: 'agent.admin@gti.local', name: 'Trade Agent Admin', role: 'admin' },
        ],
    },
    {
        name: 'Oceanic Logistics', slug: 'gti-logistics-oceanic', type: 'logistics_provider', plan: 'enterprise',
        members: [
            { email: 'logistics.admin@gti.local',    name: 'Logistics Admin',    role: 'admin' },
            { email: 'logistics.operator@gti.local', name: 'Logistics Operator', role: 'operator' },
        ],
    },
    {
        name: 'National Customs Authority', slug: 'gti-customs-national', type: 'customs_authority', plan: 'enterprise',
        members: [
            { email: 'customs.admin@gti.local',   name: 'Customs Admin',   role: 'admin' },
            { email: 'customs.officer@gti.local', name: 'Customs Officer', role: 'officer' },
        ],
    },
    {
        name: 'Apex Trade Bank', slug: 'gti-bank-apex', type: 'bank', plan: 'enterprise',
        members: [
            { email: 'bank.admin@gti.local',   name: 'Bank Admin',   role: 'admin' },
            { email: 'bank.officer@gti.local', name: 'Bank Officer', role: 'officer' },
        ],
    },
    {
        name: 'Sentinel Cargo Insurance', slug: 'gti-insurance-sentinel', type: 'insurance_provider', plan: 'enterprise',
        members: [
            { email: 'insurance.admin@gti.local', name: 'Insurance Admin', role: 'admin' },
        ],
    },
    {
        name: 'Aegis Compliance Agency', slug: 'gti-compliance-aegis', type: 'compliance_agency', plan: 'enterprise',
        members: [
            { email: 'compliance.admin@gti.local', name: 'Compliance Admin', role: 'admin' },
        ],
    },
    {
        name: 'Global Trade Regulator', slug: 'gti-regulator-global', type: 'regulator', plan: 'enterprise',
        members: [
            { email: 'regulator.admin@gti.local', name: 'Regulator Admin', role: 'admin' },
        ],
    },
];

async function upsertUser(client, email, name, hash) {
    const u = await client.query(
        `INSERT INTO auth.users (email, password_hash, full_name, status, email_verified_at, mfa_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', NOW(), false, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE
            SET password_hash = EXCLUDED.password_hash,
                full_name = EXCLUDED.full_name,
                status = 'active',
                email_verified_at = COALESCE(auth.users.email_verified_at, NOW()),
                updated_at = NOW()
         RETURNING id`,
        [email, hash, name]
    );
    return u.rows[0].id;
}

async function upsertOrg(client, org, ownerId) {
    const o = await client.query(
        `INSERT INTO auth.organizations (id, name, slug, type, plan, owner_id, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE
            SET name = EXCLUDED.name, type = EXCLUDED.type, plan = EXCLUDED.plan,
                owner_id = EXCLUDED.owner_id, updated_at = NOW()
         RETURNING id`,
        [org.name, org.slug, org.type, org.plan, ownerId]
    );
    return o.rows[0].id;
}

async function upsertMembership(client, orgId, userId, role) {
    await client.query(
        `INSERT INTO auth.team_members (org_id, user_id, role, service_roles, status, joined_at, created_at, updated_at)
         VALUES ($1, $2, $3, '{}'::jsonb, 'active', NOW(), NOW(), NOW())
         ON CONFLICT (org_id, user_id) DO UPDATE
            SET role = EXCLUDED.role, status = 'active', updated_at = NOW()`,
        [orgId, userId, role]
    );
}

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
        const summary = [];

        for (const org of ORGS) {
            // 1 — create all member users first so the owner id exists for the org FK.
            const memberIds = [];
            for (const m of org.members) {
                const userId = await upsertUser(client, m.email, m.name, hash);
                memberIds.push({ ...m, userId });
            }
            // 2 — org, owned by its first member.
            const ownerId = memberIds[0].userId;
            const orgId = await upsertOrg(client, org, ownerId);
            // 3 — memberships.
            for (const m of memberIds) {
                await upsertMembership(client, orgId, m.userId, m.role);
            }
            summary.push({
                org: org.name, type: org.type, orgId,
                members: memberIds.map((m) => ({ email: m.email, role: m.role })),
            });
        }

        await client.query('COMMIT');
        console.log(JSON.stringify({ ok: true, password: PW, organizations: summary }, null, 2));
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        await client.end();
    }
}

main().catch((e) => { console.error('GTI seed failed:', e.message); process.exit(1); });
