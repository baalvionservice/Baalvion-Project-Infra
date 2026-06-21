'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseListQuery, paginate } = require('../utils/query');

const SORTABLE = ['created_at', 'legal_name', 'status'];

test('parseListQuery: applies defaults when query is empty', () => {
    const r = parseListQuery({}, { sortable: SORTABLE });
    assert.equal(r.page, 1);
    assert.equal(r.limit, 20);
    assert.equal(r.offset, 0);
    assert.deepEqual(r.order, [['created_at', 'DESC']]);
});

test('parseListQuery: computes offset from page and limit', () => {
    const r = parseListQuery({ page: '3', limit: '10' }, { sortable: SORTABLE });
    assert.equal(r.page, 3);
    assert.equal(r.limit, 10);
    assert.equal(r.offset, 20);
});

test('parseListQuery: caps limit at maxLimit', () => {
    const r = parseListQuery({ limit: '5000' }, { sortable: SORTABLE });
    assert.equal(r.limit, 100);
});

test('parseListQuery: honours per-call defaultLimit and maxLimit', () => {
    const r = parseListQuery({ limit: '300' }, { sortable: SORTABLE, defaultLimit: 50, maxLimit: 200 });
    assert.equal(r.limit, 200);
    const d = parseListQuery({}, { sortable: SORTABLE, defaultLimit: 50, maxLimit: 200 });
    assert.equal(d.limit, 50);
});

test('parseListQuery: invalid page/limit fall back to safe defaults', () => {
    const r = parseListQuery({ page: '-2', limit: 'abc' }, { sortable: SORTABLE });
    assert.equal(r.page, 1);
    assert.equal(r.limit, 20);
});

test('parseListQuery: accepts an allowlisted sort column with direction', () => {
    const r = parseListQuery({ sort: 'legal_name', order: 'asc' }, { sortable: SORTABLE });
    assert.deepEqual(r.order, [['legal_name', 'ASC']]);
    assert.equal(r.sort, 'legal_name');
    assert.equal(r.dir, 'ASC');
});

test('parseListQuery: supports sortBy/dir aliases', () => {
    const r = parseListQuery({ sortBy: 'status', dir: 'desc' }, { sortable: SORTABLE });
    assert.deepEqual(r.order, [['status', 'DESC']]);
});

test('parseListQuery: rejects a non-allowlisted sort column', () => {
    assert.throws(
        () => parseListQuery({ sort: 'password' }, { sortable: SORTABLE }),
        (err) => err.code === 'INVALID_SORT' && err.statusCode === 400,
    );
});

test('parseListQuery: rejects an invalid order direction', () => {
    assert.throws(
        () => parseListQuery({ sort: 'status', order: 'sideways' }, { sortable: SORTABLE }),
        (err) => err.code === 'INVALID_ORDER' && err.statusCode === 400,
    );
});

test('paginate: shapes the paginated payload and computes totalPages', () => {
    const r = paginate({ rows: [1, 2], count: 42, page: 2, limit: 20 });
    assert.deepEqual(r.items, [1, 2]);
    assert.equal(r.total, 42);
    assert.equal(r.page, 2);
    assert.equal(r.limit, 20);
    assert.equal(r.totalPages, 3);
});

test('paginate: totalPages is 0 for an empty result set', () => {
    const r = paginate({ rows: [], count: 0, page: 1, limit: 20 });
    assert.equal(r.totalPages, 0);
});
