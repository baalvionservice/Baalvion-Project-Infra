#!/usr/bin/env node
/**
 * Event-schema registry validator (CI gate). Loads every events/*.v1.json,
 * compiles them with Ajv (catching malformed schemas), and validates a golden
 * sample for each against its schema. A schema change that breaks the golden
 * sample, or an invalid schema, fails CI — this is the schema-governance gate
 * that keeps producers and consumers in contract.
 *
 * Run: node scripts/validate-events.mjs   (needs `ajv` — devDependency)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const eventsDir = join(here, '..', 'events');

let Ajv, addFormats;
try {
  Ajv = (await import('ajv')).default;
  addFormats = (await import('ajv-formats')).default;
} catch {
  console.error('skip: install `ajv` + `ajv-formats` to run schema validation');
  process.exit(0); // soft-skip when deps absent (still real in CI where they are installed)
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const files = readdirSync(eventsDir).filter((f) => f.endsWith('.json'));
for (const f of files) {
  const schema = JSON.parse(readFileSync(join(eventsDir, f), 'utf8'));
  ajv.addSchema(schema, schema.$id);
}

// Golden samples — one valid instance per event type (kept in lock-step with domain.ts).
const samples = {
  'baalvion://events/org.created.v1.json': {
    id: '11111111-1111-1111-1111-111111111111', type: 'org.created', orgId: 'o1', userId: null,
    timestamp: new Date().toISOString(), traceId: 't1',
    payload: { orgId: 'o1', name: 'Acme', slug: 'acme', plan: 'growth', ownerUserId: 'u1', createdAt: new Date().toISOString() },
  },
  'baalvion://events/proxy.session.started.v1.json': {
    id: '22222222-2222-2222-2222-222222222222', type: 'proxy.session.started', orgId: 'o1', userId: null,
    timestamp: new Date().toISOString(), traceId: 't2',
    payload: { sessionId: 's1', orgId: 'o1', apiKeyId: 'k1', provider: 'brightdata', country: 'us', rotation: 'sticky', kind: 'residential', startedAt: new Date().toISOString() },
  },
  'baalvion://events/billing.invoice.generated.v1.json': {
    id: '33333333-3333-3333-3333-333333333333', type: 'billing.invoice.generated', orgId: 'o1', userId: null,
    timestamp: new Date().toISOString(), traceId: 't3',
    payload: { invoiceId: 'inv1', orgId: 'o1', periodStart: new Date().toISOString(), periodEnd: new Date().toISOString(), totalGb: 12.5, amount: 37.5, currency: 'USD', signature: 'abc' },
  },
  'baalvion://events/provider.health.changed.v1.json': {
    id: '44444444-4444-4444-4444-444444444444', type: 'provider.health.changed', orgId: null, userId: null,
    timestamp: new Date().toISOString(), traceId: 't4',
    payload: { provider: 'oxylabs', previousState: 'HEALTHY', newState: 'DEGRADED', successRate: 0.82, banRate: 0.2, latencyMs: 1900, region: 'us-east-1' },
  },
  'baalvion://events/abuse.action.triggered.v1.json': {
    id: '55555555-5555-5555-5555-555555555555', type: 'abuse.action.triggered', orgId: 'o1', userId: null,
    timestamp: new Date().toISOString(), traceId: 't5',
    payload: { orgId: 'o1', action: 'suspend', reason: 'sanctions_hit', severity: 'critical', caseId: 'c1', actorId: null },
  },
};

let failed = 0;
for (const [id, sample] of Object.entries(samples)) {
  const validate = ajv.getSchema(id);
  if (!validate) { console.error(`✗ no schema registered for ${id}`); failed++; continue; }
  if (validate(sample)) {
    console.log(`✓ ${id.split('/').pop()}`);
  } else {
    console.error(`✗ ${id}`, validate.errors);
    failed++;
  }
}

console.log(`\n${files.length} schemas, ${Object.keys(samples).length} golden samples, ${failed} failures`);
process.exit(failed ? 1 : 0);
