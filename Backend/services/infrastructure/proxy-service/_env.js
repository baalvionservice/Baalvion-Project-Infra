'use strict';

// Test bootstrap — required FIRST by every unit test that transitively loads
// config/appConfig.js (or a service module that does). That config fail-louds
// when JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / BILLING_SIGNING_SECRET are unset
// (a deliberate "refuse to boot insecure" guard). Locally dotenv reads the dev
// .env so the secrets are present; CI has no .env, so the config throws on import
// and the whole node:test suite exits non-zero.
//
// These are pure unit tests (no real HTTP/DB) that sign and verify with the same
// process-local secret, so deterministic dummies are sufficient. dotenv does not
// override an already-set process.env value, so a real local .env still wins.
//
// Placed at the service root (not under test/) so `node --test` does not discover
// it as a test file.
const setDefault = (name, value) => {
    process.env[name] = process.env[name] || value;
};

setDefault('JWT_ACCESS_SECRET', 'test-only-access-secret');
setDefault('JWT_REFRESH_SECRET', 'test-only-refresh-secret');
setDefault('BILLING_SIGNING_SECRET', 'test-only-billing-signing-secret');

module.exports = {};
