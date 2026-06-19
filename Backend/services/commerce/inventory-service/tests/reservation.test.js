'use strict';
// Pure unit test for the reservation state machine + oversell guard. No Postgres: the `../models`
// module is replaced in require.cache with an in-memory stub BEFORE reservationService is required
// (mirrors how order-service tests inject stubbed services). The stub emulates the row-lock + atomic
// reserve semantics the real Sequelize transaction provides — what we assert is the SERVICE LOGIC
// (guard, decrement, idempotency, state transitions), not Sequelize itself.
const path = require('path');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const MODELS_PATH = require.resolve(path.join(__dirname, '..', 'models'));

// ── In-memory stub state ─────────────────────────────────────────────────────
let stockRows;        // keyed by `${storeId}::${sku}`
let reservationRows;  // keyed by id
let movementRows;
let idSeq;

function stockKey(storeId, sku) { return `${storeId}::${sku}`; }

function makeStub() {
    const InventoryStock = {
        async findOne({ where }) {
            const row = stockRows.get(stockKey(where.storeId, where.sku));
            if (!row) return null;
            return {
                ...row,
                async update(patch, _opts) { Object.assign(row, patch); Object.assign(this, patch); },
            };
        },
        async findAll({ where }) {
            const skus = where && where.sku && where.sku[Symbol.for('op_in')];
            const out = [];
            for (const row of stockRows.values()) {
                if (where.storeId && row.storeId !== where.storeId) continue;
                if (skus && !skus.includes(row.sku)) continue;
                out.push({ ...row });
            }
            return out;
        },
    };

    const InventoryReservation = {
        async findOne({ where }) {
            const row = reservationRows.get(where.id);
            if (!row) return null;
            return {
                ...row,
                async update(patch) { Object.assign(row, patch); Object.assign(this, patch); },
            };
        },
        async findAll({ where }) {
            const out = [];
            for (const row of reservationRows.values()) {
                if (where.status && row.status !== where.status) continue;
                if (where.storeId && row.storeId !== where.storeId) continue;
                if (where.sku && row.sku !== where.sku) continue;
                if (where.expiresAt) {
                    const lt = where.expiresAt[Symbol.for('op_lt')];
                    if (lt && !(new Date(row.expiresAt) < lt)) continue;
                }
                out.push({ ...row });
            }
            return out;
        },
        async create(data) {
            const id = `res-${idSeq++}`;
            const row = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
            reservationRows.set(id, row);
            return { ...row, async update(patch) { Object.assign(row, patch); Object.assign(this, patch); } };
        },
    };

    const InventoryMovement = {
        async create(data) { movementRows.push(data); return data; },
    };

    const InventoryWarehouse = {
        async findOne() { return { id: 'wh-default', isDefault: true, isActive: true }; },
    };

    // Transaction stub: real code relies on row locks for atomicity; the stub runs the callback
    // serially (single-threaded test) which is sufficient to exercise the guard/decrement logic.
    const sequelize = {
        async transaction(fn) {
            const t = { LOCK: { UPDATE: 'UPDATE' } };
            return fn(t);
        },
    };

    // Op stub mapping the operators the service uses to symbol keys read above.
    const Op = { in: Symbol.for('op_in'), lt: Symbol.for('op_lt') };

    return { InventoryStock, InventoryReservation, InventoryMovement, InventoryWarehouse, sequelize, Op };
}

function loadService() {
    // Inject the models stub into the cache, then (re)require the service fresh.
    const stub = makeStub();
    require.cache[MODELS_PATH] = { id: MODELS_PATH, filename: MODELS_PATH, loaded: true, exports: stub };
    delete require.cache[require.resolve('../service/reservationService')];
    // The service imports `Op` from 'sequelize' directly — patch require.cache for that too so the
    // service's Op symbols match the stub's where-clause keys.
    const seqPath = require.resolve('sequelize');
    require.cache[seqPath] = { id: seqPath, filename: seqPath, loaded: true, exports: { Op: stub.Op } };
    return require('../service/reservationService');
}

const STORE = '11111111-1111-1111-1111-111111111111';
const SKU = 'LUX-BAG-0001'; // unique luxury item

beforeEach(() => {
    stockRows = new Map();
    reservationRows = new Map();
    movementRows = [];
    idSeq = 1;
    process.env.INVENTORY_LOCK_TTL_MINUTES = '15';
});

function seedStock({ quantity = 1, reservedQuantity = 0 } = {}) {
    stockRows.set(stockKey(STORE, SKU), {
        storeId: STORE, sku: SKU, productId: 'prod-1', variantId: null, warehouseId: 'wh-1',
        quantity, reservedQuantity, lowStockThreshold: 5, status: 'in_stock', updatedAt: new Date(),
    });
}

test('lock reserves stock and returns a LockResult with TTL', async () => {
    seedStock({ quantity: 1 });
    const svc = loadService();
    const r = await svc.lock({ storeId: STORE, variantId: SKU, userId: 'user-9', quantity: 1 });
    assert.ok(r.lockId, 'lockId present');
    assert.equal(r.variantId, SKU);
    assert.equal(r.userId, 'user-9');
    assert.equal(r.quantity, 1);
    assert.equal(r.ttlMinutes, 15);
    assert.ok(typeof r.expiresAt === 'string' && !Number.isNaN(Date.parse(r.expiresAt)), 'expiresAt is ISO');
    assert.equal(stockRows.get(stockKey(STORE, SKU)).reservedQuantity, 1, 'reserved incremented');
});

