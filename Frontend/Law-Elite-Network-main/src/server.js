/**
 * @fileOverview Next.js Bootstrapper
 * This file satisfies the environment's entry point requirement while
 * correctly proxying startup to the Next.js PRODUCTION server.
 *
 * Customer-facing launch posture: this serves a prebuilt `.next/` via
 * `next start` in production mode. Run `next build` before starting (the
 * deploy/start pipeline handles this). It does NOT run a dev/HMR server.
 */

const { spawn } = require('child_process');
const path = require('path');

// Extract port and host from command line arguments provided by the runner
const args = process.argv.slice(2);
let port = '9002';
let host = '0.0.0.0';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = args[i + 1];
  } else if (args[i] === '--hostname' && args[i + 1]) {
    host = args[i + 1];
  }
}

console.log(`[SYSTEM] Initializing Law Elite Network Dashboard (production)...`);
console.log(`[SYSTEM] Target: http://${host}:${port}`);

/**
 * We use the local Next binary in production mode (`next start`) so customers
 * are served the optimized build, never the dev server.
 */
const nextProcess = spawn('npx', ['next', 'start', '-p', port, '-H', host], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1'
  }
});

nextProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`[SYSTEM] Next.js process exited with code ${code}`);
  }
  process.exit(code || 0);
});

nextProcess.on('error', (err) => {
  console.error('[SYSTEM] Failed to start Next.js process:', err);
  process.exit(1);
});
