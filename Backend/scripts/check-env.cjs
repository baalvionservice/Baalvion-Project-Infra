#!/usr/bin/env node
'use strict';
/**
 * Commerce/admin launch environment verification.
 *
 * Checks each service's effective env (its .env file, falling back to process.env) for the
 * REQUIRED vars (boot guards) and RECOMMENDED vars (production hardening). Exits non-zero if any
 * REQUIRED var is missing, so it can gate a deploy.
 *
 *   node Backend/scripts/check-env.cjs                 # all launch services
 *   node Backend/scripts/check-env.cjs order-service   # one service
 *
 * This is the single source of truth for "what must be set before launch" referenced by the
 * runbooks (docs/runbooks/) and the launch-readiness report.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// service → { dir, required[], recommended[] }. CROSS-SERVICE invariants are noted in comments.
const MANIFEST = {
    'commerce-service': {
        dir: 'Backend/services/commerce/commerce-service',
        required: ['JWT_PUBLIC_KEY', 'DB_HOST', 'DB_NAME', 'DB_USER'],
        recommended: ['REDIS_HOST', 'RBAC_BASE_URL', 'MEDIA_DRIVER'],
    },
    'order-service': {
        dir: 'Backend/services/commerce/order-service',
        required: ['JWT_PUBLIC_KEY', 'DB_HOST', 'DB_NAME', 'DB_USER'],
        // LEDGER_INTERNAL_KEY must equal ledger-service's; CART_SESSION_SECRET enables guest carts.
        recommended: ['REDIS_HOST', 'CART_SESSION_SECRET', 'LEDGER_INTERNAL_KEY', 'RBAC_BASE_URL', 'INTERNAL_SERVICE_SECRET'],
    },
    'inventory-service': {
        dir: 'Backend/services/commerce/inventory-service',
        required: ['JWT_PUBLIC_KEY', 'DB_HOST', 'DB_NAME', 'DB_USER'],
        recommended: ['REDIS_HOST', 'RBAC_BASE_URL'],
    },
    'ledger-service': {
        dir: 'Backend/services/commerce/ledger-service',
        required: ['JWT_PUBLIC_KEY', 'DB_HOST', 'DB_NAME'],
        // LEDGER_INTERNAL_KEY must equal order-service's for service-to-service posting.
        recommended: ['LEDGER_INTERNAL_KEY', 'REDIS_HOST'],
    },
    'payment-service': {
        dir: 'Backend/services/commerce/payment-service',
        required: ['JWT_PUBLIC_KEY', 'DB_HOST', 'DB_NAME'],
        recommended: ['INTERNAL_SERVICE_SECRET'],
    },
    'rbac-service': {
        dir: 'Backend/services/identity/rbac-service',
        required: ['JWT_PUBLIC_KEY', 'DB_HOST', 'DB_NAME'],
        recommended: [],
    },
    'audit-service': {
        dir: 'Backend/services/infrastructure/audit-service',
        required: ['DB_HOST', 'DB_NAME'],
        recommended: ['REDIS_HOST', 'INTERNAL_SERVICE_SECRET'],
    },
    'notification-service': {
        dir: 'Backend/services/infrastructure/notification-service',
        required: ['JWT_PUBLIC_KEY', 'DB_HOST', 'DB_NAME'],
        recommended: ['REDIS_HOST', 'INTERNAL_SERVICE_SECRET'],
    },
};

function parseEnvFile(file) {
    if (!fs.existsSync(file)) return {};
    const out = {};
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (m && !line.trim().startsWith('#')) out[m[1]] = m[2];
    }
    return out;
}

// A var is "set" if non-empty in the service .env OR in the current process environment.
function valueOf(env, key) {
    const v = env[key] != null && env[key] !== '' ? env[key] : process.env[key];
    return v != null && String(v).trim() !== '' ? v : null;
}

function checkService(name, spec) {
    const env = parseEnvFile(path.join(ROOT, spec.dir, '.env'));
    const missingRequired = spec.required.filter((k) => !valueOf(env, k));
    const missingRecommended = spec.recommended.filter((k) => !valueOf(env, k));
    return { name, missingRequired, missingRecommended };
}

const targets = process.argv.slice(2);
const services = targets.length ? targets : Object.keys(MANIFEST);

let hadError = false;
const crossWarnings = [];
console.log('Commerce/admin launch env check\n' + '='.repeat(40));
for (const name of services) {
    const spec = MANIFEST[name];
    if (!spec) { console.log(`?  ${name}: unknown service`); continue; }
    const { missingRequired, missingRecommended } = checkService(name, spec);
    if (missingRequired.length === 0 && missingRecommended.length === 0) {
        console.log(`OK ${name}`);
    } else {
        if (missingRequired.length) { hadError = true; console.log(`X  ${name}: MISSING REQUIRED ${missingRequired.join(', ')}`); }
        if (missingRecommended.length) console.log(`!  ${name}: missing recommended ${missingRecommended.join(', ')}`);
    }
}

// Cross-service invariant: ledger key must be shared (both set or both unset).
const orderEnv = parseEnvFile(path.join(ROOT, MANIFEST['order-service'].dir, '.env'));
const ledgerEnv = parseEnvFile(path.join(ROOT, MANIFEST['ledger-service'].dir, '.env'));
const orderKey = valueOf(orderEnv, 'LEDGER_INTERNAL_KEY');
const ledgerKey = valueOf(ledgerEnv, 'LEDGER_INTERNAL_KEY');
if ((orderKey || ledgerKey) && orderKey !== ledgerKey) {
    crossWarnings.push('LEDGER_INTERNAL_KEY differs between order-service and ledger-service — ledger posting will be rejected.');
}
if (crossWarnings.length) {
    console.log('\nCross-service warnings:');
    crossWarnings.forEach((w) => console.log(`!  ${w}`));
}

console.log('='.repeat(40));
console.log(hadError ? 'RESULT: FAIL (required vars missing)' : 'RESULT: OK');
process.exit(hadError ? 1 : 0);
