import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePrimaryCategory } from './cms';

const fam = { id: 'a', name: 'Family & Personal', slug: 'family-law', parentId: null };
const biz = { id: 'b', name: 'Business & Corporate', slug: 'business', parentId: null };
const child = { id: 'c', name: 'Bail', slug: 'bail', parentId: 'a' };

test('uses the singular category when the API provides it', () => {
  assert.equal(resolvePrimaryCategory({ category: fam, categories: [biz], categoryId: 'b' })?.slug, 'family-law');
});

test('category null: the top-level categories[] entry named by categoryId is the primary', () => {
  assert.equal(resolvePrimaryCategory({ category: null, categories: [child, fam], categoryId: 'a' })?.slug, 'family-law');
});

test('category null and no categoryId: a single top-level category is used', () => {
  assert.equal(resolvePrimaryCategory({ category: null, categories: [fam, child] })?.slug, 'family-law');
});

test('several top-level categories with no primary signal are not guessed', () => {
  assert.equal(resolvePrimaryCategory({ category: null, categories: [fam, biz] }), undefined);
  assert.equal(resolvePrimaryCategory({ category: null, categories: [fam, biz], categoryId: 'zzz' }), undefined);
});

test('no category data resolves to nothing', () => {
  assert.equal(resolvePrimaryCategory({ category: null, categories: [] }), undefined);
});
