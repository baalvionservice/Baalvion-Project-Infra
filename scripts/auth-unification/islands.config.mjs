/**
 * Declarative specs for Phase 4 auth-island migration (PREPARE-ONLY artifacts).
 *
 * Nothing here runs automatically. The snapshot / hash-analysis / import tools read
 * these specs. Values marked CONFIRM must be human-verified before the operator runs
 * any import (Task 4 gate).
 *
 * Canonical role hierarchy (target): viewer < member < editor < manager < admin < owner < super_admin
 */
export const ISLANDS = {
  'elite-circle': {
    service: 'Backend/services/ecosystem/elite-circle-service',

    // ⚠ CONFIRM: migration 000_baseline.sql creates schema `elite_circle`, but the
    // service appConfig defaults DB_SCHEMA to 'insiders' (copy-paste from the insiders
    // twin). The operator MUST confirm which schema actually holds live rows before
    // snapshot/import. Default here follows the migration.
    schema: process.env.ELITE_CIRCLE_SCHEMA || 'elite_circle',

    // Identity tables to snapshot + migrate (domain tables are NOT auth and stay put).
    authTables: ['users', 'profiles', 'user_roles', 'refresh_tokens'],
    userTable:  'users',
    emailColumn:    'email',
    hashColumn:     'password_hash',
    mfaColumns:     [],                 // elite-circle has NO MFA
    roleTable:      'user_roles',       // (user_id, role)
    roleColumn:     'role',

    hashAlgoObserved: 'bcrypt (bcryptjs) cost 10',  // [V] from controller/authController.js
    hashClass:        'WEAK',                        // bcrypt < 12 → Task 2 WEAK → forced reset

    // Auth roles only (user_roles.role). Domain fields like founder/cofounder/owner/auth
    // are data-model values, NOT auth roles — see RBAC.md.
    roleMap: {
      user:      'member',    // [V]
      admin:     'admin',     // [V]
      moderator: 'manager',   // [S] CONFIRM — could be 'editor'; see RBAC.md
    },

    // Task 4 — org mapping. NOT decided automatically. See ORG-MAPPING.md.
    org: { strategy: 'one-org-per-island', orgName: 'Elite Circle', confirmed: false },
  },

  // insiders / law-elite / trade-service specs are added when their batches start.
};

export function getIsland(name) {
  const spec = ISLANDS[name];
  if (!spec) throw new Error(`Unknown island '${name}'. Known: ${Object.keys(ISLANDS).join(', ')}`);
  return spec;
}
