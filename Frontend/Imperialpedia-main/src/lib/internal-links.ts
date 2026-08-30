import fs from 'fs';
import path from 'path';

/**
 * Returns an array of related hub slugs for a given hub.
 * It reads the `src/app` directory at build time and picks the next `count`
 * hubs alphabetically (skipping the current hub). This provides deterministic
 * internal linking without needing to maintain a massive static map.
 */
export function getRelatedHubs(current: string, count: number = 3): string[] {
  const hubsRoot = path.resolve(process.cwd(), 'src/app');
  const all = fs
    .readdirSync(hubsRoot)
    .filter((name) => {
      const full = path.join(hubsRoot, name);
      return fs.statSync(full).isDirectory() && name !== '[...slug]';
    })
    .sort();

  const others = all.filter((hub) => hub !== current);
  const start = others.findIndex((h) => h > current);
  const startIdx = start >= 0 ? start : 0;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(others[(startIdx + i) % others.length]);
  }
  return result;
}
