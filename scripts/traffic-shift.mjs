#!/usr/bin/env node
// Move a percentage of one service's edge traffic onto its green container.
//
// The Caddyfile routes every upstream as a single `reverse_proxy <service>:<port>`.
// This rewrites the lines belonging to ONE service into Caddy's weighted form:
//
//     reverse_proxy app-platform:3018 app-platform-green:3018 {
//         lb_policy weighted_round_robin 95 5
//         fail_duration 30s
//         max_fails 3
//     }
//
// and then `caddy reload`s, which swaps the config in place without dropping a
// connection. All of a service's ports move together — they are one container,
// so splitting them would send a browser's CMS read and its admin write to
// different colours.
//
//   node scripts/traffic-shift.mjs --service app-platform --percent 5
//   node scripts/traffic-shift.mjs --service app-platform --percent 0    # abort
//
// Options:
//   --service NAME    compose service to shift (required)
//   --percent N       0-100 share of requests for green (required)
//   --caddyfile PATH  default deploy/consolidated/caddy/Caddyfile
//   --container NAME  running Caddy container (default consolidated-caddy-1)
//   --skip-health     shift without probing green first (do not use for a real roll)
//   --dry-run         print the rendered Caddyfile and exit; touches nothing
//
// 0 and 100 render the plain single-upstream form, so a finished or aborted
// rollout leaves the Caddyfile byte-identical to the tracked one.
//
// Exits 0 only when Caddy is serving the requested split.

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

export const DEFAULT_CADDYFILE = path.join(REPO, 'deploy/consolidated/caddy/Caddyfile');
export const DEFAULT_CONTAINER = process.env.BG_CADDY_CONTAINER || 'consolidated-caddy-1';

// Passive health checking only. Active checks (health_uri) would apply to BOTH
// upstreams in the handler, and not every port behind these routes answers
// /health — cms-service on 3018 does not — so an active check would mark blue
// unhealthy too and take the route down. Passive counts transport failures only:
// a green that stops listening drains out after max_fails and stays out for
// fail_duration. Measured locally: killing a green carrying 25% cost 3 failed
// requests out of 200 before Caddy stopped selecting it.
const LB_FAIL_DURATION = process.env.BG_FAIL_DURATION || '30s';
const LB_MAX_FAILS = process.env.BG_MAX_FAILS || '3';

// Loopback probe ports published by docker-compose.bluegreen.yml. Keyed by
// service; the port is the one that service's compose healthcheck already uses.
export const PROBE = {
  'app-identity': { port: 19001, path: '/health', expect: '200' },
  'app-commerce': { port: 19012, path: '/health', expect: '200' },
  'app-trade': { port: 19048, path: '/health', expect: '200' },
  'app-ecosystem': { port: 19008, path: '/health', expect: '200' },
  'app-platform': { port: 19021, path: '/health', expect: '200' },
  'app-edge-realtime': { port: 19004, path: '/health', expect: '200' },
  // Next.js standalone has no /health route; its compose healthcheck accepts
  // anything under 500 on /, so the probe matches that rather than inventing one.
  'admin-web': { port: 19030, path: '/', expect: '200,204,307,308,404' },
  'app-auth-web': { port: 19055, path: '/', expect: '200,204,307,308,404' },
};

export const probeUrl = (service) => {
  const p = PROBE[service];
  if (!p) throw new Error(`no probe port defined for "${service}" — add one to PROBE and to docker-compose.bluegreen.yml`);
  return `http://127.0.0.1:${p.port}${p.path}`;
};

// ── rendering ────────────────────────────────────────────────────────────────

