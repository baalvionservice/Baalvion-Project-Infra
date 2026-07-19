'use strict';

// Unit test for the premium-content gate in listPublicContent — verifies the per-item `access`
// field is computed correctly and that content.isPremium items are marked inaccessible for a
// caller with no paid subscription, WITHOUT a live database, Redis, or imperialpedia-service.
// (contentBlocks is already excluded from the list query entirely — see publicService.js — so
// there's no body-redaction path to test here, only the access metadata.)
//
// getPublicContent's cache+view-count path (which needs Redis + the full model surface) is
// intentionally left to the full-stack integration run rather than stubbed here — mirrors this
// file's sibling test/publicService.test.js, which also only exercises listPublicContent.
const path = require('path');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const MODELS_PATH = require.resolve(path.join(__dirname, '..', 'models'));
const ENTITLEMENT_CLIENT_PATH = require.resolve(path.join(__dirname, '..', 'service', 'entitlementClient'));

let contentRows;
let subscriptionToReturn;
let getSubscriptionCalls;

function makeModelsStub() {
    const CmsWebsite = {
        async findOne({ where }) {
            if (where.slug === 'imperialpedia' && where.status === 'active') {
                return { id: 'site-1', toJSON: () => ({ id: 'site-1', slug: 'imperialpedia' }) };
            }
            return null;
        },
    };
    const CmsContent = {
        async findAndCountAll({ where }) {
            const rows = contentRows.filter((r) => r.websiteId === where.websiteId);
            return { rows: rows.map((r) => ({ ...r, toJSON: () => r })), count: rows.length };
        },
    };
    return { CmsWebsite, CmsContent, CmsCategory: {}, CmsTag: {}, CmsAuthor: {} };
}

function makeEntitlementClientStub() {
    return {
        async getSubscription(userId) {
            getSubscriptionCalls += 1;
            return userId ? subscriptionToReturn : null;
        },
        async resolveAccess() { throw new Error('not used by listPublicContent'); },
    };
}

function loadService() {
    require.cache[MODELS_PATH] = { id: MODELS_PATH, filename: MODELS_PATH, loaded: true, exports: makeModelsStub() };
    require.cache[ENTITLEMENT_CLIENT_PATH] = { id: ENTITLEMENT_CLIENT_PATH, filename: ENTITLEMENT_CLIENT_PATH, loaded: true, exports: makeEntitlementClientStub() };
    delete require.cache[require.resolve('../service/publicService')];
    delete require.cache[require.resolve('../service/contentService')];
    return require('../service/publicService');
}

beforeEach(() => {
    getSubscriptionCalls = 0;
    subscriptionToReturn = null;
    contentRows = [
        { id: 'c1', websiteId: 'site-1', title: 'Free Article', isPremium: false },
        { id: 'c2', websiteId: 'site-1', title: 'Premium Deep Dive', isPremium: true },
    ];
});

test('anonymous caller: free content accessible, premium content marked inaccessible', async () => {
    const publicService = loadService();
    const { data } = await publicService.listPublicContent('imperialpedia', {});

    const free = data.find((d) => d.id === 'c1');
    const premium = data.find((d) => d.id === 'c2');
    assert.equal(free.access.hasAccess, true);
    assert.equal(premium.access.isPremium, true);
    assert.equal(premium.access.hasAccess, false);
});

test('subscribed caller: premium content marked accessible', async () => {
    subscriptionToReturn = { status: 'active', tierKey: 'tier-pro', currentPeriodEnd: null };
    const publicService = loadService();
    const { data } = await publicService.listPublicContent('imperialpedia', {}, { callerId: 'user-paid' });

    const premium = data.find((d) => d.id === 'c2');
    assert.equal(premium.access.hasAccess, true);
});

test('one subscription lookup for the whole page, not one per row (no N+1)', async () => {
    subscriptionToReturn = { status: 'active', tierKey: 'tier-pro', currentPeriodEnd: null };
    const publicService = loadService();
    await publicService.listPublicContent('imperialpedia', {}, { callerId: 'user-paid' });

    assert.equal(getSubscriptionCalls, 1);
});

test('free-tier subscriber (no active paid plan) still denied premium content', async () => {
    subscriptionToReturn = { status: 'canceled', tierKey: 'tier-pro', currentPeriodEnd: null };
    const publicService = loadService();
    const { data } = await publicService.listPublicContent('imperialpedia', {}, { callerId: 'user-lapsed' });

    const premium = data.find((d) => d.id === 'c2');
    assert.equal(premium.access.hasAccess, false);
});
