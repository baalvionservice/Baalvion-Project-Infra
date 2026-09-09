#!/usr/bin/env node
// Staged rollout of ONE service through its green container, with an automatic abort.
//
//   start green -> health gate -> 5% -> soak -> 25% -> soak -> 100% -> soak -> promote
//
// Every stage watches the candidate. If it stops answering, gets OOM-killed, restarts,
// or its error rate crosses the threshold, traffic goes back to 100% blue immediately
// and the run exits non-zero. Blue is never touched until the last stage has passed,
// so the rollback is a config reload, not a redeploy.
//
//   node scripts/canary-rollout.mjs --service app-platform --tag prod-9f2c1ab
//   node scripts/canary-rollout.mjs --abort
//   node scripts/canary-rollout.mjs --status
//
// Options (defaults in brackets):
//   --service NAME          compose service to roll (required)
//   --tag TAG               ECR tag the green runs (required)
//   --stages 5,25,100       percentages, ascending [5,25,100]
//   --soak SECONDS          watch time at each stage [300]
//   --error-threshold RATE  fraction of failed probes that aborts [0.02]
//   --probe-interval SEC    seconds between probes during a soak [10]
//   --min-samples N         probes needed before the rate can abort [10]
//   --warmup SECONDS        time green gets to report healthy [180]
//   --write-env             persist the tag into .env when promoting [off]
//   --keep-green            leave the green container in place at the end [off]
//   --force-unsafe          run a service this script refuses (read the table first)
//
// Runs ON the box: it needs the docker socket and the checkout Caddy mounts from.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DEFAULT_CADDYFILE, DEFAULT_CONTAINER, PROBE, probeUrl, readState, shift } from './traffic-shift.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const CONSOLIDATED = path.join(REPO, 'deploy/consolidated');

// Which .env variable carries each service's image tag. Note that one variable,
// IMAGE_TAG, feeds SEVEN services — the six pm2 personalities plus admin-web all
// come out of the same build. Canarying one of them is really canarying the image.
const TAG_VAR = {
  'app-identity': 'IMAGE_TAG',
  'app-commerce': 'IMAGE_TAG',
  'app-trade': 'IMAGE_TAG',
  'app-ecosystem': 'IMAGE_TAG',
  'app-platform': 'IMAGE_TAG',
  'app-edge-realtime': 'IMAGE_TAG',
  'admin-web': 'IMAGE_TAG',
  'app-auth-web': 'AUTH_WEB_IMAGE_TAG',
};

// Services whose containers run background work that a traffic shift cannot contain.
// The shift only decides who answers requests; these loops never see one.
const UNSAFE = {
  'app-trade':
    'order-execution-service/services/outboxPublisher.js claims PENDING rows with a plain findAll — '
    + 'no FOR UPDATE SKIP LOCKED, no advisory lock, no env switch. Two copies publish the same events '
    + 'twice. Nothing in the Caddyfile routes to app-trade either, so there is no traffic to shift.',
  'app-edge-realtime':
    'ws.baalvion.com is socket.io. weighted_round_robin splits requests, not sessions, so the HTTP '
    + 'long-polling fallback alternates colours mid-session. proxy-service/workers/intelligenceWorker.js '
    + 'also runs model training and forecasts on timers, which would double on a 2-vCPU box.',
};

// Green mem_reservation from docker-compose.bluegreen.yml — what has to be actually
// resident, not the cap. Checked against MemAvailable before anything is started.
const GREEN_RESERVATION_MIB = {
  'app-identity': 512,
  'app-commerce': 640,
  'app-trade': 512,
  'app-ecosystem': 768,
  'app-platform': 768,
  'app-edge-realtime': 448,
  'admin-web': 96,
  'app-auth-web': 96,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString().slice(11, 19);
const say = (msg) => console.log(`[${now()}] ${msg}`);

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });

function docker(args, { fatal = true } = {}) {
  const r = run('docker', args);
  if (fatal && r.status !== 0) throw new Error(`docker ${args.slice(0, 3).join(' ')} failed: ${(r.stderr || r.stdout).trim()}`);
  return r;
}

// ── compose ──────────────────────────────────────────────────────────────────

class Compose {
  constructor({ envFile, composeFile, overlay }) {
    this.base = ['compose', '--env-file', envFile, '-f', composeFile];
    this.withGreen = [...this.base, '-f', overlay];
    this.envFile = envFile;
  }

