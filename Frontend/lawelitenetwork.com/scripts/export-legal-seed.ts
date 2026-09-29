/**
 * One-off export of the bundled cases and courts to JSON, so law-service can
 * load them and editors can manage them from the admin panel:
 *   npx tsx scripts/export-legal-seed.ts
 * The result is read by law-service's scripts/seed-legal.js.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { getAllLegalCases } from '../src/data/legal-cases';
import { getAllCourts } from '../src/data/courts';

const out = join(__dirname, '..', '..', '..', 'Backend', 'services', 'knowledge', 'law-service', 'data', 'legal-seed.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ courts: getAllCourts(), cases: getAllLegalCases() }, null, 2) + '\n');
console.log(`wrote ${getAllCourts().length} courts and ${getAllLegalCases().length} cases to ${out}`);
