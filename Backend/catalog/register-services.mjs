#!/usr/bin/env node
/**
 * Phase-1 stabilization: register every CURRENT backend service in the catalog,
 * tagged with its LOCKED 6-domain owner. Idempotent + additive — it NEVER
 * overwrites an existing catalog/services/*.yaml, so running it cannot change or
 * break anything already defined. Run: `node catalog/register-services.mjs`.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SERVICES = join(here, 'services');
const TEAM = { identity: '@baalvion/platform-core', platform: '@baalvion/platform-core', infrastructure: '@baalvion/infrastructure', commerce: '@baalvion/commerce', knowledge: '@baalvion/knowledge', ecosystem: '@baalvion/ecosystem' };

// name | path(under Backend/) | domain | division | context | tier | language | datastores | dependsOn
const S = [
  // ── Identity ──
  ['auth-service', 'auth-service', 'identity', 'platform-core', 'auth', 'tier-0', 'node', ['postgres', 'redis'], []],
  ['oauth-service', 'oauth-service', 'identity', 'platform-core', 'oauth', 'tier-0', 'node', ['postgres', 'redis'], ['auth-service']],
  ['session-service', 'session-service', 'identity', 'platform-core', 'session', 'tier-0', 'node', ['redis', 'postgres'], ['auth-service']],
  // ── Platform/Admin ──
  ['baalvion-os', 'baalvion-os', 'platform', 'platform-core', 'platform-kernel', 'tier-0', 'node', ['postgres', 'redis'], []],
  ['admin-service', 'admin-service', 'platform', 'platform-core', 'admin', 'tier-1', 'node', ['postgres'], ['identity-platform']],
  ['dashboard-service', 'dashboard-service', 'platform', 'platform-core', 'dashboard', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  // ── Infrastructure ──
  ['gateway', 'gateway', 'infrastructure', 'shared-developer-platform', 'api-gateway', 'tier-0', 'go', ['redis'], []],
  ['notification-service', 'notification-service', 'infrastructure', 'shared-developer-platform', 'notification', 'tier-1', 'node', ['postgres', 'redis'], ['identity-platform']],
  ['realtime-service', 'realtime-service', 'infrastructure', 'shared-developer-platform', 'realtime', 'tier-1', 'node', ['redis'], ['identity-platform']],
  // ── Commerce ──
  ['commerce-service', 'commerce-service', 'commerce', 'commerce', 'commerce', 'tier-1', 'node', ['postgres'], ['identity-platform']],
  ['trade-service', 'trade-service', 'commerce', 'commerce', 'trade', 'tier-1', 'node', ['postgres', 'redis'], ['identity-platform']],
  ['market-service', 'market-service', 'commerce', 'commerce', 'market', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['inventory-service', 'inventory-service', 'commerce', 'commerce', 'inventory', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['order-service', 'order-service', 'commerce', 'commerce', 'order', 'tier-1', 'node', ['postgres'], ['identity-platform']],
  ['fulfillment-service', 'fulfillment-service', 'commerce', 'commerce', 'fulfillment', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  // ── Knowledge & Intelligence ──
  ['cms-service', 'cms-service', 'knowledge', 'platform-core', 'cms', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['imperialpedia-service', 'imperialpedia-service', 'knowledge', 'platform-core', 'imperialpedia', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['law-service', 'law-service', 'knowledge', 'legal', 'law', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['ml-service', 'ml-service', 'knowledge', 'platform-core', 'ml', 'tier-2', 'python', ['postgres', 'clickhouse'], ['identity-platform']],
  // ── Ecosystem (vertical products) ──
  ['insiders-service', 'insiders-service', 'ecosystem', 'commerce', 'insiders', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['law-elite', 'law-elite', 'ecosystem', 'legal', 'law-elite', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['jobs-service', 'jobs-service', 'ecosystem', 'jobs', 'jobs', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['brand-connector-service', 'brand-connector-service', 'ecosystem', 'shared-developer-platform', 'brand-connector', 'tier-3', 'node', ['postgres'], ['identity-platform']],
  ['real-estate-service', 'real-estate-service', 'ecosystem', 'real-estate', 'real-estate', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['mining-service', 'mining-service', 'ecosystem', 'mining', 'mining', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['ctm-service', 'ctm-service', 'ecosystem', 'commerce', 'control-the-market', 'tier-2', 'node', ['postgres'], ['identity-platform']],
  ['about-service', 'about-service', 'ecosystem', 'platform-core', 'about', 'tier-3', 'node', ['postgres'], ['identity-platform']],
  ['ir-service', 'ir-service', 'ecosystem', 'commerce', 'investor-relations', 'tier-2', 'node', ['postgres'], ['identity-platform']],
];

let created = 0, skipped = 0;
for (const [name, path, domain, division, context, tier, language, datastores, dependsOn] of S) {
  const file = join(SERVICES, `${name}.yaml`);
  if (existsSync(file)) { skipped++; console.log(`• skip (exists)  ${name}`); continue; }
  const ds = `[${datastores.join(', ')}]`;
  const deps = dependsOn.length ? `[${dependsOn.join(', ')}]` : '[]';
  writeFileSync(file, `apiVersion: baalvion.io/v1
kind: Service
metadata:
  name: ${name}
  description: TODO — describe this bounded context.
  domain: ${domain}
  division: ${division}
  context: ${context}
  owner: "${TEAM[domain]}"
  tier: ${tier}
  repo: baalvion-platform
  path: Backend/${path}
spec:
  lifecycle: production
  language: ${language}
  datastores: ${ds}
  dependsOn: ${deps}
  consumesEvents: []
  producesEvents: []
  apis: ["/v1/${context}"]
  slo: { availability: 0.99, latencyP95Ms: 400 }
  deploy: { chart: baalvion-service, namespace: baalvion-${domain}, minReplicas: 2, maxReplicas: 10 }
`);
  created++; console.log(`✓ created       ${name}  (${domain})`);
}
console.log(`\n${created} created, ${skipped} skipped. Existing descriptors untouched.`);
