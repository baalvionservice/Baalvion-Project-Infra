'use strict';
/**
 * Staff (HR) domain service.
 *
 * Backs the admin console's Staff section: departments, teams, employees,
 * invitations (with real email delivery + an acceptance flow that yields a
 * loginable account) and onboarding checklists. Everything is org-scoped to the
 * caller (req.auth.orgId), so each organization manages its own staff.
 */
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { AppError } = require('../utils/errors');
const { sendMailSafe } = require('../utils/mailer');
const logger = require('../utils/logger');

let _db = null;
function db() { if (!_db) _db = require('../models'); return _db; }
function sel(sql, replacements) { return db().sequelize.query(sql, { replacements, type: QueryTypes.SELECT }); }

const APP_URL = process.env.STAFF_APP_URL || process.env.ADMIN_APP_URL || 'http://localhost:3030';
const TEAM_ROLES = new Set(['owner', 'admin', 'super_admin', 'editor', 'member']);
const DEFAULT_ONBOARDING = [
    { title: 'Sign employment agreement', description: 'Review and e-sign the offer & employment contract.' },
    { title: 'Account & SSO setup',       description: 'Activate Baalvion SSO and enable MFA.' },
    { title: 'Hardware provisioning',     description: 'Collect laptop and access badges.' },
    { title: 'Team introductions',        description: 'Meet your department and direct teammates.' },
    { title: 'Security & compliance training', description: 'Complete the mandatory security training module.' },
    { title: 'First project assignment',  description: 'Get assigned to your first project with your lead.' },
];

// ── Departments ──────────────────────────────────────────────────────────────
async function listDepartments(orgId) {
    return sel(`
        SELECT d.id,
               d.name,
               d.head_id   AS "headId",
               h.full_name AS "headName",
               d.parent_id AS "parentId",
               (SELECT COUNT(*)::int FROM staff.employees e WHERE e.department_id = d.id) AS "memberCount",
               d.created_at AS "createdAt"
          FROM staff.departments d
          LEFT JOIN staff.employees h ON h.id = d.head_id
         WHERE d.org_id = :orgId
         ORDER BY d.name ASC`, { orgId });
}

async function createDepartment(orgId, { name, headId = null, parentId = null }) {
    if (!name || !String(name).trim()) throw new AppError('VALIDATION_ERROR', 'name is required', 400);
    const [row] = await sel(
        `INSERT INTO staff.departments (org_id, name, head_id, parent_id) VALUES (:orgId, :name, :headId, :parentId) RETURNING id`,
        { orgId, name: String(name).trim(), headId, parentId });
    return (await listDepartments(orgId)).find((d) => d.id === row.id);
}

async function updateDepartment(orgId, id, { name, headId, parentId }) {
    const [row] = await sel(
        `UPDATE staff.departments
            SET name = COALESCE(:name, name),
                head_id = COALESCE(:headId, head_id),
                parent_id = COALESCE(:parentId, parent_id),
                updated_at = now()
          WHERE id = :id AND org_id = :orgId RETURNING id`,
        { orgId, id, name: name ?? null, headId: headId ?? null, parentId: parentId ?? null });
    if (!row) throw new AppError('NOT_FOUND', 'Department not found', 404);
    return (await listDepartments(orgId)).find((d) => d.id === id);
}

async function deleteDepartment(orgId, id) {
    const rows = await sel(`DELETE FROM staff.departments WHERE id = :id AND org_id = :orgId RETURNING id`, { orgId, id });
    if (!rows.length) throw new AppError('NOT_FOUND', 'Department not found', 404);
    return { id };
}

// ── Teams ────────────────────────────────────────────────────────────────────
async function listTeams(orgId, { departmentId } = {}) {
    return sel(`
        SELECT t.id,
               t.name,
               t.department_id AS "departmentId",
               t.lead_id       AS "leadId",
               l.full_name      AS "leadName",
               (SELECT COUNT(*)::int FROM staff.employees e WHERE e.team_id = t.id) AS "memberCount",
               t.projects,
               t.created_at     AS "createdAt"
          FROM staff.teams t
          LEFT JOIN staff.employees l ON l.id = t.lead_id
         WHERE t.org_id = :orgId
           AND (:departmentId::uuid IS NULL OR t.department_id = :departmentId)
         ORDER BY t.name ASC`, { orgId, departmentId: departmentId || null });
}

