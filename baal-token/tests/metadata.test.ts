import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PLACEHOLDER, validateMetadata } from '../token/src/metadata.ts';
import { load, mutate } from './helpers.ts';

const good = load('token', 'metadata.json');
const errorsOf = (doc: unknown): string => {
  const r = validateMetadata(doc);
  assert.equal(r.ok, false);
  return r.errors.join('\n');
};

describe('token metadata schema', () => {
  it('committed metadata is a valid draft with placeholders', () => {
    assert.equal(validateMetadata(good).ok, true);
    assert.equal(good['status'], 'draft');
    assert.equal(good['image'], PLACEHOLDER);
  });

  it('states that BAAL is not equity or a revenue right', () => {
    assert.match(good['description'], /does not represent equity, ownership, revenue rights/);
  });

  it('rejects bad names and symbols', () => {
    assert.match(errorsOf(mutate(good, (d) => (d['name'] = ''))), /name must be 1-32/);
    assert.match(errorsOf(mutate(good, (d) => (d['name'] = 'x'.repeat(33)))), /name must be 1-32/);
    for (const symbol of ['baal', 'B', 'TOOLONGSYMBOL', 'BA AL']) {
      assert.match(
        errorsOf(mutate(good, (d) => (d['symbol'] = symbol))),
        /symbol must be 2-10/,
        symbol,
      );
    }
  });

  it('rejects promissory language', () => {
    for (const text of [
      'Guaranteed returns',
      'Will 100x',
      'To the moon',
      'Earn passive income',
      'risk-free yield',
      'High profits',
    ]) {
      assert.match(
        errorsOf(mutate(good, (d) => (d['description'] = text))),
        /promissory or hype/,
        text,
      );
    }
  });

  it('rejects unsafe URLs', () => {
    for (const url of [
      'http://example.com/a.png',
      ['https://', 'u', ':', 'p', '@example.com/a.png'].join(''),
      'https://example.com/a.png?x=1',
      'not a url',
      5,
    ]) {
      assert.equal(
        validateMetadata(mutate(good, (d) => (d['image'] = url))).ok,
        false,
        String(url),
      );
    }
    assert.equal(
      validateMetadata(mutate(good, (d) => (d['image'] = 'https://example.com/baal.png'))).ok,
      true,
    );
  });

  it('does not allow placeholders once published', () => {
    assert.match(
      errorsOf(mutate(good, (d) => (d['status'] = 'published'))),
      /cannot be a placeholder once status is "published"/,
    );
  });

  it('rejects unknown fields, bad status and non-objects', () => {
    assert.match(errorsOf(mutate(good, (d) => (d['extra'] = 1))), /not an allowed field/);
    assert.match(errorsOf(mutate(good, (d) => (d['status'] = 'live'))), /status must be/);
    for (const junk of [null, [], 'x']) assert.equal(validateMetadata(junk).ok, false);
  });
});
