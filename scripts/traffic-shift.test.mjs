// node --test scripts/traffic-shift.test.mjs
//
// Renders against the REAL deploy/consolidated/caddy/Caddyfile, not a fixture, so a
// route added by hand that this script cannot rewrite fails here rather than on the box.
// The `caddy validate` cases need Docker; they skip without it rather than pass silently.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { DEFAULT_CADDYFILE, PROBE, renderCaddyfile } from './traffic-shift.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASELINE = fs.readFileSync(DEFAULT_CADDYFILE, 'utf8');

// Every upstream host the Caddyfile actually routes to, and how many routes each owns.
const ROUTES = BASELINE.split('\n').reduce((acc, l) => {
  const m = /^[ \t]*reverse_proxy[ \t]+([A-Za-z0-9_.-]+):\d+[ \t]*\{?[ \t]*$/.exec(l);
  if (m) acc[m[1]] = (acc[m[1]] || 0) + 1;
  return acc;
}, {});

const hasDocker = spawnSync('docker', ['version', '--format', '{{.Server.Version}}']).status === 0;
const CADDY_IMAGE = process.env.BG_CADDY_IMAGE || 'caddy:2-alpine';

function validates(text) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bg-'));
  fs.writeFileSync(path.join(dir, 'Caddyfile'), text);
  const r = spawnSync('docker', ['run', '--rm', '-v', `${dir}:/w:ro`, CADDY_IMAGE,
    'caddy', 'validate', '--config', '/w/Caddyfile', '--adapter', 'caddyfile'], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return { ok: r.status === 0, why: (r.stderr || '').split('\n').filter((l) => !l.startsWith('{')).join('\n').trim() };
}

// Counts real directives only. A plain substring match also hits the comment block
// at the foot of the file that lists example routes, which inflated these by one.
const upstreams = (text, host) => text.split('\n')
  .filter((l) => new RegExp(`^[ \\t]*reverse_proxy[ \\t]+${host}:\\d+([ \\t]|$)`).test(l)).length;

test('0% restores the file byte-for-byte', () => {
  for (const svc of Object.keys(PROBE)) {
    if (upstreams(BASELINE, svc) === 0) continue;
    assert.equal(renderCaddyfile(BASELINE, svc, 0).text, BASELINE, `${svc} at 0% is not a no-op`);
  }
});

test('the regex covers every reverse_proxy directive in the file', () => {
  const directives = BASELINE.split('\n').filter((l) => /^[ \t]*reverse_proxy\b/.test(l));
  const covered = Object.keys(ROUTES).reduce((n, k) => n + ROUTES[k], 0);
  assert.equal(covered, directives.length,
    'a route uses a reverse_proxy form renderCaddyfile would silently skip');
});

test('the per-service route counts are what the design assumes', () => {
  assert.deepEqual(ROUTES, {
    'app-platform': 16,
    'app-commerce': 10,
    'app-ecosystem': 9,
    'app-identity': 7,
    'app-edge-realtime': 4,
    'app-community': 2,
    'app-gti-web': 2,
    'admin-web': 1,
    'app-auth-web': 1,
    'app-payments': 1,
    'app-giftcard': 1,
    nodebb: 1,
  });
});

test('app-trade has no edge route, so it cannot be canaried by traffic shift', () => {
  // Nothing in the Caddyfile proxies to app-trade — the only mention is the example
  // comment at the foot of the file. If that changes, revisit: app-trade also runs an
  // unlocked outbox publisher, so it is on the UNSAFE list in canary-rollout.mjs.
  assert.equal(upstreams(BASELINE, 'app-trade'), 0);
  assert.throws(() => renderCaddyfile(BASELINE, 'app-trade', 5), /no "reverse_proxy app-trade/);
});

test('a partial split emits weighted_round_robin with the complement weight', () => {
  const { text, routes } = renderCaddyfile(BASELINE, 'app-platform', 5);
  assert.equal(routes, upstreams(BASELINE, 'app-platform'));
  const weights = text.match(/lb_policy weighted_round_robin \d+ \d+/g) || [];
  assert.equal(weights.length, routes);
  for (const w of weights) assert.equal(w, 'lb_policy weighted_round_robin 95 5');
  assert.equal(upstreams(text, 'app-platform'), routes);  // blue still first on every line
  assert.equal((text.match(/app-platform-green:\d+/g) || []).length, routes);
});

test('100% points every route at green and none at blue', () => {
  const { text } = renderCaddyfile(BASELINE, 'app-identity', 100);
  assert.equal(text.includes('reverse_proxy app-identity:'), false);
  assert.equal(upstreams(text, 'app-identity-green'), ROUTES['app-identity']);
  assert.equal(text.includes('lb_policy'), false);
});

test('only the named service moves', () => {
  const { text } = renderCaddyfile(BASELINE, 'app-platform', 25);
  for (const other of ['app-identity', 'app-commerce', 'app-ecosystem', 'app-edge-realtime', 'admin-web']) {
    assert.equal(upstreams(text, other), upstreams(BASELINE, other), `${other} was disturbed`);
    assert.equal(text.includes(`${other}-green`), false, `${other}-green leaked in`);
  }
});

test('a directive that already opens a block keeps its body', () => {
  // ships.baalvion.com proxies app-gti-web:9003 with a header_down block.
  const { text } = renderCaddyfile(BASELINE, 'app-gti-web', 10);
  assert.match(text, /reverse_proxy app-gti-web:9003 app-gti-web-green:9003 \{\n\t{3}lb_policy weighted_round_robin 90 10\n/);
  assert.ok(text.includes('header_down Cache-Control "private, no-store"'), 'header_down was dropped');
  assert.ok(text.includes('header_down Vary "Accept-Encoding"'), 'header_down was dropped');
  // No stray brace: the counts must still balance.
  assert.equal((text.match(/\{/g) || []).length, (text.match(/\}/g) || []).length);
});

test('rendering on top of an already-shifted file is refused', () => {
  const once = renderCaddyfile(BASELINE, 'app-platform', 5).text;
  assert.throws(() => renderCaddyfile(once, 'app-platform', 25), /not a clean baseline/);
});

test('bad input is refused rather than guessed at', () => {
  assert.throws(() => renderCaddyfile(BASELINE, 'app-platform', 5.5), /integer 0-100/);
  assert.throws(() => renderCaddyfile(BASELINE, 'app-platform', 101), /integer 0-100/);
  assert.throws(() => renderCaddyfile(BASELINE, 'app-platform', -1), /integer 0-100/);
  assert.throws(() => renderCaddyfile(BASELINE, 'app-nonexistent', 5), /no "reverse_proxy app-nonexistent/);
});

test('a multi-upstream route is refused, not silently skipped', () => {
  const hacked = BASELINE.replace('reverse_proxy app-platform:3045', 'reverse_proxy app-platform:3045 app-platform:3046');
  assert.throws(() => renderCaddyfile(hacked, 'app-platform', 5), /form this script does not handle/);
});

test('the tracked Caddyfile adapts', { skip: !hasDocker && 'docker unavailable' }, () => {
  const r = validates(BASELINE);
  assert.ok(r.ok, `the committed Caddyfile does not adapt:\n${r.why}`);
});

test('every rendered split adapts', { skip: !hasDocker && 'docker unavailable' }, () => {
  for (const svc of ['app-platform', 'app-identity', 'app-commerce', 'admin-web', 'app-gti-web']) {
    for (const pct of [0, 1, 5, 25, 50, 99, 100]) {
      const r = validates(renderCaddyfile(BASELINE, svc, pct).text);
      assert.ok(r.ok, `${svc} @ ${pct}% does not adapt:\n${r.why}`);
    }
  }
});

test('the compose overlay defines a green (and a probe port) for every probed service', () => {
  const overlay = fs.readFileSync(path.join(HERE, '../deploy/consolidated/docker-compose.bluegreen.yml'), 'utf8');
  for (const [svc, p] of Object.entries(PROBE)) {
    assert.ok(overlay.includes(`${svc}-green:`), `no ${svc}-green service in the overlay`);
    assert.ok(overlay.includes(`profiles: ["bg-${svc}"]`), `no bg-${svc} profile`);
    assert.ok(overlay.includes(`"127.0.0.1:${p.port}:`), `probe port ${p.port} for ${svc} is not published`);
  }
});
