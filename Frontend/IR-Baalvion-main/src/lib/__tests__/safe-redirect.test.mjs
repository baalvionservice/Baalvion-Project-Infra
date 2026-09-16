import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Compile the real source rather than a hand-maintained copy: a copy drifts, and a
// redirect validator that drifts from what ships is worse than no test.
import ts from 'typescript';

const src = readFileSync(fileURLToPath(new URL('../safe-redirect.ts', import.meta.url)), 'utf8');
const { outputText: js } = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { safeInternalPath } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

const ORIGIN = 'https://ir.baalvion.com';
const resolves = (value) => new URL(safeInternalPath(value), `${ORIGIN}/`).origin;

test('an ordinary internal path is preserved', () => {
  assert.equal(safeInternalPath('/dashboard'), '/dashboard');
  assert.equal(safeInternalPath('/governance/leadership/x?tab=2#top'), '/governance/leadership/x?tab=2#top');
});

test('protocol-relative and backslash-smuggled targets never leave the origin', () => {
  // Each of these passes a bare startsWith('/') check and still resolves to evil.com.
  for (const hostile of ['//evil.com', '/\\evil.com', '/\\/evil.com', '/\t/evil.com', '/\n//evil.com']) {
    assert.equal(safeInternalPath(hostile), '/dashboard', `not neutralised: ${JSON.stringify(hostile)}`);
    assert.equal(resolves(hostile), ORIGIN, `escaped the origin: ${JSON.stringify(hostile)}`);
  }
});

test('absolute and scheme-bearing targets fall back', () => {
  for (const hostile of ['https://evil.com', 'javascript:alert(1)', 'data:text/html,x', 'evil.com']) {
    assert.equal(safeInternalPath(hostile), '/dashboard');
  }
});

test('the caller-supplied fallback is honoured', () => {
  assert.equal(safeInternalPath(null, '/investors'), '/investors');
  assert.equal(safeInternalPath('', '/investors'), '/investors');
  assert.equal(safeInternalPath('//evil.com', '/investors'), '/investors');
});

test('non-string input falls back rather than throwing', () => {
  for (const v of [undefined, 42, {}, [], true]) assert.equal(safeInternalPath(v), '/dashboard');
});
