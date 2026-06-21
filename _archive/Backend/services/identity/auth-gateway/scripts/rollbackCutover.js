'use strict';
/**
 * Phase 6E-7 STEP 9 — rollback guarantee. READ-ONLY (never modifies .env files).
 *
 * Prints the exact environment variable changes needed to fully restore the system
 * to pre-cutover hybrid mode in < 30 seconds.
 *
 * Rollback vars (set ALL before restarting):
 *   ISLAND_AUTH_MODE=hybrid            (elite-circle-service, insiders-service, trade-service)
 *   BFF_ENFORCEMENT_MODE=hybrid        (auth-gateway)
 *   HS256_ISSUANCE_ENABLED=true        (elite-circle-service, insiders-service, trade-service)
 *   BURN_IN_MODE=true                  (auth-gateway, keep observation ON)
 *
 * Flags:
 *   --verify   Read current .env files and report active vs rollback state (no writes).
 *   (no flag)  Print rollback instructions + PowerShell one-liner.
 *
 * Usage:
 *   node scripts/rollbackCutover.js             # print rollback plan
 *   node scripts/rollbackCutover.js --verify    # inspect current env state
 *
 * IMPORTANT: This script NEVER writes to .env files or modifies any configuration.
 *            It only reads and prints. The operator must apply the changes manually.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const REPO_ROOT  = path.join(__dirname, '../../../..');   // d:/Baalvion Projects/Backend
const VERIFY     = process.argv.includes('--verify');

// ---- service registry ----

const SERVICES = [
  {
    name: 'auth-gateway',
    envPath: path.join(__dirname, '../.env'),
    port: 3099,
    rollback: {
      BFF_ENFORCEMENT_MODE: 'hybrid',
      BURN_IN_MODE: 'true',
      // HS256_ISSUANCE_ENABLED is not a gateway var — gateway doesn't issue HS256
    },
    note: 'Restart: node index.js (or pm2 restart auth-gateway)',
  },
  {
    name: 'elite-circle-service',
    envPath: path.join(REPO_ROOT, 'services/ecosystem/elite-circle-service/.env'),
    port: 3051,
    rollback: {
      ISLAND_AUTH_MODE: 'hybrid',
      HS256_ISSUANCE_ENABLED: 'true',
    },
    note: 'Restart: node index.js (or pm2 restart elite-circle-service)',
  },
  {
    name: 'insiders-service',
    envPath: path.join(REPO_ROOT, 'services/ecosystem/insiders-service/.env'),
    port: 3050,
    rollback: {
      ISLAND_AUTH_MODE: 'hybrid',
      HS256_ISSUANCE_ENABLED: 'true',
    },
    note: 'Restart: node index.js (or pm2 restart insiders-service)',
  },
  {
    name: 'trade-service',
    envPath: path.join(REPO_ROOT, 'services/commerce/trade-service/.env'),
    port: 3025,
    rollback: {
      ISLAND_AUTH_MODE: 'hybrid',
      HS256_ISSUANCE_ENABLED: 'true',
    },
    note: 'Restart: node index.js (or pm2 restart trade-service)',
  },
];

// ---- helpers ----

function readEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    const vars = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      vars[k] = v;
    }
    return vars;
  } catch { return null; }
}

function inspect(svc, vars) {
  const checks = {};
  for (const [k, targetVal] of Object.entries(svc.rollback)) {
    const current = vars ? (vars[k] || '(not set)') : '(file missing)';
    checks[k] = {
      current,
      rollback_value: targetVal,
      needs_change: current !== targetVal,
    };
  }
  return checks;
}

// ---- --verify mode ----

if (VERIFY) {
  const results = [];
  let anyNeedsChange = false;

  for (const svc of SERVICES) {
    const vars   = readEnvFile(svc.envPath);
    const checks = inspect(svc, vars);
    const needsChange = Object.values(checks).some((c) => c.needs_change);
    if (needsChange) anyNeedsChange = true;
    results.push({
      service: svc.name,
      env_file: svc.envPath,
      env_file_found: vars !== null,
      port: svc.port,
      checks,
      needs_change: needsChange,
    });
  }

  const summary = {
    tool: 'rollbackCutover',
    mode: 'VERIFY',
    generated_at: new Date().toISOString(),
    rollback_needed: anyNeedsChange,
    verdict: anyNeedsChange
      ? 'ONE OR MORE SERVICES ARE IN CUTOVER STATE — apply rollback vars + restart to restore hybrid mode'
      : 'ALL SERVICES ALREADY IN HYBRID MODE — rollback not required',
    services: results,
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

// ---- print rollback plan ----

const plan = {
  tool: 'rollbackCutover',
  mode: 'ROLLBACK_PLAN',
  generated_at: new Date().toISOString(),
  read_only: true,
  warning: 'This script NEVER modifies .env files. Apply all changes below manually, then restart each service.',
  target_state: {
    ISLAND_AUTH_MODE: 'hybrid    (allows HS256 bearer fallback — full compatibility restored)',
    BFF_ENFORCEMENT_MODE: 'hybrid    (gateway cookie sessions accepted but HS256 bearer fallback enabled)',
    HS256_ISSUANCE_ENABLED: 'true      (allow islands to issue HS256 tokens again)',
    BURN_IN_MODE: 'true      (keep observability ON — do not disable)',
  },
  estimated_restore_time: '< 30 seconds after all services restarted',
  services: [],
};

for (const svc of SERVICES) {
  const entry = {
    service: svc.name,
    env_file: svc.envPath,
    port: svc.port,
    changes_required: {},
    restart_command: svc.note,
  };
  for (const [k, v] of Object.entries(svc.rollback)) {
    entry.changes_required[k] = v;
  }
  plan.services.push(entry);
}

// PowerShell one-liner (sed-style inline replacements via PowerShell)
// Print as a human-readable checklist — do NOT generate auto-apply commands.
plan.manual_steps = [
  '1. Open each .env file listed above in your editor.',
  '2. Set the exact key=value pairs shown in changes_required for each service.',
  '3. Restart each service (in order: elite-circle-service → insiders-service → trade-service → auth-gateway).',
  '4. Verify: node scripts/rollbackCutover.js --verify   (all checks should show needs_change: false)',
  '5. Verify: node scripts/cutoverReport.js              (FINAL_STATUS should return to NOT_YET)',
  '6. Verify: node scripts/burnInReport.js               (burn-in metrics should resume normally)',
];

plan.quick_verify_commands = [
  'node scripts/rollbackCutover.js --verify',
  'node scripts/cutoverReport.js',
  'node scripts/burnInReport.js',
];

plan.rollback_complete_when = [
  'rollbackCutover.js --verify: ALL needs_change = false',
  'cutoverReport.js: FINAL_STATUS = NOT_YET',
  'No new login failures in /health or authTrace counters',
  'All islands responding on their ports (3025, 3050, 3051)',
];

console.log(JSON.stringify(plan, null, 2));
process.exit(0);
