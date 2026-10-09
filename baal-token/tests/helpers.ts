import { join } from 'node:path';
import { readJson, REPO_ROOT } from '../token/src/guards.ts';

export type Json = Record<string, any>;

export function load(...parts: string[]): Json {
  return readJson(join(REPO_ROOT, ...parts)) as Json;
}

/** Deep-clones a document and lets the test corrupt it. */
export function mutate(doc: Json, change: (copy: Json) => void): Json {
  const copy = structuredClone(doc);
  change(copy);
  return copy;
}
