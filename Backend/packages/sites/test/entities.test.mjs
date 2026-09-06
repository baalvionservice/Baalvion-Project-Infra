import test from 'node:test';
import assert from 'node:assert/strict';
import {
  legalEntityFor,
  checkLegalEntityConfig,
  assertLegalEntityConfig,
  declaredLegalEntities,
  legalEntityById,
} from '../dist/index.mjs';

// An explicit env object per test — never process.env, so these can never depend on or leak
// into the machine they run on.
const ENTITIES = JSON.stringify([
  { id: 'baalvion-in', name: 'Example India Private Limited', jurisdiction: 'in', baseCurrency: 'inr', taxId: null },
  { id: 'baalvion-sg', name: 'Example Pte Ltd', jurisdiction: 'SG', baseCurrency: 'SGD' },
]);

test('an unassigned site says so rather than guessing', () => {
  const a = legalEntityFor('ctm', {});
  assert.equal(a.legalEntityId, null);
  assert.equal(a.source, 'unassigned');
  assert.equal(a.declarationConfigured, false);
});

test('the default entity applies to every site that has no override', () => {
  const env = { LEGAL_ENTITY_DEFAULT: 'baalvion-in' };
  assert.equal(legalEntityFor('ctm', env).legalEntityId, 'baalvion-in');
  assert.equal(legalEntityFor('gti', env).source, 'env_default');
});

test('a per-site override beats the default', () => {
  const env = { LEGAL_ENTITY_DEFAULT: 'baalvion-in', LEGAL_ENTITY_GTI: 'baalvion-sg' };
  assert.equal(legalEntityFor('gti', env).legalEntityId, 'baalvion-sg');
  assert.equal(legalEntityFor('gti', env).source, 'env_site');
  assert.equal(legalEntityFor('ctm', env).legalEntityId, 'baalvion-in');
});

test('declared entities are normalised so two spellings cannot become two companies', () => {
  const entities = declaredLegalEntities({ LEGAL_ENTITIES_JSON: ENTITIES });
  assert.equal(entities.length, 2);
  assert.equal(entities[0].jurisdiction, 'IN');
  assert.equal(entities[0].baseCurrency, 'INR');
  assert.equal(entities[0].taxId, null);
  assert.equal(legalEntityById('baalvion-sg', { LEGAL_ENTITIES_JSON: ENTITIES }).name, 'Example Pte Ltd');
});

test('malformed declarations throw rather than half-loading a corporate structure', () => {
  const bad = [
    ['not json at all', /not valid JSON/],
    ['{"id":"x"}', /must be a JSON array/],
    ['[{"id":"Baalvion_IN","name":"n","jurisdiction":"IN","baseCurrency":"INR"}]', /lowercase kebab-case/],
    ['[{"id":"a","name":"n","jurisdiction":"IND","baseCurrency":"INR"}]', /alpha-2/],
    ['[{"id":"a","name":"n","jurisdiction":"IN","baseCurrency":"RUPEE"}]', /ISO 4217/],
    ['[{"id":"a","name":"n","jurisdiction":"IN","baseCurrency":"INR"},{"id":"a","name":"m","jurisdiction":"IN","baseCurrency":"INR"}]', /more than once/],
  ];
  for (const [json, pattern] of bad) {
    assert.throws(() => declaredLegalEntities({ LEGAL_ENTITIES_JSON: json }), pattern, `expected ${json} to be rejected`);
  }
});

test('an entity id that was never declared is a typo, and is caught', () => {
  // The whole point: `baalvion-lN` looks identical to `baalvion-in` in a terminal.
  const env = { LEGAL_ENTITIES_JSON: ENTITIES, LEGAL_ENTITY_DEFAULT: 'baalvion-1n' };
  const report = checkLegalEntityConfig({ env, siteIds: ['ctm'] });
  assert.equal(report.ok, false);
  assert.deepEqual(report.undeclared, [{ siteId: 'ctm', legalEntityId: 'baalvion-1n' }]);
  assert.throws(() => assertLegalEntityConfig({ env, siteIds: ['ctm'] }), /not declared/);
});

test('nothing declared means nothing is flagged as undeclared', () => {
  // Otherwise the check would block every deploy until the corporate structure is settled.
  const env = { LEGAL_ENTITY_DEFAULT: 'whatever-they-choose' };
  const report = checkLegalEntityConfig({ env, siteIds: ['ctm'] });
  assert.equal(report.declarationConfigured, false);
  assert.deepEqual(report.undeclared, []);
  assert.equal(report.ok, true);
});

test('strict mode is what refuses to boot with unassigned books', () => {
  assert.doesNotThrow(() => assertLegalEntityConfig({ env: {}, siteIds: ['ctm'] }));
  assert.throws(() => assertLegalEntityConfig({ env: {}, siteIds: ['ctm'], strict: true }), /No legal entity assigned/);
});

test('the check is scoped, so one property does not block an unrelated service', () => {
  const env = { LEGAL_ENTITY_CTM: 'baalvion-in', LEGAL_ENTITIES_JSON: ENTITIES };
  assert.equal(checkLegalEntityConfig({ env, siteIds: ['ctm'] }).ok, true);
  // gti is still unassigned, so the unscoped check is not ok.
  assert.equal(checkLegalEntityConfig({ env }).ok, false);
});
