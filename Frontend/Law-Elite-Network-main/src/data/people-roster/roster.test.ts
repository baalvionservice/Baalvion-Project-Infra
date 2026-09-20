import { test } from 'node:test';
import assert from 'node:assert';
import { PEOPLE } from '../people';
import { PERSON_CATEGORIES } from '../../types/person';
import { COUNTRIES, ORIGIN_ONLY_COUNTRIES } from '../../lib/countries';

const countryCodes = new Set([...COUNTRIES.map((c) => c.code), ...Object.keys(ORIGIN_ONLY_COUNTRIES)]);

test('every person has a unique slug and a unique name', () => {
  const slugs = new Set<string>();
  const names = new Set<string>();
  for (const p of PEOPLE) {
    assert.ok(!slugs.has(p.slug), `duplicate slug ${p.slug}`);
    slugs.add(p.slug);
    const n = p.fullName.toLowerCase();
    assert.ok(!names.has(n), `duplicate name ${p.fullName}`);
    names.add(n);
  }
});

test('slugs are clean URL segments', () => {
  for (const p of PEOPLE) assert.match(p.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, p.slug);
});

test('every person uses a known category and a known country', () => {
  const cats = new Set(PERSON_CATEGORIES.map((c) => c.slug as string));
  for (const p of PEOPLE) {
    assert.ok(cats.has(p.category), `${p.slug}: category ${p.category}`);
    if (p.countryCode) assert.ok(countryCodes.has(p.countryCode), `${p.slug}: country ${p.countryCode}`);
  }
});

test('roster profiles are never marked verified and have a non-trivial biography', () => {
  for (const p of PEOPLE.filter((x) => x.verification.sourceNote?.includes('Not yet editorially reviewed'))) {
    assert.equal(p.verification.verified, false, p.slug);
    assert.ok(p.biography.length > 25, p.slug);
  }
});

test('every category has at least 75 profiles', () => {
  for (const c of PERSON_CATEGORIES) {
    const n = PEOPLE.filter((p) => p.category === c.slug).length;
    assert.ok(n >= 75, `${c.slug} has only ${n}`);
  }
});
