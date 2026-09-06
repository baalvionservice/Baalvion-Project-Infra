import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articleDates, toIsoDate } from './normalize-date';

test('converts a human-readable bundled/seed date to ISO 8601', () => {
  assert.equal(toIsoDate('June 18, 2026'), '2026-06-18T00:00:00.000Z');
});

test('preserves an already-valid ISO 8601 timestamp', () => {
  assert.equal(toIsoDate('2026-07-03T12:11:55.817Z'), '2026-07-03T12:11:55.817Z');
});

test('preserves an already-valid ISO 8601 date-only string as midnight UTC', () => {
  assert.equal(toIsoDate('2026-07-03'), '2026-07-03T00:00:00.000Z');
});

test('returns undefined for missing input rather than fabricating a date', () => {
  assert.equal(toIsoDate(undefined), undefined);
  assert.equal(toIsoDate(null), undefined);
  assert.equal(toIsoDate(''), undefined);
  assert.equal(toIsoDate('   '), undefined);
});

test('returns undefined for an unparseable date rather than fabricating one', () => {
  assert.equal(toIsoDate('not a date'), undefined);
  assert.equal(toIsoDate('TBD'), undefined);
});

test('human-readable date conversion is independent of the server timezone', () => {
  const originalTz = process.env.TZ;
  try {
    for (const tz of ['UTC', 'Pacific/Kiritimati', 'Pacific/Niue']) {
      process.env.TZ = tz;
      assert.equal(toIsoDate('June 18, 2026'), '2026-06-18T00:00:00.000Z', `mismatch for TZ=${tz}`);
    }
  } finally {
    process.env.TZ = originalTz;
  }
});

/**
 * articleDates() exists because of a live bug: every CMS-served article page
 * emitted OpenGraph dates correctly while its Article JSON-LD carried no
 * datePublished or dateModified at all. The metadata fetch maps CMS fields to
 * snake_case; the render fetch returns the raw CMS record, which is camelCase.
 * Reading one shape produced undated legal guidance across a YMYL site.
 */

test('articleDates reads the snake_case shape from the metadata path', () => {
  const d = articleDates({ published_at: '2026-08-09T19:57:21.097Z', updated_at: '2026-08-11T09:00:00.000Z' });
  assert.equal(d.published, '2026-08-09T19:57:21.097Z');
  assert.equal(d.modified, '2026-08-11T09:00:00.000Z');
});

test('articleDates reads the camelCase shape from the raw CMS render path', () => {
  const d = articleDates({ publishedAt: '2026-08-09T19:57:21.097Z', updatedAt: '2026-08-11T09:00:00.000Z' });
  assert.equal(d.published, '2026-08-09T19:57:21.097Z');
  assert.equal(d.modified, '2026-08-11T09:00:00.000Z');
});

test('articleDates treats an update timestamp alone as dating the article', () => {
  // The exact live case: CMS records carrying only updatedAt.
  const d = articleDates({ updatedAt: '2026-08-09T19:57:21.097Z' });
  assert.equal(d.published, '2026-08-09T19:57:21.097Z');
  assert.equal(d.modified, '2026-08-09T19:57:21.097Z');
});

test('articleDates prefers snake_case when a record carries both spellings', () => {
  const d = articleDates({ published_at: '2026-01-01T00:00:00.000Z', publishedAt: '2020-01-01T00:00:00.000Z' });
  assert.equal(d.published, '2026-01-01T00:00:00.000Z');
});

test('articleDates leaves a dateless record dateless — no date is invented', () => {
  const d = articleDates({ title: 'Maritime Injury Lawyer' });
  assert.equal(d.published, undefined);
  assert.equal(d.modified, undefined);
});

test('articleDates tolerates null, undefined and unparseable values', () => {
  assert.deepEqual(articleDates(null), { published: undefined, modified: undefined });
  assert.deepEqual(articleDates(undefined), { published: undefined, modified: undefined });
  assert.deepEqual(articleDates({ published_at: 'not a date' }), { published: undefined, modified: undefined });
});
