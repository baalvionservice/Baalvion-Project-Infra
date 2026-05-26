/**
 * @fileOverview Next.js Bootstrapper
 * This file satisfies the environment's entry point requirement while 
 * correctly proxying startup to the Next.js dev server.
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

console.log(`[SYSTEM] Initializing Law Elite Network Dashboard...`);
console.log(`[SYSTEM] Target: http://${host}:${port}`);

/**
 * We use 'npx next dev' to ensure the local project binary is 
 * used even if the global environment path is incomplete.
 */
const nextProcess = spawn('npx', ['next', 'dev', '-p', port, '-H', host], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
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
