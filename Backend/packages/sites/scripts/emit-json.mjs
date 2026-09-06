// Emit the registry as plain JSON so non-Node consumers (the Java financial suite, Caddy
// config generation, ops tooling) read the same source of truth instead of keeping a copy.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { SITES, INFRASTRUCTURE_HOSTS, UNCLASSIFIED_HOSTS } = await import(join(here, '..', 'dist', 'index.mjs'));

const out = {
  generatedBy: '@baalvion/sites',
  sites: SITES,
  infrastructureHosts: INFRASTRUCTURE_HOSTS,
  unclassifiedHosts: UNCLASSIFIED_HOSTS,
};
writeFileSync(join(here, '..', 'dist', 'sites.json'), `${JSON.stringify(out, null, 2)}\n`);
console.log(`sites.json written — ${SITES.length} sites`);
