import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SITES,
  siteForHost,
  siteIdForHost,
  assertSiteForHost,
  siteById,
  classifyHost,
  normalizeHost,
  railsFor,
  isRailAllowed,
  isRailConfirmed,
  assertRailAllowed,
  sitesWithRails,
  SiteRegistryError,
} from '../dist/index.mjs';

// ---------------------------------------------------------------- the split that matters

test('community.marketunderworld.com is its own site, not the insiders apex', () => {
  // auth-service currently suffix-matches this apex and would call both 'marketunderworld'.
  // They are different products with different payment rails, so they must not collapse.
  assert.equal(siteIdForHost('community.marketunderworld.com'), 'community');
  assert.equal(siteIdForHost('marketunderworld.com'), 'insiders');
  assert.notEqual(siteIdForHost('community.marketunderworld.com'), siteIdForHost('marketunderworld.com'));
});

test('an unclaimed subdomain of a non-owning apex does not resolve', () => {
  // insiders does not own its subdomains, so a stray one is unknown rather than misattributed.
  assert.equal(siteForHost('shop.marketunderworld.com'), null);
  // copyrightvideo.controlthemarket.com was a phantom row in the old registry.
  assert.equal(siteForHost('copyrightvideo.controlthemarket.com'), null);
});

test('every *.baalvion.com subdomain is a distinct product', () => {
  assert.equal(siteIdForHost('jobs.baalvion.com'), 'jobs');
  assert.equal(siteIdForHost('trade.baalvion.com'), 'gti');
  assert.equal(siteIdForHost('ships.baalvion.com'), 'ships');
  assert.equal(siteIdForHost('ir.baalvion.com'), 'ir');
  assert.equal(siteIdForHost('signal.baalvion.com'), 'signal');
  assert.equal(siteIdForHost('baalvion.com'), 'baalvion');
  // The apex must not swallow an unregistered subdomain.
  assert.equal(siteForHost('nonsense.baalvion.com'), null);
});

test('an apex that does own its subdomains still resolves them', () => {
  assert.equal(siteIdForHost('proxy.baalvionstack.com'), 'proxy');
  assert.equal(siteIdForHost('anything.proxy.baalvionstack.com'), 'proxy');
});

// ---------------------------------------------------------------- infrastructure

test('infrastructure hosts resolve to no site', () => {
  for (const host of ['api.baalvion.com', 'auth.baalvion.com', 'files.baalvion.com', 'meet.baalvion.com', 'imperialpedia.baalvion.com']) {
    assert.equal(siteForHost(host), null, `${host} must not be a site`);
    assert.equal(classifyHost(host), 'infrastructure');
  }
});

test('a host found in code but not classified is reported as unclassified, not a site', () => {
  assert.equal(classifyHost('market.baalvion.com'), 'unclassified');
  assert.equal(siteForHost('market.baalvion.com'), null);
});

// ---------------------------------------------------------------- normalisation

test('normalises ports, protocols, case and trailing dots', () => {
  assert.equal(normalizeHost('https://Community.MarketUnderworld.com/foo'), 'community.marketunderworld.com');
  assert.equal(normalizeHost('controlthemarket.com:443'), 'controlthemarket.com');
  assert.equal(normalizeHost('controlthemarket.com.'), 'controlthemarket.com');
  assert.equal(siteIdForHost('https://www.amarisemaisonavenue.com'), 'amarise');
  assert.equal(siteIdForHost('WWW.BAALVION.COM'), 'baalvion');
  assert.equal(normalizeHost(''), '');
  assert.equal(siteForHost(''), null);
});

// ---------------------------------------------------------------- money paths fail closed

test('an unknown host throws on the money path instead of defaulting', () => {
  assert.throws(() => assertSiteForHost('evil.example.com'), (e) => e instanceof SiteRegistryError && e.code === 'UNKNOWN_HOST');
  // The nullable lookup stays nullable for presentation concerns.
  assert.equal(siteForHost('evil.example.com'), null);
});

test('the four owner-confirmed payment sites carry their rails', () => {
  assert.deepEqual([...railsFor('ctm')], ['razorpay', 'payu', 'bank_transfer']);
  assert.deepEqual([...railsFor('gti')], ['razorpay', 'bank_transfer']);
  assert.deepEqual([...railsFor('community')], ['crypto']);
  assert.deepEqual([...railsFor('proxy')], ['razorpay', 'payu', 'bank_transfer']);

  for (const id of ['ctm', 'gti', 'community', 'proxy']) {
    assert.equal(siteById(id).railsBasis, 'confirmed', `${id} rails must be owner-confirmed`);
  }
});

test('a rail is only usable where it was granted', () => {
  assert.ok(isRailAllowed('community', 'crypto'));
  assert.equal(isRailAllowed('community', 'razorpay'), false);
  assert.equal(isRailAllowed('ctm', 'crypto'), false);
  assert.throws(() => assertRailAllowed('ctm', 'crypto'), (e) => e.code === 'RAIL_NOT_PERMITTED');
  assert.doesNotThrow(() => assertRailAllowed('ctm', 'razorpay'));
});

test('a site with no rails cannot take money at all', () => {
  // imperialpedia-service ships a complete Razorpay checkout, but its frontend has no checkout
  // UI at all, so nothing can charge there yet — the rails stay empty until one exists.
  assert.throws(() => assertRailAllowed('imperialpedia', 'razorpay'), (e) => e.code === 'NO_RAILS_CONFIGURED');
  assert.throws(() => assertRailAllowed('jobs', 'razorpay'), (e) => e.code === 'NO_RAILS_CONFIGURED');
  assert.equal(isRailAllowed('imperialpedia', 'razorpay'), false);
});

