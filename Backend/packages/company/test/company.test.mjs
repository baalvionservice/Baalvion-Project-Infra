import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LEGAL_ENTITY_NAME,
  LEGAL_ENTITY_NAME_SHORT,
  BRAND_NAME,
  CIN,
  IS_PUBLICLY_LISTED,
  REGISTERED_ADDRESS,
  OPERATING_ADDRESS,
  formatAddress,
  copyrightLine,
  organizationJsonLd,
} from '../dist/index.mjs';

// The specific misstatement this package exists to stop. A US corporate suffix on an Indian
// private limited company is the kind of error that only ever gets noticed in diligence.
test('no US corporate form appears in any name constant', () => {
  for (const name of [LEGAL_ENTITY_NAME, LEGAL_ENTITY_NAME_SHORT, BRAND_NAME]) {
    assert.doesNotMatch(name, /\binc\.?\b/i, `"${name}" carries a US corporate form`);
    assert.doesNotMatch(name, /\b(llc|corp\.?|corporation)\b/i, `"${name}" carries a US corporate form`);
  }
});

test('the registered name is the full one, not the abbreviation', () => {
  assert.equal(LEGAL_ENTITY_NAME, 'Baalvion Industries Private Limited');
  assert.match(LEGAL_ENTITY_NAME_SHORT, /^Baalvion Industries Pvt\. Ltd\.$/);
});

test('CIN is a well-formed Indian corporate identity number', () => {
  // L/U + 5-digit industry + 2-letter state + 4-digit year + 3-letter class + 6-digit registration.
  assert.match(CIN, /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/);
  // "PTC" — private limited. A company that is not listed cannot publish stock information.
  assert.ok(CIN.includes('PTC'));
  assert.equal(IS_PUBLICLY_LISTED, false);
});

test('addresses format in Indian postal order', () => {
  assert.equal(
    formatAddress(OPERATING_ADDRESS),
    'Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India',
  );
  assert.match(formatAddress(REGISTERED_ADDRESS), /Odisha 764036, India$/);
});

test('the copyright line names the entity, and takes the year rather than reading the clock', () => {
  assert.equal(copyrightLine(2026), '© 2026 Baalvion Industries Private Limited. All rights reserved.');
  assert.equal(copyrightLine.length, 1);
});

test('structured data is an Organization, never a Corporation', () => {
  const block = organizationJsonLd({ url: 'https://ir.baalvion.com' });
  // schema.org defines Corporation as an organization with publicly traded shares.
  assert.equal(block['@type'], 'Organization');
  assert.equal(block.legalName, LEGAL_ENTITY_NAME);
  assert.equal(block.name, BRAND_NAME);
  assert.equal(block.address.addressRegion, 'Odisha');
});

test('structured data omits optional fields rather than emitting empty ones', () => {
  const bare = organizationJsonLd({ url: 'https://baalvion.com' });
  assert.ok(!('logo' in bare));
  assert.ok(!('sameAs' in bare));

  const full = organizationJsonLd({
    url: 'https://baalvion.com',
    logo: 'https://baalvion.com/logo.png',
    sameAs: ['https://www.linkedin.com/company/baalvion'],
    address: 'operating',
  });
  assert.equal(full.logo, 'https://baalvion.com/logo.png');
  assert.deepEqual(full.sameAs, ['https://www.linkedin.com/company/baalvion']);
  assert.equal(full.address.addressRegion, 'Maharashtra');
});
