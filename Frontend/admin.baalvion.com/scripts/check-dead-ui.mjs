// Fails when the console ships UI that looks clickable but does nothing:
//   1. a link / router.push to a page that does not exist
//   2. onClick={() => {}}
//   3. a <Button> with no click handler, link, submit, or `disabled`
// Run: node scripts/check-dead-ui.mjs   (wired into `pnpm run check:dead-ui`)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname;
const APP = join(SRC, 'app');

const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};

const routes = walk(APP)
  .filter((p) => p.endsWith(`${sep}page.tsx`))
  .map((p) => relative(APP, join(p, '..')).split(sep).filter((s) => s && !(s.startsWith('(') && s.endsWith(')'))));

const exists = (href) => {
  const parts = href.split(/[?#]/)[0].replace(/\/$/, '').split('/').filter(Boolean);
  return routes.some((r) => r.length === parts.length && r.every((seg, i) => seg === parts[i] || (seg.startsWith('[') && seg.endsWith(']'))));
};

const problems = [];
const files = walk(SRC).filter((p) => p.endsWith('.tsx') || p.endsWith('.ts'));
for (const file of files) {
  const s = readFileSync(file, 'utf8');
  const rel = relative(SRC, file);
  const lineOf = (i) => s.slice(0, i).split('\n').length;

  for (const m of s.matchAll(/(?:href[=:]\s*\{?\s*|router\.(?:push|replace)\(\s*)['"`](\/[A-Za-z0-9_\-/[\]]*)['"`]/g)) {
    if (m[1] !== '/' && !m[1].startsWith('/api') && !exists(m[1])) problems.push(`${rel}:${lineOf(m.index)}  link to missing page ${m[1]}`);
  }
  for (const m of s.matchAll(/onClick=\{\(\)\s*=>\s*\{\s*\}\}/g)) problems.push(`${rel}:${lineOf(m.index)}  empty onClick handler`);

  if (!file.endsWith('.tsx')) continue;
  for (const m of s.matchAll(/<Button\b/g)) {
    let j = m.index + m[0].length, depth = 0;
    for (; j < s.length; j++) {
      const c = s[j];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0 && s[j - 1] !== '=') break;
    }
    const tag = s.slice(m.index, j);
    if (/onClick|asChild|disabled|type=["']submit|type=\{|form=|onSubmit|\{\.\.\./.test(tag)) continue;
    const before = s.slice(Math.max(0, m.index - 220), m.index);
    const openLink = before.lastIndexOf('<Link'), closeLink = before.lastIndexOf('</Link>');
    if (openLink > closeLink) continue; // clickable through its wrapping <Link>
    if (/<(DialogTrigger|AlertDialogTrigger|PopoverTrigger|DropdownMenuTrigger|SheetTrigger|DialogClose)[^>]*>\s*$/.test(before)) continue;
    problems.push(`${rel}:${lineOf(m.index)}  <Button> with no handler, link, submit or disabled`);
  }
}

if (problems.length) {
  console.error(`Dead UI found (${problems.length}):\n` + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
console.log(`check-dead-ui: ${routes.length} routes, ${files.length} files, no dead links or handler-less buttons.`);