test('code-inferred rails are usable but not confirmed', () => {
  // Amarisé is live and its adapters are real, so charging works; the basis still says the
  // grant has not been confirmed by a human.
  assert.ok(isRailAllowed('amarise', 'razorpay'));
  assert.equal(isRailConfirmed('amarise', 'razorpay'), false);
  assert.ok(isRailConfirmed('community', 'crypto'));
});

test('an unknown site id throws rather than returning empty rails', () => {
  assert.throws(() => railsFor('does-not-exist'), (e) => e.code === 'UNKNOWN_SITE_ID');
  assert.equal(siteById('does-not-exist'), null);
});

// ---------------------------------------------------------------- registry integrity

test('registry is internally consistent', () => {
  assert.equal(SITES.length, 19);
  const ids = SITES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'site ids must be unique');

  const domains = SITES.flatMap((s) => s.domains);
  assert.equal(new Set(domains).size, domains.length, 'a domain may be claimed by only one site');

  for (const s of SITES) {
    assert.ok(s.domains.length > 0, `${s.id} needs at least one domain`);
    for (const d of s.domains) assert.equal(d, d.toLowerCase(), `${d} must be lowercase`);
    assert.ok(['live', 'not_live', 'internal'].includes(s.status), `${s.id} status`);
    if (s.rails.length === 0) assert.equal(s.railsBasis, 'none', `${s.id} with no rails must have basis 'none'`);
    if (s.rails.length > 0) assert.notEqual(s.railsBasis, 'none', `${s.id} with rails must record a basis`);
    // Every domain resolves back to its own site.
    assert.equal(siteIdForHost(s.domains[0]), s.id, `${s.domains[0]} must resolve to ${s.id}`);
  }
});

test('legal entity is unset everywhere and blocks ledger work', () => {
  // Recorded deliberately: the chart of accounts cannot be designed until this is answered.
  assert.ok(SITES.every((s) => s.legalEntity === null));
});

test('exactly the sites with a working charge path carry rails', () => {
  // law, signal and insiders were audited as having no revenue source and were later found to
  // charge anyway (law-service and developer-service ship live Razorpay integrations; insiders
  // sells Elite Circle membership through payment-service). A site that can charge but declares
  // no rails is the dangerous case: the spine refuses its own captures, so the money is taken
  // and never reported.
  assert.deepEqual(
    sitesWithRails().map((s) => s.id).sort(),
    ['amarise', 'community', 'ctm', 'gti', 'insiders', 'law', 'proxy', 'signal'],
  );
});

test('rails granted to a site are ones its code can actually settle on', () => {
  // Guards against granting a rail nobody implemented — the spine would accept a capture filed
  // under a provider the site cannot take money with.
  assert.deepEqual(railsFor('law'), ['razorpay']);
  assert.deepEqual(railsFor('signal'), ['razorpay']);
  // No Stripe anywhere on this estate: there is no Stripe merchant account behind it.
  assert.ok(!railsFor('insiders').includes('stripe'));
  assert.ok(!railsFor('law').includes('stripe'));
  assert.ok(!railsFor('signal').includes('stripe'));
});

// ---------------------------------------------------------------- legal entities

import { legalEntityFor, legalEntityAssignments, sitesWithoutLegalEntity, assertLegalEntityFor } from '../dist/index.mjs';

test('an unassigned site says so rather than inventing a placeholder', () => {
  // A placeholder entity looks like a decision that has been made; the first sign of trouble
  // would be a tax filing.
  const a = legalEntityFor('gti', {});
  assert.equal(a.legalEntityId, null);
  assert.equal(a.source, 'unassigned');
  assert.equal(sitesWithoutLegalEntity({}).length, 19);
});

test('a per-site override wins, then the registry, then the default', () => {
  const override = legalEntityFor('gti', { LEGAL_ENTITY_GTI: 'baalvion-sg', LEGAL_ENTITY_DEFAULT: 'baalvion-in' });
  assert.equal(override.legalEntityId, 'baalvion-sg');
  assert.equal(override.source, 'env_site');

  const fallback = legalEntityFor('gti', { LEGAL_ENTITY_DEFAULT: 'baalvion-in' });
  assert.equal(fallback.legalEntityId, 'baalvion-in');
  assert.equal(fallback.source, 'env_default');
});

test('assigning entities is configuration, not a code change', () => {
  // The whole point: the decision can be made later without re-posting a single ledger line.
  const env = { LEGAL_ENTITY_DEFAULT: 'baalvion-in', LEGAL_ENTITY_COMMUNITY: 'baalvion-sg' };
  assert.equal(sitesWithoutLegalEntity(env).length, 0);
  const assignments = legalEntityAssignments(env);
  assert.equal(assignments.find((a) => a.siteId === 'community').legalEntityId, 'baalvion-sg');
  assert.equal(assignments.find((a) => a.siteId === 'ctm').legalEntityId, 'baalvion-in');
});

test('a path that truly needs an entity refuses to guess one', () => {
  assert.throws(() => assertLegalEntityFor('gti', {}), /No legal entity assigned/);
  assert.equal(assertLegalEntityFor('gti', { LEGAL_ENTITY_GTI: 'e1' }), 'e1');
});

test('an unknown site is rejected before any entity lookup', () => {
  assert.throws(() => legalEntityFor('nope', {}), (e) => e.code === 'UNKNOWN_SITE_ID');
});
