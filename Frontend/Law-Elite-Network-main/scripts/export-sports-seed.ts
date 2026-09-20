/**
 * One-off export of the bundled sports teams and competitions to JSON so
 * law-service can load them and editors can manage them in the admin panel:
 *   npx tsx scripts/export-sports-seed.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { getAllSportsTeams } from '../src/data/sports-teams';
import { getAllSportsCompetitions } from '../src/data/sports-competitions';

const out = join(__dirname, '..', '..', '..', 'Backend', 'services', 'knowledge', 'law-service', 'data', 'sports-seed.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ teams: getAllSportsTeams(), competitions: getAllSportsCompetitions() }, null, 2) + '\n');
console.log(`wrote ${getAllSportsTeams().length} teams and ${getAllSportsCompetitions().length} competitions to ${out}`);
