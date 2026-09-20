/**
 * Writes the list of entities the photo harvester should try to find free
 * images for (people and entertainment entries), to law-service's data dir:
 *   npx tsx scripts/export-harvest-list.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { getAllPeople } from '../src/data/people';
import { getAllEntertainmentEntities } from '../src/data/entertainment';

const out = join(__dirname, '..', '..', '..', 'Backend', 'services', 'knowledge', 'law-service', 'data', 'harvest', 'entities.json');
mkdirSync(dirname(out), { recursive: true });

const rows = [
  ...getAllPeople().map((p) => ({ type: 'person', slug: p.slug, name: p.displayName || p.fullName, category: p.category })),
  ...getAllEntertainmentEntities().map((e) => ({ type: 'entertainment', slug: e.slug, name: e.title, year: e.releaseDate ? Number(e.releaseDate.slice(0, 4)) : undefined, category: e.type })),
];
writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
console.log(`wrote ${rows.length} rows to ${out}`);