async function createTeam(orgId, { name, departmentId, leadId = null, projects = [] }) {
    if (!name || !String(name).trim()) throw new AppError('VALIDATION_ERROR', 'name is required', 400);
    if (!departmentId) throw new AppError('VALIDATION_ERROR', 'departmentId is required', 400);
    const [row] = await sel(
        `INSERT INTO staff.teams (org_id, department_id, name, lead_id, projects)
         VALUES (:orgId, :departmentId, :name, :leadId, :projects) RETURNING id`,
        { orgId, departmentId, name: String(name).trim(), leadId, projects });
    return (await listTeams(orgId)).find((t) => t.id === row.id);
}

async function updateTeam(orgId, id, { name, leadId, projects }) {
    const [row] = await sel(
        `UPDATE staff.teams
            SET name = COALESCE(:name, name),
                lead_id = COALESCE(:leadId, lead_id),
                projects = COALESCE(:projects, projects),
                updated_at = now()
          WHERE id = :id AND org_id = :orgId RETURNING id`,
        { orgId, id, name: name ?? null, leadId: leadId ?? null, projects: projects ?? null });
    if (!row) throw new AppError('NOT_FOUND', 'Team not found', 404);
    return (await listTeams(orgId)).find((t) => t.id === id);
}

// ── Employees ────────────────────────────────────────────────────────────────
const EMP_SELECT = `
    SELECT e.id,
           e.user_id        AS "userId",
           e.email,
           e.full_name      AS "fullName",
           e.avatar_url     AS "avatarUrl",
           e.title,
           e.department_id  AS "departmentId",
           d.name           AS "departmentName",
           e.team_id        AS "teamId",
           t.name           AS "teamName",
           e.manager_id     AS "managerId",
           m.full_name      AS "managerName",
           e.status,
           e.role,
           e.permissions,
           e.location,
           e.timezone,
           e.hired_at       AS "hiredAt",
           e.last_active_at AS "lastActiveAt",
           e.created_at     AS "createdAt"
      FROM staff.employees e
      LEFT JOIN staff.departments d ON d.id = e.department_id
      LEFT JOIN staff.teams       t ON t.id = e.team_id
      LEFT JOIN staff.employees   m ON m.id = e.manager_id`;

async function listEmployees(orgId, { page = 1, limit = 20, departmentId, teamId, status, search } = {}) {
    const offset = (page - 1) * limit;
    const where = `WHERE e.org_id = :orgId
        AND (:departmentId::uuid IS NULL OR e.department_id = :departmentId)
        AND (:teamId::uuid IS NULL OR e.team_id = :teamId)
        AND (:status::text IS NULL OR e.status = :status)
        AND (:search::text IS NULL OR e.full_name ILIKE :like OR e.email ILIKE :like OR e.title ILIKE :like)`;
    const repl = {
        orgId, departmentId: departmentId || null, teamId: teamId || null,
        status: status || null, search: search || null, like: search ? `%${search}%` : null,
        limit, offset,
    };
    const items = await sel(`${EMP_SELECT} ${where} ORDER BY e.full_name ASC LIMIT :limit OFFSET :offset`, repl);
    const [{ total }] = await sel(`SELECT COUNT(*)::int AS total FROM staff.employees e ${where}`, repl);
    return { items, total, page, limit };
}

async function getEmployee(orgId, id) {
    const [row] = await sel(`${EMP_SELECT} WHERE e.org_id = :orgId AND e.id = :id`, { orgId, id });
    if (!row) throw new AppError('NOT_FOUND', 'Employee not found', 404);
    return row;
}