// Matches a whole reverse_proxy directive with exactly one simple upstream,
// optionally opening a block. Anything richer is refused rather than guessed at.
const DIRECTIVE = /^([ \t]*)reverse_proxy[ \t]+([A-Za-z0-9_.-]+):(\d+)[ \t]*(\{)?[ \t]*$/;

/**
 * Rewrite every `reverse_proxy <service>:<port>` in `baseline` for the given split.
 * Pure — takes and returns text, reads nothing.
 */
export function renderCaddyfile(baseline, service, percent) {
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new Error(`--percent must be an integer 0-100, got ${percent}`);
  }
  const green = `${service}-green`;
  const lines = baseline.split('\n');
  const out = [];
  let rewritten = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // A baseline that already carries a split means the file was hand-edited or a
    // previous run died mid-flight. Refuse: rendering on top of it would double up.
    if (line.includes(`${green}:`)) {
      throw new Error(
        `line ${i + 1} already references ${green} — the Caddyfile is not a clean baseline.\n` +
          `Restore it (git checkout the file, or use .bluegreen/baseline.Caddyfile) before shifting.`,
      );
    }

    const m = DIRECTIVE.exec(line);
    if (!m || m[2] !== service) {
      // Catch the case we cannot safely rewrite: the service appears on a
      // reverse_proxy line that is not the simple single-upstream form.
      if (!m && /^[ \t]*reverse_proxy\b/.test(line) && line.includes(`${service}:`)) {
        throw new Error(
          `line ${i + 1} proxies to ${service} in a form this script does not handle:\n` +
            `  ${line.trim()}\n` +
            `Only a single bare upstream is supported. Shift it by hand or simplify the route.`,
        );
      }
      out.push(line);
      continue;
    }

    const [, indent, , port, brace] = m;
    rewritten += 1;

    if (percent === 0) { out.push(`${indent}reverse_proxy ${service}:${port}${brace ? ' {' : ''}`); continue; }
    if (percent === 100) { out.push(`${indent}reverse_proxy ${green}:${port}${brace ? ' {' : ''}`); continue; }

    const inner = `${indent}\t`;
    out.push(`${indent}reverse_proxy ${service}:${port} ${green}:${port} {`);
    out.push(`${inner}lb_policy weighted_round_robin ${100 - percent} ${percent}`);
    out.push(`${inner}fail_duration ${LB_FAIL_DURATION}`);
    out.push(`${inner}max_fails ${LB_MAX_FAILS}`);
    // The directive already had a block (header_down and friends); keep its body
    // and let the closing brace that follows in the baseline close ours too.
    if (!brace) out.push(`${indent}}`);
  }

  if (!rewritten) {
    throw new Error(`no "reverse_proxy ${service}:<port>" upstreams found in the Caddyfile — is the service name right?`);
  }
  return { text: out.join('\n'), routes: rewritten };
}

// ── state ────────────────────────────────────────────────────────────────────

export const stateDir = (caddyfile) => path.join(path.dirname(caddyfile), '.bluegreen');
const baselinePath = (caddyfile) => path.join(stateDir(caddyfile), 'baseline.Caddyfile');
const candidatePath = (caddyfile) => path.join(stateDir(caddyfile), 'candidate.Caddyfile');
const statePath = (caddyfile) => path.join(stateDir(caddyfile), 'state.json');

export const readState = (caddyfile) => {
  try { return JSON.parse(fs.readFileSync(statePath(caddyfile), 'utf8')); } catch { return null; }
};

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

// ── docker ───────────────────────────────────────────────────────────────────

const docker = (args, opts = {}) =>
  spawnSync('docker', args, { encoding: 'utf8', ...opts });

function assertDocker() {
  const r = docker(['version', '--format', '{{.Server.Version}}']);
  if (r.status !== 0) throw new Error('docker is not usable from here — this script runs ON the box, not from a laptop.');
}

function caddyImage(container) {
  const r = docker(['inspect', '-f', '{{.Config.Image}}', container]);
  if (r.status !== 0) throw new Error(`Caddy container "${container}" not found. Pass --container, or set BG_CADDY_CONTAINER.`);
  return r.stdout.trim();
}

/**
 * The Caddyfile is a single-FILE bind mount, so `git pull` on the box replaces its
 * inode and the running container keeps reading the OLD one. Writing the host file
 * and reloading would then silently reload stale content — the shift would appear to
 * succeed and no traffic would move. Compare digests and refuse rather than guess.
 */
const RECREATE_CADDY =
  'Recreate Caddy first, then retry:\n'
  + '  docker compose --env-file .env -f docker-compose.prod.yml up -d --no-deps --force-recreate caddy';

function assertContainerSeesFile(container, caddyfile) {
  const host = sha(fs.readFileSync(caddyfile));
  const r = docker(['exec', container, 'sha256sum', '/etc/caddy/Caddyfile']);
  // Replacing the host file leaves the mount dangling, so the read fails outright.
  // Same cause, same fix as a digest mismatch.
  if (r.status !== 0) {
    throw new Error(
      `${container} cannot read /etc/caddy/Caddyfile: ${(r.stderr || r.stdout).trim()}\n`
      + `Its bind mount points at an inode that no longer exists — something replaced the file\n`
      + `on disk (git pull, mv, sed -i all do this to a single-file mount).\n${RECREATE_CADDY}`,
    );
  }
  const inside = r.stdout.trim().split(/\s+/)[0];
  if (inside !== host) {
    throw new Error(
      `${container} is serving a DIFFERENT Caddyfile than the one on disk.\n`
      + `  on disk: ${host.slice(0, 12)}\n  in container: ${inside.slice(0, 12)}\n`
      + `The single-file bind mount is pinned to a replaced inode (a git pull does this).\n`
      + `Writing the host file and reloading would silently reload the stale one.\n${RECREATE_CADDY}`,
    );
  }
}

function validateCandidate(container, caddyfile, text) {
  fs.mkdirSync(stateDir(caddyfile), { recursive: true });
  fs.writeFileSync(candidatePath(caddyfile), text);
  const dir = path.dirname(caddyfile);
  const rel = path.relative(dir, candidatePath(caddyfile));
  const r = docker(['run', '--rm', '-v', `${dir}:/w:ro`, caddyImage(container),
    'caddy', 'validate', '--config', `/w/${rel}`, '--adapter', 'caddyfile']);
  if (r.status !== 0) {
    const why = (r.stderr || r.stdout).split('\n').filter((l) => !l.startsWith('{')).join('\n').trim();
    throw new Error(`the rendered Caddyfile does not adapt — NOTHING was changed:\n${why}`);
  }
}