  upGreen(service, tag) {
    const r = run('docker', [...this.withGreen, '--profile', `bg-${service}`, 'up', '-d', '--no-build', `${service}-green`], {
      env: { ...process.env, GREEN_IMAGE_TAG: tag },
      stdio: 'inherit',
    });
    if (r.status !== 0) throw new Error(`could not start ${service}-green on ${tag}`);
  }

  recreateBlue(service, tagVar, tag) {
    const r = run('docker', [...this.base, 'up', '-d', '--no-build', '--no-deps', '--force-recreate', service], {
      env: { ...process.env, [tagVar]: tag },
      stdio: 'inherit',
    });
    if (r.status !== 0) throw new Error(`could not recreate ${service} on ${tag}`);
  }

  stopGreen(service, { remove }) {
    const verb = remove ? ['rm', '-sf'] : ['stop'];
    run('docker', [...this.withGreen, '--profile', `bg-${service}`, ...verb, `${service}-green`], { stdio: 'inherit' });
  }

  /** The tag currently pinned in .env, which is what an unrelated `compose up` would use. */
  envTag(tagVar) {
    const line = fs.readFileSync(this.envFile, 'utf8').split('\n').find((l) => l.startsWith(`${tagVar}=`));
    return line ? line.slice(tagVar.length + 1).trim() : null;
  }

  writeEnvTag(tagVar, tag) {
    const lines = fs.readFileSync(this.envFile, 'utf8').split('\n');
    const i = lines.findIndex((l) => l.startsWith(`${tagVar}=`));
    if (i > -1) lines[i] = `${tagVar}=${tag}`; else lines.push(`${tagVar}=${tag}`);
    // writeFileSync truncates in place. .env is read by the compose CLI, not bind-mounted,
    // but keeping the inode stable costs nothing and matches the Caddyfile rule.
    fs.writeFileSync(this.envFile, lines.join('\n'));
  }
}

// ── container signals ────────────────────────────────────────────────────────

function inspect(container) {
  const r = docker(['inspect', '-f',
    '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.RestartCount}}|{{.State.OOMKilled}}',
    container], { fatal: false });
  if (r.status !== 0) return null;
  const [status, health, restarts, oom] = r.stdout.trim().split('|');
  return { status, health, restarts: Number(restarts), oom: oom === 'true' };
}

/** Anything here means the candidate is unfit, regardless of what the probes say. */
function containerFault(state, baselineRestarts) {
  if (!state) return 'the green container is gone';
  if (state.oom) return 'the green container was OOM-killed — the box did not have the headroom';
  if (state.status !== 'running') return `the green container is ${state.status} (restart: "no", so it stays down)`;
  if (state.restarts > baselineRestarts) return `the green container restarted (${state.restarts})`;
  if (state.health === 'unhealthy') return 'the green container reports unhealthy';
  return null;
}

async function waitHealthy(container, seconds) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    const s = inspect(container);
    if (s?.oom) throw new Error(`${container} was OOM-killed during warmup`);
    if (s && s.status !== 'running' && s.status !== 'created') throw new Error(`${container} is ${s.status} during warmup`);
    if (s?.health === 'healthy' || s?.health === 'none') return;
    await sleep(5000);
  }
  throw new Error(`${container} never reported healthy within ${seconds}s`);
}

// ── soak ─────────────────────────────────────────────────────────────────────

async function probeOnce(url, expect, timeoutMs) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: 'manual' });
    return expect.includes(String(res.status));
  } catch {
    return false;
  }
}

/**
 * Watch the candidate for `seconds`. Returns null when it held, or the reason it did not.
 *
 * The error rate here is measured over THIS script's own probes, not over the users' traffic —
 * Caddy is not configured to log at all, so per-upstream request outcomes are not observable
 * from the box. It reliably catches a candidate that has fallen over, hung, started returning
 * errors on the probed paths, or is being OOM-killed. It does NOT see a fault that only shows
 * up on a route the probe does not touch. See docs/progressive-delivery.md.
 */
async function soak(service, seconds, { threshold, intervalMs, minSamples, greenContainer, baselineRestarts }) {
  const url = probeUrl(service);
  const expect = PROBE[service].expect.split(',');
  const deadline = Date.now() + seconds * 1000;
  let ok = 0;
  let bad = 0;

  while (Date.now() < deadline) {
    const fault = containerFault(inspect(greenContainer), baselineRestarts);
    if (fault) return fault;

    if (await probeOnce(url, expect, Math.min(intervalMs, 10000))) ok += 1; else bad += 1;
    const samples = ok + bad;
    const rate = bad / samples;

    if (samples >= minSamples && rate > threshold) {
      return `error rate ${(rate * 100).toFixed(1)}% over ${samples} probes exceeds the ${(threshold * 100).toFixed(1)}% threshold`;
    }
    if (samples % 6 === 0) {
      say(`    ${samples} probes, ${bad} failed (${(rate * 100).toFixed(1)}%), ${Math.round((deadline - Date.now()) / 1000)}s left`);
    }
    await sleep(intervalMs);
  }
  say(`    soak clean: ${ok}/${ok + bad} probes ok`);
  return null;
}

