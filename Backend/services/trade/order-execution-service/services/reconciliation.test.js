'use strict';
const { checkOrder, scanOrdersForDrift } = require('./reconciliation');

const clean = {
    subtotal: '100.00', duty_amount: '10.00', tax_amount: '5.00',
    total_value: '115.00', fx_rate_used: '1.20', base_currency_amount: '138.00',
    payment_status: 'confirmed', status: 'payment_confirmed',
};

describe('reconciliation.checkOrder', () => {
    test('clean order has no drift', () => {
        expect(checkOrder(clean, 'PAYMENT_CONFIRMED')).toEqual([]);
    });

    test('detects money-truth drift (total != subtotal+duty+tax)', () => {
        const o = { ...clean, total_value: '120.00', base_currency_amount: '144.00' };
        const codes = checkOrder(o, 'PAYMENT_CONFIRMED').map((d) => d.code);
        expect(codes).toContain('MONEY_TRUTH_DRIFT');
    });

    test('detects FX drift (base != total*fx)', () => {
        const o = { ...clean, base_currency_amount: '200.00' };
        const codes = checkOrder(o, 'PAYMENT_CONFIRMED').map((d) => d.code);
        expect(codes).toContain('FX_DRIFT');
    });

    test('detects saga drift when payment confirmed but saga disagrees', () => {
        const codes = checkOrder(clean, 'PLACED').map((d) => d.code);
        expect(codes).toContain('SAGA_DRIFT');
    });

    test('detects state drift when payment confirmed but status not advanced', () => {
        const o = { ...clean, status: 'placed' };
        const codes = checkOrder(o, 'PAYMENT_CONFIRMED').map((d) => d.code);
        expect(codes).toContain('STATE_DRIFT');
    });

    test('unpaid order with neutral state is clean', () => {
        const o = {
            subtotal: '50.00', duty_amount: '0', tax_amount: '0',
            total_value: '50.00', fx_rate_used: '1', base_currency_amount: '50.00',
            payment_status: 'unpaid', status: 'placed',
        };
        expect(checkOrder(o, 'PLACED')).toEqual([]);
    });

    test('tolerates sub-cent rounding', () => {
        const o = { ...clean, total_value: '115.004' };
        expect(checkOrder(o, 'PAYMENT_CONFIRMED')).toEqual([]);
    });
});

describe('reconciliation.scanOrdersForDrift', () => {
    const cleanOrder = (id) => ({
        id, tenant_id: 't1', subtotal: '100', duty_amount: '0', tax_amount: '0',
        total_value: '100', fx_rate_used: '1', base_currency_amount: '100',
        payment_status: 'unpaid', status: 'placed',
    });

    test('keyset-paginates across batches, aggregates drift, stops on a short batch', async () => {
        const driftOrder = { ...cleanOrder('b'), total_value: '999' }; // total != subtotal+duty+tax
        const calls = [];
        const fetchOrdersPage = async (lastId, limit) => {
            calls.push(lastId);
            if (lastId == null) return [cleanOrder('a'), driftOrder]; // full batch (==batchSize) → continue
            if (lastId === 'b') return [cleanOrder('c')]; // short batch (<batchSize) → stop
            return [];
        };
        const fetchSagaStates = async (ids) => ids.map((id) => ({ order_id: id, state: 'PLACED' }));

        const res = await scanOrdersForDrift({ fetchOrdersPage, fetchSagaStates, batchSize: 2 });

        expect(res.scannedOrders).toBe(3);
        expect(res.truncated).toBe(false);
        expect(res.drifts.map((d) => d.code)).toContain('MONEY_TRUTH_DRIFT');
        expect(res.drifts[0].orderId).toBe('b'); // only the drift order is reported
        expect(calls).toEqual([null, 'b']); // keyset advanced by last id of the full batch
    });

    test('hits the iteration backstop and flags truncated rather than looping forever', async () => {
        const fetchOrdersPage = async () => [cleanOrder('x')]; // always a full page at batchSize 1
        const fetchSagaStates = async (ids) => ids.map((id) => ({ order_id: id, state: 'PLACED' }));

        const res = await scanOrdersForDrift({ fetchOrdersPage, fetchSagaStates, batchSize: 1, maxIterations: 3 });

        expect(res.truncated).toBe(true);
        expect(res.scannedOrders).toBe(3);
    });
});
