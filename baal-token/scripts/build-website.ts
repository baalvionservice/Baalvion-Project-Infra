import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadAllocation } from '../token/src/allocation.ts';
import { REPO_ROOT } from '../token/src/guards.ts';
import { buildSite } from '../website/src/site.ts';

const out = join(REPO_ROOT, 'website', 'dist');
rmSync(out, { recursive: true, force: true });

const files = buildSite(loadAllocation(join(REPO_ROOT, 'token', 'allocation.json')));
for (const { file, html } of files) {
  const target = join(out, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html);
}
copyFileSync(join(REPO_ROOT, 'website', 'styles.css'), join(out, 'styles.css'));
console.log(`Built ${files.length} pages into website/dist`);