async function updateEmployee(orgId, id, data) {
    const [exists] = await sel(`SELECT id FROM staff.employees WHERE id = :id AND org_id = :orgId`, { orgId, id });
    if (!exists) throw new AppError('NOT_FOUND', 'Employee not found', 404);
    await sel(`
        UPDATE staff.employees SET
            full_name     = COALESCE(:fullName, full_name),
            title         = COALESCE(:title, title),
            department_id = COALESCE(:departmentId, department_id),
            team_id       = COALESCE(:teamId, team_id),
            manager_id    = COALESCE(:managerId, manager_id),
            status        = COALESCE(:status, status),
            role          = COALESCE(:role, role),
            location      = COALESCE(:location, location),
            timezone      = COALESCE(:timezone, timezone),
            updated_at    = now()
          WHERE id = :id AND org_id = :orgId`,
        {
            orgId, id,
            fullName: data.fullName ?? null, title: data.title ?? null,
            departmentId: data.departmentId ?? null, teamId: data.teamId ?? null,
            managerId: data.managerId ?? null, status: data.status ?? null,
            role: data.role ?? null, location: data.location ?? null, timezone: data.timezone ?? null,
        });
    return getEmployee(orgId, id);
}

async function deactivateEmployee(orgId, id, reason) {
    const [row] = await sel(
        `UPDATE staff.employees SET status = 'inactive', updated_at = now()
          WHERE id = :id AND org_id = :orgId RETURNING id`, { orgId, id });
    if (!row) throw new AppError('NOT_FOUND', 'Employee not found', 404);
    logger.info({ employeeId: id, reason }, '[staff] employee deactivated');
    return getEmployee(orgId, id);
}

// ── Invitations ──────────────────────────────────────────────────────────────
function shapeInvitation(r) {
    return {
        id: r.id, email: r.email, role: r.role,
        department: r.departmentName || '', invitedBy: r.invitedByName || '',
        expiresAt: r.expiresAt, acceptedAt: r.acceptedAt, status: r.status, createdAt: r.createdAt,
    };
}

