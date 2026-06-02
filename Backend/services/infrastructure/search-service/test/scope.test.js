'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { runWithTenant } = require('@baalvion/tenancy');
const svc = require('../services/searchService');

test('scopedFilters injects orgId from the tenant context', () => {
    runWithTenant({ tenantId: 'org-9' }, () => {
        assert.deepEqual(svc.scopedFilters({ category: 'news' }), { category: 'news', orgId: 'org-9' });
    });
});

test('scopedFilters does NOT inject when bypass (super_admin)', () => {
    runWithTenant({ tenantId: 'org-9', bypass: true }, () => {
        assert.deepEqual(svc.scopedFilters({ category: 'news' }), { category: 'news' });
    });
});

test('scopedFilters respects scoped=false (cross-tenant search)', () => {
    runWithTenant({ tenantId: 'org-9' }, () => {
        assert.deepEqual(svc.scopedFilters({}, { scoped: false }), {});
    });
});

test('scopedFilters no-ops with no tenant context', () => {
    assert.deepEqual(svc.scopedFilters({ a: 1 }), { a: 1 });
});

test('assertIndex rejects unknown indices', () => {
    assert.throws(() => svc.assertIndex('not_an_index'), /Unknown index/);
    assert.doesNotThrow(() => svc.assertIndex(svc.INDICES.JOBS));
});
