'use strict';
/**
 * Idempotent bootstrap for the staff (HR) module.
 *
 *   - Creates the `staff` schema and its tables (departments, teams, employees,
 *     invitations, onboarding_steps).
 *   - Seeds a realistic org chart (departments + teams) and turns existing
 *     platform users into employee records — but ONLY the first time (it skips
 *     seeding if the target org already has departments).
 *
 * Scope: everything is seeded under the super-admin's primary organization, so
 * the admin console (logged in as superadmin@baalvion.com) sees populated tabs.
 *
 * Usage:  node -r dotenv/config scripts/bootstrapStaff.js
 */
const { Client } = require('pg');

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';

const DEPARTMENTS = [
    'Engineering', 'Product', 'Operations', 'Marketing', 'Sales', 'Finance', 'People & Culture',
];
const TEAMS = [
    { dept: 'Engineering', name: 'Platform',  projects: ['Auth Gateway', 'CMS Engine'] },
    { dept: 'Engineering', name: 'Frontend',  projects: ['Admin Console', 'Design System'] },
    { dept: 'Product',     name: 'Design',    projects: ['Brand Refresh'] },
    { dept: 'Operations',  name: 'IT & Sec',  projects: ['SSO Rollout'] },
];
const TITLES = ['Engineer', 'Senior Engineer', 'Designer', 'Product Manager', 'Analyst', 'Coordinator', 'Lead'];
const TIMEZONES = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Singapore'];

