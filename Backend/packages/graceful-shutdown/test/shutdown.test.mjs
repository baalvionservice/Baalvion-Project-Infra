import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
const mod = createRequire(import.meta.url)('../index.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, 'fixtures', 'server.cjs');

test('exposes registerShutdown + initGracefulShutdown', () => {
  assert.strictEqual(typeof mod.registerShutdown, 'function');
  assert.strictEqual(typeof mod.initGracefulShutdown, 'function');
});

test('drains HTTP, runs all registered handlers, and exits 0 on termination', async () => {
  const child = spawn(process.execPath, [fixture], { stdio: ['pipe', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d.toString(); });
  child.stderr.on('data', (d) => { out += d.toString(); });

  // Wait for the server to be listening before triggering shutdown.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('fixture did not start in time')), 5000);
    child.stdout.on('data', () => {
      if (out.includes('LISTENING')) { clearTimeout(timer); resolve(); }
    });
  });

  child.stdin.write('go\n');

  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('did not exit in time')); }, 8000);
    child.on('exit', (c) => { clearTimeout(timer); resolve(c); });
  });

  assert.strictEqual(code, 0, `clean exit expected, got ${code}; output:\n${out}`);
  assert.match(out, /CLEAN:handler-a/, 'handler-a cleanup ran');
  assert.match(out, /CLEAN:handler-b/, 'handler-b cleanup ran');
  assert.match(out, /HTTP server closed/, 'HTTP server was drained before exit');
});
