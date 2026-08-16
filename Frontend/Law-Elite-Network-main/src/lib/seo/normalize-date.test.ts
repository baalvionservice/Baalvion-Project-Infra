import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toIsoDate } from './normalize-date';

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