async function listInvitations(orgId, { page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    const where = `WHERE i.org_id = :orgId AND (:status::text IS NULL OR i.status = :status)`;
    const repl = { orgId, status: status || null, limit, offset };
    const rows = await sel(`
        SELECT i.id, i.email, i.role, i.status,
               i.invited_by_name AS "invitedByName",
               d.name            AS "departmentName",
               i.expires_at      AS "expiresAt",
               i.accepted_at     AS "acceptedAt",
               i.created_at      AS "createdAt"
          FROM staff.invitations i
          LEFT JOIN staff.departments d ON d.id = i.department_id
          ${where}
         ORDER BY i.created_at DESC
         LIMIT :limit OFFSET :offset`, repl);
    const [{ total }] = await sel(`SELECT COUNT(*)::int AS total FROM staff.invitations i ${where}`, repl);
    return { items: rows.map(shapeInvitation), total, page, limit };
}

async function sendInvitation(orgId, { email, role = 'member', departmentId = null, teamId = null }, invitedBy = {}) {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new AppError('VALIDATION_ERROR', 'A valid email is required', 400);

    // Block duplicate pending invites for the same email in this org.
    const dupe = await sel(
        `SELECT id FROM staff.invitations WHERE org_id = :orgId AND lower(email) = lower(:email) AND status = 'pending'`,
        { orgId, email });
    if (dupe.length) throw new AppError('CONFLICT', 'A pending invitation already exists for this email', 409);

    const token = crypto.randomBytes(32).toString('hex');
    const [row] = await sel(`
        INSERT INTO staff.invitations (org_id, email, role, department_id, team_id, token, invited_by, invited_by_name, expires_at)
        VALUES (:orgId, :email, :role, :departmentId, :teamId, :token, :invitedBy, :invitedByName, now() + interval '7 days')
        RETURNING id`,
        {
            orgId, email, role, departmentId, teamId, token,
            invitedBy: invitedBy.id || null, invitedByName: invitedBy.name || invitedBy.email || 'An administrator',
        });

    const acceptUrl = `${APP_URL}/accept-invite?token=${token}`;
    const mail = await sendMailSafe({
        to: email,
        subject: `You're invited to join Baalvion`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:520px">
            <h2>You've been invited to Baalvion</h2>
            <p>${invitedBy.name || 'An administrator'} has invited you to join as <b>${role}</b>.</p>
            <p><a href="${acceptUrl}" style="background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Accept invitation</a></p>
            <p style="color:#666;font-size:13px">Or use this link: ${acceptUrl}<br/>This invite expires in 7 days.</p>
        </div>`,
    });

    const [full] = await sel(`
        SELECT i.id, i.email, i.role, i.status, i.invited_by_name AS "invitedByName",
               d.name AS "departmentName", i.expires_at AS "expiresAt", i.accepted_at AS "acceptedAt", i.created_at AS "createdAt"
          FROM staff.invitations i LEFT JOIN staff.departments d ON d.id = i.department_id
         WHERE i.id = :id`, { id: row.id });
    return { ...shapeInvitation(full), emailDelivered: mail.delivered, acceptUrl };
}

async function revokeInvitation(orgId, id) {
    const [row] = await sel(
        `UPDATE staff.invitations SET status = 'revoked', updated_at = now()
          WHERE id = :id AND org_id = :orgId AND status = 'pending' RETURNING id`, { orgId, id });
    if (!row) throw new AppError('NOT_FOUND', 'Pending invitation not found', 404);
    return { id };
}

/**
 * Accept an invitation. Public (token-authenticated). Produces a loginable
 * account: existing users are attached to the org; new emails are registered
 * through auth-service (proper password hashing + verification), then attached.
 */
async function acceptInvitation(token, { password, fullName } = {}) {
    if (!token) throw new AppError('VALIDATION_ERROR', 'token is required', 400);
    const [inv] = await sel(
        `SELECT * FROM staff.invitations WHERE token = :token`, { token });
    if (!inv) throw new AppError('NOT_FOUND', 'Invitation not found', 404);
    if (inv.status !== 'pending') throw new AppError('CONFLICT', `Invitation already ${inv.status}`, 409);
    if (new Date(inv.expires_at) < new Date()) {
        await sel(`UPDATE staff.invitations SET status='expired', updated_at=now() WHERE id=:id`, { id: inv.id });
        throw new AppError('EXPIRED', 'Invitation has expired', 410);
    }

    let [user] = await sel(`SELECT id, email, full_name FROM auth.users WHERE lower(email) = lower(:email)`, { email: inv.email });

    if (!user) {
        if (!password || String(password).length < 8) {
            throw new AppError('VALIDATION_ERROR', 'A password (min 8 chars) is required to accept as a new user', 400);
        }
        // Delegate account creation to auth-service so the password is hashed correctly.
        const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
        const resp = await fetch(`${authUrl}/v1/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: inv.email, password, fullName: fullName || inv.email.split('@')[0] }),
        }).catch((e) => { throw new AppError('UPSTREAM_ERROR', `Could not create account: ${e.message}`, 502); });
        if (!resp.ok && resp.status !== 409) {
            throw new AppError('UPSTREAM_ERROR', `Account creation failed (${resp.status})`, 502);
        }
        [user] = await sel(`SELECT id, email, full_name FROM auth.users WHERE lower(email) = lower(:email)`, { email: inv.email });
        if (!user) throw new AppError('UPSTREAM_ERROR', 'Account creation did not yield a user', 502);
    }

    // Attach to the staff org (idempotent).
    const memberRole = TEAM_ROLES.has(inv.role) ? inv.role : 'member';
    await sel(`
        INSERT INTO auth.team_members (org_id, user_id, role, status, joined_at, created_at, updated_at)
        VALUES (:orgId, :userId, :role, 'active', now(), now(), now())
        ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = now()`,
        { orgId: inv.org_id, userId: user.id, role: memberRole })
        .catch(async (e) => {
            // No unique constraint? fall back to manual upsert.
            const [m] = await sel(`SELECT id FROM auth.team_members WHERE org_id=:orgId AND user_id=:userId`, { orgId: inv.org_id, userId: user.id });
            if (m) await sel(`UPDATE auth.team_members SET role=:role, status='active', updated_at=now() WHERE id=:id`, { role: memberRole, id: m.id });
            else await sel(`INSERT INTO auth.team_members (org_id, user_id, role, status, joined_at, created_at, updated_at) VALUES (:orgId,:userId,:role,'active',now(),now(),now())`, { orgId: inv.org_id, userId: user.id, role: memberRole });
        });

    // Create or refresh the employee record.
    const existingEmp = await sel(`SELECT id FROM staff.employees WHERE org_id=:orgId AND lower(email)=lower(:email)`, { orgId: inv.org_id, email: inv.email });
    if (existingEmp.length) {
        await sel(`UPDATE staff.employees SET status='active', department_id=COALESCE(:deptId,department_id), team_id=COALESCE(:teamId,team_id), role=:role, user_id=:userId, updated_at=now() WHERE id=:id`,
            { deptId: inv.department_id, teamId: inv.team_id, role: inv.role, userId: user.id, id: existingEmp[0].id });
    } else {
        await sel(`INSERT INTO staff.employees (org_id, user_id, email, full_name, department_id, team_id, status, role)
                   VALUES (:orgId, :userId, :email, :fullName, :deptId, :teamId, 'active', :role)`,
            { orgId: inv.org_id, userId: user.id, email: inv.email, fullName: fullName || user.full_name || inv.email.split('@')[0],
              deptId: inv.department_id, teamId: inv.team_id, role: inv.role });
    }

    await sel(`UPDATE staff.invitations SET status='accepted', accepted_at=now(), updated_at=now() WHERE id=:id`, { id: inv.id });
    return { accepted: true, userId: String(user.id), email: inv.email, canLogin: true };
}

