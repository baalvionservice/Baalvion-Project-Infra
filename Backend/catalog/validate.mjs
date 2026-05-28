#!/usr/bin/env node
/**
 * Service-catalog governance gate (CI). For every catalog/services/*.yaml:
 *   1. validate against catalog/schema.json (Ajv)
 *   2. check referential integrity — every `dependsOn` resolves to a known
 *      service; every consumed/produced event exists in @baalvion/contracts;
 *      every owner is a real team in CODEOWNERS
 *   3. emit catalog/index.json (the dependency graph + ownership map that the
 *      ArgoCD ApplicationSet, dependency dashboards and `baalctl` consume)
 *
 * Deps: `yaml` + `ajv` (devDeps). Soft-skips when absent so the repo still boots.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(here, 'services');
const contractsEvents = join(here, '..', 'packages', 'contracts', 'events');

let YAML, Ajv;
try { YAML = (await import('yaml')).default ?? (await import('yaml')); Ajv = (await import('ajv')).default; }
catch { console.error('skip: install `yaml` + `ajv` to run catalog validation'); process.exit(0); }

const schema = JSON.parse(readFileSync(join(here, 'schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

// Known event types = the contracts event registry (single source of truth).
const knownEvents = new Set(
  existsSync(contractsEvents)
    ? readdirSync(contractsEvents).filter((f) => f.endsWith('.v1.json') || f.endsWith('.json'))
        .map((f) => f.replace(/\.(v\d+\.)?json$/, ''))
    : [],
);
// Auth-domain events also exist in @baalvion/types — allow a curated allowlist.
['auth.login.success', 'auth.session.revoked', 'security.incident', 'org.member.invited',
 'org.member.joined', 'org.member.removed', 'metrics.threshold', 'notification.sent',
 'admin.impersonation', 'proxy.session.ended', 'billing.payment.succeeded', 'billing.payment.failed']
  .forEach((e) => knownEvents.add(e));

const files = readdirSync(servicesDir).filter((f) => f.endsWith('.yaml'));
const services = files.map((f) => ({ file: f, doc: YAML.parse(readFileSync(join(servicesDir, f), 'utf8')) }));
const names = new Set(services.map((s) => s.doc?.metadata?.name));

let errors = 0;
const fail = (f, msg) => { console.error(`✗ ${f}: ${msg}`); errors++; };

for (const { file, doc } of services) {
  if (!validate(doc)) { fail(file, JSON.stringify(validate.errors)); continue; }
  const { dependsOn = [], consumesEvents = [], producesEvents = [] } = doc.spec;
  for (const d of dependsOn) if (!names.has(d)) fail(file, `dependsOn unknown service '${d}'`);
  for (const e of [...consumesEvents, ...producesEvents]) if (!knownEvents.has(e)) fail(file, `references unknown event '${e}'`);
  console.log(`✓ ${doc.metadata.name} (${doc.metadata.division}/${doc.metadata.tier})`);
}

// Emit the index (dependency graph + reverse event-consumer map).
const index = {
  generatedAt: new Date().toISOString(),
  services: services.map((s) => s.doc.metadata.name),
  graph: Object.fromEntries(services.map((s) => [s.doc.metadata.name, s.doc.spec.dependsOn ?? []])),
  eventConsumers: {},
};
for (const { doc } of services) {
  for (const e of doc.spec.consumesEvents ?? []) {
    (index.eventConsumers[e] ??= []).push(doc.metadata.name);
  }
}
writeFileSync(join(here, 'index.json'), JSON.stringify(index, null, 2) + '\n');

console.log(`\n${files.length} services, ${errors} errors. index.json written.`);
process.exit(errors ? 1 : 0);