// ── rollout ──────────────────────────────────────────────────────────────────

async function rollout(opt) {
  const { service, tag, stages, compose, caddyfile, container } = opt;
  const green = `${service}-green`;
  const greenContainer = `${opt.project}-${green}-1`;

  if (UNSAFE[service] && !opt.forceUnsafe) {
    throw new Error(`${service} is not safe to run two copies of.\n\n  ${UNSAFE[service]}\n\nFix that first. --force-unsafe overrides, and owns the consequences.`);
  }
  if (!TAG_VAR[service]) throw new Error(`${service} has no green defined. Known: ${Object.keys(TAG_VAR).join(', ')}`);

  const inflight = readState(caddyfile);
  if (inflight) throw new Error(`${inflight.service} is already at ${inflight.percent}% green. Finish or abort it first: node scripts/canary-rollout.mjs --abort`);

  assertHeadroom(service, opt.skipHeadroom);

  say(`starting ${green} on ${tag}`);
  compose.upGreen(service, tag);
  await waitHealthy(greenContainer, opt.warmup);
  const baselineRestarts = inspect(greenContainer)?.restarts ?? 0;
  say(`${green} is healthy`);

  for (const percent of stages) {
    say(`shifting ${percent}% to ${green}`);
    shift({ service, percent, caddyfile, container, log: (m) => say(m) });

    say(`  soaking ${opt.soak}s at ${percent}%`);
    const fault = await soak(service, opt.soak, {
      threshold: opt.errorThreshold,
      intervalMs: opt.probeInterval * 1000,
      minSamples: opt.minSamples,
      greenContainer,
      baselineRestarts,
    });
    if (fault) {
      abort({ service, caddyfile, container, compose, reason: fault, greenContainer });
      return 1;
    }
  }

  return promote({ ...opt, green, greenContainer });
}

function abort({ service, caddyfile, container, compose, reason, greenContainer }) {
  console.error(`\n!! ABORTING: ${reason}\n`);
  try {
    shift({ service, percent: 0, caddyfile, container, log: (m) => say(m) });
    say('all traffic is back on blue');
  } catch (err) {
    console.error(`COULD NOT SHIFT BACK: ${err.message}`);
    console.error(`Do it by hand NOW:  node scripts/traffic-shift.mjs --service ${service} --percent 0`);
    return;
  }
  // Stopped, not removed: the logs are the only record of why this failed.
  compose.stopGreen(service, { remove: false });
  console.error(`\nBlue never changed image, so nothing needs redeploying. Read the candidate's logs:\n  docker logs ${greenContainer}\n`);
}

async function promote({ service, tag, compose, caddyfile, container, greenContainer, writeEnv, keepGreen }) {
  const tagVar = TAG_VAR[service];
  const pinned = compose.envTag(tagVar);

  // Traffic is 100% on green here, so recreating blue is invisible to users.
  say(`promoting: recreating ${service} on ${tag}`);
  compose.recreateBlue(service, tagVar, tag);

  const blueContainer = `${compose.project}-${service}-1`;
  try {
    await waitHealthy(blueContainer, 180);
  } catch (err) {
    console.error(`\n!! ${service} did not come back healthy on ${tag}: ${err.message}`);
    console.error('Traffic is STILL 100% on green and staying there — shifting to a blue that is not serving would be worse.');
    console.error(`Investigate:  docker logs ${blueContainer}`);
    return 1;
  }

  say('blue is healthy on the new image; returning traffic to blue');
  shift({ service, percent: 0, caddyfile, container, log: (m) => say(m) });
  compose.stopGreen(service, { remove: !keepGreen });

  if (writeEnv) {
    compose.writeEnvTag(tagVar, tag);
    say(`${tagVar}=${tag} written to .env`);
  } else if (pinned !== tag) {
    console.log(
      `\nNOTE: .env still pins ${tagVar}=${pinned}. ${service} is running ${tag} right now, but the next\n`
      + `\`compose up\` of it would revert. Persist it:\n  node scripts/canary-rollout.mjs --service ${service} --tag ${tag} --write-env\n`
      + `  (or edit ${tagVar} in deploy/consolidated/.env)\n`,
    );
  }
  if (tagVar === 'IMAGE_TAG') {
    console.log(
      `NOTE: IMAGE_TAG is shared by app-identity, app-commerce, app-trade, app-ecosystem, app-platform,\n`
      + `app-edge-realtime and admin-web. They keep running their current image until something recreates\n`
      + `them, and then they adopt ${tag} without having been canaried. Roll each one you care about.\n`,
    );
  }
  say('done');
  return 0;
}