test('insufficient stock throws 409 CONFLICT and does NOT reserve (no oversell)', async () => {
    seedStock({ quantity: 1, reservedQuantity: 1 }); // available = 0
    const svc = loadService();
    await assert.rejects(
        () => svc.lock({ storeId: STORE, variantId: SKU, userId: 'u', quantity: 1 }),
        (err) => { assert.equal(err.statusCode, 409); assert.equal(err.code, 'CONFLICT'); return true; },
    );
    assert.equal(stockRows.get(stockKey(STORE, SKU)).reservedQuantity, 1, 'reserved unchanged on failure');
});

test('second lock on a single unique item is rejected (unique luxury item cannot oversell)', async () => {
    seedStock({ quantity: 1 });
    const svc = loadService();
    await svc.lock({ storeId: STORE, variantId: SKU, userId: 'buyer-A', quantity: 1 });
    await assert.rejects(
        () => svc.lock({ storeId: STORE, variantId: SKU, userId: 'buyer-B', quantity: 1 }),
        (err) => err.statusCode === 409,
    );
    assert.equal(stockRows.get(stockKey(STORE, SKU)).reservedQuantity, 1, 'only one hold exists');
});

test('release decrements reserved and is idempotent', async () => {
    seedStock({ quantity: 2 });
    const svc = loadService();
    const r = await svc.lock({ storeId: STORE, variantId: SKU, userId: 'u', quantity: 1 });
    assert.equal(stockRows.get(stockKey(STORE, SKU)).reservedQuantity, 1);

    const first = await svc.release(r.lockId);
    assert.deepEqual(first, { released: true });
    assert.equal(stockRows.get(stockKey(STORE, SKU)).reservedQuantity, 0, 'reserved decremented');
    assert.equal(reservationRows.get(r.lockId).status, 'released');

    const second = await svc.release(r.lockId); // idempotent: no double-decrement
    assert.deepEqual(second, { released: true });
    assert.equal(stockRows.get(stockKey(STORE, SKU)).reservedQuantity, 0, 'no double-decrement');
});

test('confirm commits the decrement (quantity AND reserved drop), records movement, idempotent', async () => {
    seedStock({ quantity: 1 });
    const svc = loadService();
    const r = await svc.lock({ storeId: STORE, variantId: SKU, userId: 'u', quantity: 1 });

    const c = await svc.confirm(r.lockId, '22222222-2222-2222-2222-222222222222');
    assert.deepEqual(c, { confirmed: true });
    const stock = stockRows.get(stockKey(STORE, SKU));
    assert.equal(stock.quantity, 0, 'on-hand dropped');
    assert.equal(stock.reservedQuantity, 0, 'reserved released');
    assert.equal(stock.status, 'out_of_stock');
    assert.equal(reservationRows.get(r.lockId).status, 'confirmed');
    assert.equal(movementRows.length, 1, 'one outbound movement');
    assert.equal(movementRows[0].type, 'outbound');
    assert.equal(movementRows[0].quantity, 1);

    const again = await svc.confirm(r.lockId, '22222222-2222-2222-2222-222222222222'); // idempotent
    assert.deepEqual(again, { confirmed: true });
    assert.equal(stockRows.get(stockKey(STORE, SKU)).quantity, 0, 'no second decrement');
    assert.equal(movementRows.length, 1, 'no duplicate movement');
});

test('cannot confirm a released lock (409)', async () => {
    seedStock({ quantity: 1 });
    const svc = loadService();
    const r = await svc.lock({ storeId: STORE, variantId: SKU, userId: 'u', quantity: 1 });
    await svc.release(r.lockId);
    await assert.rejects(() => svc.confirm(r.lockId, '33333333-3333-3333-3333-333333333333'), (err) => err.statusCode === 409);
});

test('expireStale sweeps lapsed active holds back into availability, then lock succeeds', async () => {
    seedStock({ quantity: 1 });
    const svc = loadService();
    const r = await svc.lock({ storeId: STORE, variantId: SKU, userId: 'u', quantity: 1 });
    assert.equal(stockRows.get(stockKey(STORE, SKU)).reservedQuantity, 1);

    // Force the hold to be in the past.
    reservationRows.get(r.lockId).expiresAt = new Date(Date.now() - 60 * 1000);

    // A new lock() opportunistically expires the stale hold first, then reserves the freed unit.
    const r2 = await svc.lock({ storeId: STORE, variantId: SKU, userId: 'buyer-B', quantity: 1 });
    assert.ok(r2.lockId);
    assert.equal(reservationRows.get(r.lockId).status, 'expired', 'stale hold expired');
    assert.equal(stockRows.get(stockKey(STORE, SKU)).reservedQuantity, 1, 'reserved = the new hold only');
});

test('getStock returns a StockLevel; getBulkStock returns an array', async () => {
    seedStock({ quantity: 3, reservedQuantity: 1 });
    const svc = loadService();
    const level = await svc.getStock(STORE, SKU);
    assert.equal(level.variantId, SKU);
    assert.equal(level.quantity, 3);
    assert.equal(level.reserved, 1);
    assert.equal(level.available, 2);
    assert.ok(typeof level.updatedAt === 'string');

    const bulk = await svc.getBulkStock(STORE, [SKU]);
    assert.equal(bulk.length, 1);
    assert.equal(bulk[0].available, 2);
    assert.deepEqual(await svc.getBulkStock(STORE, []), [], 'empty input → empty array');
});