// ── Onboarding ───────────────────────────────────────────────────────────────
async function getOnboarding(orgId, employeeId) {
    await getEmployee(orgId, employeeId); // 404s if not in org
    let steps = await sel(
        `SELECT id, title, description, completed, completed_at AS "completedAt", due_date AS "dueDate"
           FROM staff.onboarding_steps WHERE employee_id = :employeeId ORDER BY sort_order ASC`, { employeeId });
    if (!steps.length) {
        // Lazily materialize the default checklist on first view.
        let order = 0;
        for (const s of DEFAULT_ONBOARDING) {
            await sel(`INSERT INTO staff.onboarding_steps (employee_id, title, description, sort_order, due_date)
                       VALUES (:employeeId, :title, :description, :order, now() + (:order + 3) * interval '1 day')`,
                { employeeId, title: s.title, description: s.description, order });
            order += 1;
        }
        steps = await sel(
            `SELECT id, title, description, completed, completed_at AS "completedAt", due_date AS "dueDate"
               FROM staff.onboarding_steps WHERE employee_id = :employeeId ORDER BY sort_order ASC`, { employeeId });
    }
    const done = steps.filter((s) => s.completed).length;
    return { employeeId, steps, completionPct: steps.length ? Math.round((done / steps.length) * 100) : 0 };
}

async function updateOnboardingStep(orgId, employeeId, stepId, completed) {
    await getEmployee(orgId, employeeId);
    const [row] = await sel(
        `UPDATE staff.onboarding_steps
            SET completed = :completed, completed_at = CASE WHEN :completed THEN now() ELSE NULL END
          WHERE id = :stepId AND employee_id = :employeeId RETURNING id`,
        { completed: !!completed, stepId, employeeId });
    if (!row) throw new AppError('NOT_FOUND', 'Onboarding step not found', 404);
    return getOnboarding(orgId, employeeId);
}

// ── Identity / permissions ───────────────────────────────────────────────────
async function getIdentityPermissions(orgId, employeeId) {
    const emp = await getEmployee(orgId, employeeId);
    return { roles: emp.role ? [emp.role] : [], permissions: emp.permissions || [] };
}

async function updateIdentityPermissions(orgId, employeeId, { roles = [], permissions = [] }) {
    await getEmployee(orgId, employeeId);
    await sel(`UPDATE staff.employees SET role = COALESCE(:role, role), permissions = :permissions, updated_at = now()
                WHERE id = :employeeId AND org_id = :orgId`,
        { role: roles[0] || null, permissions, employeeId, orgId });
    return { roles, permissions };
}

module.exports = {
    listDepartments, createDepartment, updateDepartment, deleteDepartment,
    listTeams, createTeam, updateTeam,
    listEmployees, getEmployee, updateEmployee, deactivateEmployee,
    listInvitations, sendInvitation, revokeInvitation, acceptInvitation,
    getOnboarding, updateOnboardingStep,
    getIdentityPermissions, updateIdentityPermissions,
};
