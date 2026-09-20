/**
 * One-off export of the bundled topics to JSON so law-service can load them
 * and editors can manage them in the admin panel:
 *   npx tsx scripts/export-topics-seed.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { getAllTopics } from '../src/data/topics';

const out = join(__dirname, '..', '..', '..', 'Backend', 'services', 'knowledge', 'law-service', 'data', 'topics-seed.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(getAllTopics(), null, 2) + '\n');
console.log(`wrote ${getAllTopics().length} topics to ${out}`);