/**
 * The whole reason this design is per-service. A green costs its mem_reservation on
 * top of a stack that already reserves 4.25 GiB on an 8 GiB box.
 */
function assertHeadroom(service, skip) {
  const need = GREEN_RESERVATION_MIB[service];
  let available;
  try {
    const m = /MemAvailable:\s+(\d+) kB/.exec(fs.readFileSync('/proc/meminfo', 'utf8'));
    available = m ? Math.round(Number(m[1]) / 1024) : null;
  } catch {
    available = null;
  }
  if (available === null) {
    console.log(`  (no /proc/meminfo — cannot check headroom here. ${service}-green reserves ${need} MiB.)`);
    return;
  }
  say(`headroom: ${available} MiB available, ${service}-green reserves ${need} MiB`);
  if (available < need * 1.25 && !skip) {
    throw new Error(
      `only ${available} MiB available and ${service}-green reserves ${need} MiB.\n`
      + 'Starting it would push the box into swap and the soak would measure swap thrash, not the candidate.\n'
      + 'Free something first, or pass --skip-headroom if you know better.',
    );
  }
}

// ── cli ──────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i > -1 ? args[i + 1] : fallback;
  };
  const caddyfile = path.resolve(opt('caddyfile', DEFAULT_CADDYFILE));
  const container = opt('container', DEFAULT_CONTAINER);
  const project = process.env.COMPOSE_PROJECT_NAME || 'consolidated';
  const compose = new Compose({
    envFile: path.resolve(opt('env-file', path.join(CONSOLIDATED, '.env'))),
    composeFile: path.resolve(opt('compose-file', path.join(CONSOLIDATED, 'docker-compose.prod.yml'))),
    overlay: path.resolve(opt('overlay', path.join(CONSOLIDATED, 'docker-compose.bluegreen.yml'))),
  });
  compose.project = project;

  if (args.includes('--status')) {
    const s = readState(caddyfile);
    console.log(s ? `${s.service} is at ${s.percent}% green (since ${s.at})` : 'no rollout in flight — all traffic is on blue');
    return 0;
  }

  if (args.includes('--abort')) {
    const s = readState(caddyfile);
    if (!s) { console.log('nothing to abort — no rollout in flight'); return 0; }
    abort({
      service: s.service,
      caddyfile,
      container,
      compose,
      reason: 'aborted by hand',
      greenContainer: `${project}-${s.service}-green-1`,
    });
    return 1;
  }

  const service = opt('service');
  const tag = opt('tag');
  if (!service || !tag) {
    console.error('usage: canary-rollout.mjs --service <name> --tag <ecr-tag> [--stages 5,25,100] [--soak 300] [--error-threshold 0.02]');
    console.error('       canary-rollout.mjs --abort | --status');
    return 2;
  }

  const stages = String(opt('stages', '5,25,100')).split(',').map((s) => Number(s.trim()));
  if (stages.some((s) => !Number.isInteger(s) || s < 1 || s > 100)) throw new Error('--stages must be integers 1-100');
  if (stages.some((s, i) => i && s <= stages[i - 1])) throw new Error('--stages must ascend');
  if (stages.at(-1) !== 100) console.log('NOTE: the last stage is not 100% — the rollout will stop short of promoting.');

  return rollout({
    service,
    tag,
    stages,
    compose,
    caddyfile,
    container,
    project,
    soak: Number(opt('soak', 300)),
    errorThreshold: Number(opt('error-threshold', 0.02)),
    probeInterval: Number(opt('probe-interval', 10)),
    minSamples: Number(opt('min-samples', 10)),
    warmup: Number(opt('warmup', 180)),
    writeEnv: args.includes('--write-env'),
    keepGreen: args.includes('--keep-green'),
    forceUnsafe: args.includes('--force-unsafe'),
    skipHeadroom: args.includes('--skip-headroom'),
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  Promise.resolve()
    .then(main)
    .then((code) => process.exit(code ?? 0))
    .catch((err) => {
      console.error(`\ncanary FAILED: ${err.message}\n`);
      process.exit(1);
    });
}

export { containerFault, soak, UNSAFE, TAG_VAR, GREEN_RESERVATION_MIB };
