import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ValidationReport {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

export function report(errors: readonly string[]): ValidationReport {
  return { ok: errors.length === 0, errors };
}

export class ValidationError extends Error {
  readonly errors: readonly string[];
  constructor(what: string, errors: readonly string[]) {
    super(`${what} is invalid:\n  - ${errors.join('\n  - ')}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks that `value` is an object with exactly the expected keys. Unknown
 * keys are errors: configuration is never allowed to carry extra fields.
 */
export function checkKeys(
  value: unknown,
  keys: readonly string[],
  path: string,
  errors: string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }
  for (const key of keys) {
    if (!(key in value)) errors.push(`${path}.${key} is missing`);
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) errors.push(`${path}.${key} is not an allowed field`);
  }
  return true;
}

/** Repository root (the baal-token directory). */
export const REPO_ROOT = resolve(import.meta.dirname, '..', '..');

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}