async function main() {
    // Secret guard: the local-dev fallback password must never silently apply in
    // production. Fail-closed if DB_PASSWORD is missing under NODE_ENV=production,
    // while preserving the convenient dev default everywhere else.
    if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
        throw new Error('DB_PASSWORD is required in production (refusing the dev-default fallback)');
    }
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

        // ── 1. Schema + tables ────────────────────────────────────────────────
        await client.query(`CREATE SCHEMA IF NOT EXISTS staff;`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS staff.departments (
                id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id      uuid NOT NULL,
                name        text NOT NULL,
                head_id     uuid,
                parent_id   uuid,
                created_at  timestamptz NOT NULL DEFAULT now(),
                updated_at  timestamptz NOT NULL DEFAULT now()
            );`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS staff.teams (
                id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id        uuid NOT NULL,
                department_id uuid NOT NULL REFERENCES staff.departments(id) ON DELETE CASCADE,
                name          text NOT NULL,
                lead_id       uuid,
                projects      text[] NOT NULL DEFAULT '{}',
                created_at    timestamptz NOT NULL DEFAULT now(),
                updated_at    timestamptz NOT NULL DEFAULT now()
            );`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS staff.employees (
                id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id         uuid NOT NULL,
                user_id        bigint,
                email          text NOT NULL,
                full_name      text,
                avatar_url     text,
                title          text NOT NULL DEFAULT '',
                department_id  uuid REFERENCES staff.departments(id) ON DELETE SET NULL,
                team_id        uuid REFERENCES staff.teams(id) ON DELETE SET NULL,
                manager_id     uuid REFERENCES staff.employees(id) ON DELETE SET NULL,
                status         text NOT NULL DEFAULT 'active',
                role           text NOT NULL DEFAULT 'member',
                permissions    text[] NOT NULL DEFAULT '{}',
                location       text,
                timezone       text NOT NULL DEFAULT 'UTC',
                hired_at       timestamptz NOT NULL DEFAULT now(),
                last_active_at timestamptz NOT NULL DEFAULT now(),
                created_at     timestamptz NOT NULL DEFAULT now(),
                updated_at     timestamptz NOT NULL DEFAULT now()
            );`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS staff.invitations (
                id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id          uuid NOT NULL,
                email           text NOT NULL,
                role            text NOT NULL DEFAULT 'member',
                department_id   uuid,
                team_id         uuid,
                token           text NOT NULL UNIQUE,
                invited_by      bigint,
                invited_by_name text,
                status          text NOT NULL DEFAULT 'pending',
                expires_at      timestamptz NOT NULL,
                accepted_at     timestamptz,
                created_at      timestamptz NOT NULL DEFAULT now(),
                updated_at      timestamptz NOT NULL DEFAULT now()
            );`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS staff.onboarding_steps (
                id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id  uuid NOT NULL REFERENCES staff.employees(id) ON DELETE CASCADE,
                title        text NOT NULL,
                description  text NOT NULL DEFAULT '',
                completed    boolean NOT NULL DEFAULT false,
                completed_at timestamptz,
                due_date     timestamptz,
                sort_order   int NOT NULL DEFAULT 0,
                created_at   timestamptz NOT NULL DEFAULT now()
            );`);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_emp_org   ON staff.employees(org_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_emp_dept  ON staff.employees(department_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_inv_org   ON staff.invitations(org_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_staff_inv_status ON staff.invitations(status);`);

        // ── 2. Resolve the super-admin's org ──────────────────────────────────
        const orgRow = await client.query(
            `SELECT tm.org_id
               FROM auth.team_members tm
               JOIN auth.users u ON u.id = tm.user_id
              WHERE u.email = $1
              ORDER BY tm.created_at ASC
              LIMIT 1`,
            [SUPERADMIN_EMAIL]
        );
        if (orgRow.rowCount === 0) {
            await client.query('COMMIT');
            console.log(JSON.stringify({ ok: true, note: `No membership for ${SUPERADMIN_EMAIL}; schema created, seeding skipped.` }, null, 2));
            return;
        }
        const orgId = orgRow.rows[0].org_id;

        // Idempotency: skip seeding if this org already has departments.
        const existing = await client.query(`SELECT COUNT(*)::int AS n FROM staff.departments WHERE org_id = $1`, [orgId]);
        if (existing.rows[0].n > 0) {
            await client.query('COMMIT');
            console.log(JSON.stringify({ ok: true, orgId, note: 'Already seeded — schema ensured, no changes.' }, null, 2));
            return;
        }

        // ── 3. Seed departments ───────────────────────────────────────────────
        const deptIds = {};
        for (const name of DEPARTMENTS) {
            const r = await client.query(
                `INSERT INTO staff.departments (org_id, name) VALUES ($1, $2) RETURNING id`,
                [orgId, name]
            );
            deptIds[name] = r.rows[0].id;
        }

        // ── 4. Seed teams ─────────────────────────────────────────────────────
        const teamIds = [];
        for (const t of TEAMS) {
            const r = await client.query(
                `INSERT INTO staff.teams (org_id, department_id, name, projects) VALUES ($1, $2, $3, $4) RETURNING id, department_id`,
                [orgId, deptIds[t.dept], t.name, t.projects]
            );
            teamIds.push({ id: r.rows[0].id, departmentId: r.rows[0].department_id });
        }

        // ── 5. Seed employees from real platform users ────────────────────────
        const users = await client.query(
            `SELECT id, email, full_name, avatar_url FROM auth.users
              WHERE status = 'active' ORDER BY created_at ASC LIMIT 14`
        );
        const deptList = Object.values(deptIds);
        let i = 0;
        for (const u of users.rows) {
            const deptId  = deptList[i % deptList.length];
            const team    = teamIds.find((t) => t.departmentId === deptId) || null;
            const title   = TITLES[i % TITLES.length];
            const tz       = TIMEZONES[i % TIMEZONES.length];
            await client.query(
                `INSERT INTO staff.employees
                    (org_id, user_id, email, full_name, avatar_url, title, department_id, team_id, status, role, timezone)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,$10)`,
                [orgId, u.id, u.email, u.full_name || u.email.split('@')[0], u.avatar_url,
                 title, deptId, team ? team.id : null, i === 0 ? 'admin' : 'member', tz]
            );
            i += 1;
        }

        await client.query('COMMIT');
        console.log(JSON.stringify({
            ok: true, orgId,
            seeded: { departments: DEPARTMENTS.length, teams: TEAMS.length, employees: users.rowCount },
        }, null, 2));
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('bootstrapStaff failed:', err.message);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

main();
