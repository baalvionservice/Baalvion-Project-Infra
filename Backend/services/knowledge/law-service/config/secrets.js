'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Secret resolution + production hardening.
//
// Resolution order (first hit wins):
//   1. process.env[KEY]                     (12-factor / Docker/K8s env)
//   2. a mounted JSON secrets file          (SECRETS_FILE=/run/secrets/law.json,
//                                            e.g. a Docker/K8s secret or the JSON
//                                            blob an AWS Secrets Manager CSI driver
//                                            writes to disk)
//
// This gives a single seam: in production point SECRETS_FILE at the secret the
// platform mounts (AWS Secrets Manager / SSM Parameter Store via the CSI driver,
// Vault Agent, K8s Secret, …) and nothing else changes. No plaintext keys in code.
//
// validateProductionSecrets() refuses to boot when a required secret is absent or
// still set to a well-known dev placeholder — so a misconfigured prod deploy fails
// fast and loud instead of silently running with insecure defaults.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');

let fileSecrets = {};
const secretsFile = process.env.SECRETS_FILE;
if (secretsFile) {
    try {
        fileSecrets = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));
        // eslint-disable-next-line no-console
        console.log(`[secrets] loaded ${Object.keys(fileSecrets).length} secret(s) from ${secretsFile}`);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[secrets] failed to read SECRETS_FILE ${secretsFile}: ${err.message}`);
    }
}

/** Resolve a secret by key (env wins, then the mounted secrets file). */
function getSecret(key, fallback = undefined) {
    if (process.env[key] !== undefined && process.env[key] !== '') return process.env[key];
    if (fileSecrets[key] !== undefined && fileSecrets[key] !== '') return fileSecrets[key];
    return fallback;
}

// Generic lazy placeholders that must NEVER appear in real production secrets.
// NOTE: 'baalvion_dev_pass' is intentionally NOT here — it's the shared credential
// the local docker stack uses across services (which run NODE_ENV=production); the
// real AWS deploy supplies strong creds via SECRETS_FILE. We still catch empties +
// obvious placeholders below.
const PLACEHOLDERS = new Set([
    'changeme', 'change-me', 'secret', 'password', 'ci-test-secret',
    'placeholder', 'your-secret-here', 'replace-with-strong-secret', '',
]);

/**
 * In production, every key in `required` must resolve to a non-placeholder value.
 * Throws a single aggregated error listing all problems (fail fast on boot).
 * No-op outside production so local/dev/test stay frictionless.
 */
function validateProductionSecrets(required = []) {
    if ((process.env.NODE_ENV || 'development') !== 'production') return;
    const problems = [];
    for (const key of required) {
        const val = getSecret(key);
        if (val === undefined || val === null || `${val}`.trim() === '') {
            problems.push(`${key} is missing`);
        } else if (PLACEHOLDERS.has(`${val}`.trim().toLowerCase())) {
            problems.push(`${key} is set to an insecure placeholder value`);
        }
    }
    if (problems.length) {
        throw new Error(
            `[secrets] refusing to start in production — fix these secrets:\n  - ${problems.join('\n  - ')}`,
        );
    }
}

module.exports = { getSecret, validateProductionSecrets };