// writeFileSync truncates in place, so the mounted inode is preserved. Never
// rename or sed -i this path: that swaps the inode and the container stops
// seeing writes.
const writeInPlace = (file, text) => fs.writeFileSync(file, text);

function reload(container) {
  const r = docker(['exec', container, 'caddy', 'reload', '--config', '/etc/caddy/Caddyfile', '--adapter', 'caddyfile']);
  if (r.status !== 0) throw new Error(`caddy reload failed: ${(r.stderr || r.stdout).trim()}`);
}

// ── health gate ──────────────────────────────────────────────────────────────

/** Never shift onto a colour that is not answering. Reuses the deploy smoke check verbatim. */
export function greenIsHealthy(service, { retries = 6, delay = 5000, timeout = 10000 } = {}) {
  const url = probeUrl(service);
  const r = spawnSync(process.execPath, [
    path.join(HERE, 'smoke-check.mjs'), url,
    '--retries', String(retries), '--delay', String(delay), '--timeout', String(timeout),
    '--expect', PROBE[service].expect,
  ], { stdio: 'inherit' });
  return r.status === 0;
}

// ── main ─────────────────────────────────────────────────────────────────────

export function shift({ service, percent, caddyfile = DEFAULT_CADDYFILE, container = DEFAULT_CONTAINER, skipHealth = false, log = console.log }) {
  assertDocker();
  assertContainerSeesFile(container, caddyfile);

  const dir = stateDir(caddyfile);
  fs.mkdirSync(dir, { recursive: true });

  const prior = readState(caddyfile);
  if (prior && prior.service !== service) {
    throw new Error(
      `a rollout is already in flight for ${prior.service} at ${prior.percent}%.\n` +
        `Only one green runs at a time — the box does not have headroom for two.\n` +
        `Finish or abort it first:  node scripts/traffic-shift.mjs --service ${prior.service} --percent 0`,
    );
  }

  // Snapshot the clean file once, at the start. Every later render is produced from
  // this snapshot, never from the current (already-rewritten) file.
  const bpath = baselinePath(caddyfile);
  if (!prior || !fs.existsSync(bpath)) fs.copyFileSync(caddyfile, bpath);
  const baseline = fs.readFileSync(bpath, 'utf8');

  if (percent > 0 && !skipHealth && !greenIsHealthy(service)) {
    throw new Error(`${service}-green is not answering on ${probeUrl(service)} — refusing to send it traffic.`);
  }

  const { text, routes } = renderCaddyfile(baseline, service, percent);
  validateCandidate(container, caddyfile, text);

  const before = fs.readFileSync(caddyfile, 'utf8');
  writeInPlace(caddyfile, text);
  try {
    reload(container);
  } catch (err) {
    // Caddy keeps the running config when a reload fails, so the edge is still up.
    // Put the file back so the next run starts from something coherent.
    writeInPlace(caddyfile, before);
    throw err;
  }

  if (percent === 0) {
    fs.rmSync(statePath(caddyfile), { force: true });
    fs.rmSync(bpath, { force: true });
    log(`  all traffic on ${service} (blue). Caddyfile restored to baseline; ${routes} route(s) touched.`);
  } else {
    fs.writeFileSync(statePath(caddyfile), `${JSON.stringify({ service, percent, at: new Date().toISOString() }, null, 2)}\n`);
    log(`  ${percent}% -> ${service}-green, ${100 - percent}% -> ${service}; ${routes} route(s) reloaded.`);
  }
  return { routes };
}

function main() {
  const args = process.argv.slice(2);
  const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i > -1 ? args[i + 1] : fallback;
  };
  const service = opt('service');
  const percentRaw = opt('percent');

  if (!service || percentRaw === undefined) {
    console.error('usage: traffic-shift.mjs --service <name> --percent <0-100> [--caddyfile PATH] [--container NAME] [--skip-health] [--dry-run]');
    process.exit(2);
  }
  const percent = Number(percentRaw);
  const caddyfile = path.resolve(opt('caddyfile', DEFAULT_CADDYFILE));

  try {
    if (args.includes('--dry-run')) {
      const src = fs.existsSync(baselinePath(caddyfile)) ? baselinePath(caddyfile) : caddyfile;
      process.stdout.write(renderCaddyfile(fs.readFileSync(src, 'utf8'), service, percent).text);
      return;
    }
    shift({
      service,
      percent,
      caddyfile,
      container: opt('container', DEFAULT_CONTAINER),
      skipHealth: args.includes('--skip-health'),
    });
  } catch (err) {
    console.error(`\ntraffic-shift FAILED: ${err.message}\n`);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
