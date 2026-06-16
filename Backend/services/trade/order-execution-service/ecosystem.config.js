// pm2 process definition for order-execution-service (production-on-host).
//
// This service fail-fasts under production unless real (non-dev-default)
// FINANCE_WEBHOOK_SECRET / INTERNAL_SERVICE_SECRET / GATEWAY_SIGNING_SECRET are
// present — by design (a guessable default is a service-impersonation vector).
// We inject the SAME fleet-wide secrets the root ecosystem.config.js uses, read
// from the gitignored root secrets file, so this service boots in production with
// secrets consistent across the fleet. Generate them with start-prod.ps1 (or the
// root config auto-generates them on first `pm2 start`).
const path = require('path');
const fs = require('fs');

function loadFleetSecrets() {
  const file = path.join(__dirname, '..', '..', '..', '..', 'secrets', 'fleet.prod.env');
  const out = {};
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    /* file absent — service .env / orchestrator must supply secrets */
  }
  return out;
}

const SHARED = loadFleetSecrets();

module.exports = {
  apps: [
    {
      name: 'order-execution-service',
      script: 'index.js',
      cwd: __dirname,
      // Production posture with fleet-consistent secrets. The orchestrator/secret
      // manager may override these with deployment values.
      env: { NODE_ENV: 'production', PORT: 3052, ...SHARED },
      autorestart: true,
      max_restarts: 15,
      min_uptime: 10000,
      exp_backoff_restart_delay: 250,
      kill_timeout: 8000,
    },
  ],
};
