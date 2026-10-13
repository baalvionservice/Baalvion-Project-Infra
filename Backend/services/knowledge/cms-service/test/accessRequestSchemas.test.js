'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAccessRequestSchema, approveAccessRequestSchema, REQUESTABLE_ROLES } = require('../validators/accessRequestSchemas');

const SITE = '832801e6-4e6c-4751-9c2b-5013b6e7ad03';

test('a request defaults to the Writer role', () => {
  const parsed = createAccessRequestSchema.parse({ websiteId: SITE });
  assert.equal(parsed.role, 'cms_author');
});

test('nobody can request admin rights for themselves', () => {
  assert.equal(REQUESTABLE_ROLES.includes('cms_admin'), false);
  assert.equal(createAccessRequestSchema.safeParse({ websiteId: SITE, role: 'cms_admin' }).success, false);
  assert.equal(approveAccessRequestSchema.safeParse({ role: 'cms_admin' }).success, false);
});

test('a request must name a real website id', () => {
  assert.equal(createAccessRequestSchema.safeParse({ websiteId: 'amarise' }).success, false);
  assert.equal(createAccessRequestSchema.safeParse({}).success, false);
});

test('the note is trimmed and length-capped', () => {
  assert.equal(createAccessRequestSchema.parse({ websiteId: SITE, note: '  hello  ' }).note, 'hello');
  assert.equal(createAccessRequestSchema.safeParse({ websiteId: SITE, note: 'x'.repeat(1001) }).success, false);
});
