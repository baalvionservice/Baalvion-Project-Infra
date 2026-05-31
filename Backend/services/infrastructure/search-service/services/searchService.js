'use strict';
// Thin domain layer over @baalvion/search (OpenSearch). Adds: index whitelisting,
// and TENANT SCOPING — every search/facet is automatically filtered by the caller's
// tenant (orgId, present on every index mapping) unless the caller has bypass
// (super_admin) or explicitly opts out. This ties search into @baalvion/tenancy.
const s = require('@baalvion/search');
const { getTenantContext } = require('@baalvion/tenancy');
const { Errors } = require('../utils/errors');

const INDEX_SET = new Set(Object.values(s.INDICES));

function assertIndex(index) {
    if (!INDEX_SET.has(index)) {
        throw Errors.badRequest(`Unknown index '${index}'. Allowed: ${[...INDEX_SET].join(', ')}`);
    }
}

/** Add the tenant term-filter (orgId) unless bypass or scoped=false. Pure → unit-testable. */
function scopedFilters(filters = {}, { scoped = true, ctx } = {}) {
    const c = ctx || getTenantContext();
    if (!scoped || c.bypass || !c.tenantId) return { ...filters };
    return { ...filters, orgId: String(c.tenantId) };
}

async function ensureIndices() {
    const out = {};
    for (const idx of Object.values(s.INDICES)) { await s.createIndex(idx, s.INDEX_MAPPINGS[idx]); out[idx] = 'ready'; }
    return out;
}

async function searchIndex(index, opts = {}) {
    assertIndex(index);
    const { q = '', filters = {}, from = 0, size = 20, sort, highlight, fuzzy = false, scoped = true } = opts;
    return s.search({ index, query: q, filters: scopedFilters(filters, { scoped }), from, size, sort, highlight, fuzzy });
}

async function autocompleteIndex(index, field, prefix, size = 10) {
    assertIndex(index);
    return s.autocomplete(index, field, prefix, size);
}

async function facets(index, q, facetFields, opts = {}) {
    assertIndex(index);
    return s.facetedSearch(index, q || '', facetFields, {
        filters: scopedFilters(opts.filters || {}, { scoped: opts.scoped }),
        from: opts.from, size: opts.size,
    });
}

async function indexDoc(index, id, doc)      { assertIndex(index); await s.indexDocument(index, id, doc);    return { index, id, indexed: true }; }
async function updateDoc(index, id, partial) { assertIndex(index); await s.updateDocument(index, id, partial); return { index, id, updated: true }; }
async function deleteDoc(index, id)          { assertIndex(index); await s.deleteDocument(index, id);        return { index, id, deleted: true }; }
async function bulk(index, items)            { assertIndex(index); return s.bulkIndex(index, items); }

async function health() {
    try {
        const res = await s.searchClient.cluster.health();
        return { reachable: true, status: res.body?.status, cluster: res.body?.cluster_name };
    } catch (e) {
        return { reachable: false, error: e.message };
    }
}

const indices = () => [...INDEX_SET];

module.exports = {
    INDICES: s.INDICES, assertIndex, scopedFilters, ensureIndices,
    searchIndex, autocompleteIndex, facets, indexDoc, updateDoc, deleteDoc, bulk, health, indices,
};
