/**
 * One-off export of the bundled entertainment entries to JSON so law-service
 * can load them and editors can manage them from the admin panel:
 *   npx tsx scripts/export-entertainment-seed.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { getAllEntertainmentEntities } from '../src/data/entertainment';

const out = join(__dirname, '..', '..', '..', 'Backend', 'services', 'knowledge', 'law-service', 'data', 'entertainment-seed.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(getAllEntertainmentEntities(), null, 2) + '\n');
console.log(`wrote ${getAllEntertainmentEntities().length} entries to ${out}`);
