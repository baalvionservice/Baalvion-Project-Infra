import { checkKeys, readJson, report, ValidationError } from './guards.ts';
import type { ValidationReport } from './guards.ts';

export const PLACEHOLDER = 'PLACEHOLDER_NOT_PUBLISHED';

export interface TokenMetadata {
  readonly schemaVersion: 1;
  readonly status: 'draft' | 'published';
  readonly name: string;
  readonly symbol: string;
  readonly description: string;
  readonly image: string;
  readonly externalUrl: string;
}

const SYMBOL_RE = /^[A-Z0-9]{2,10}$/;
// Metadata must never read as a financial promise.
const PROMISE_RE =
  /\b(guaranteed?|100x|1000x|moon|profits?|get rich|passive income|risk[- ]free)\b/i;

function checkUrl(value: unknown, path: string, status: unknown, errors: string[]): void {
  if (value === PLACEHOLDER) {
    if (status === 'published')
      errors.push(`${path} cannot be a placeholder once status is "published"`);
    return;
  }
  if (typeof value !== 'string') {
    errors.push(`${path} must be a string`);
    return;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    errors.push(`${path} must be an https URL or ${PLACEHOLDER}`);
    return;
  }
  if (url.protocol !== 'https:') errors.push(`${path} must use https`);
  if (url.username !== '' || url.password !== '' || url.search !== '') {
    errors.push(`${path} must not contain credentials or query strings`);
  }
}

export function validateMetadata(doc: unknown): ValidationReport {
  const errors: string[] = [];
  const keys = ['schemaVersion', 'status', 'name', 'symbol', 'description', 'image', 'externalUrl'];
  if (!checkKeys(doc, keys, 'metadata', errors)) return report(errors);
  if (doc['schemaVersion'] !== 1) errors.push('metadata.schemaVersion must be 1');
  if (doc['status'] !== 'draft' && doc['status'] !== 'published')
    errors.push('metadata.status must be "draft" or "published"');

  const { name, symbol, description } = doc;
  if (typeof name !== 'string' || name.length < 1 || name.length > 32)
    errors.push('metadata.name must be 1-32 characters');
  if (typeof symbol !== 'string' || !SYMBOL_RE.test(symbol))
    errors.push('metadata.symbol must be 2-10 uppercase letters/digits');
  if (typeof description !== 'string' || description.length < 1 || description.length > 500) {
    errors.push('metadata.description must be 1-500 characters');
  } else if (PROMISE_RE.test(description)) {
    errors.push('metadata.description contains promissory or hype language');
  }
  checkUrl(doc['image'], 'metadata.image', doc['status'], errors);
  checkUrl(doc['externalUrl'], 'metadata.externalUrl', doc['status'], errors);
  return report(errors);
}

export function loadMetadata(path: string): TokenMetadata {
  const raw = readJson(path);
  const result = validateMetadata(raw);
  if (!result.ok) throw new ValidationError('token metadata', result.errors);
  return raw as TokenMetadata;
}
