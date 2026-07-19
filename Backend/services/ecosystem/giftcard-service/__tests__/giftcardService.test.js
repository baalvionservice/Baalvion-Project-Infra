'use strict';
// Unit tests for checkout validation and fulfillment idempotency — run without a real
// DB/Redis connection or live supplier API calls.

const mockBrandFixed = {
    id: 'b1', slug: 'target-us', supplier: 'reloadly',
    denomination_type: 'FIXED', fixed_denominations: [25, 50, 100],
    currency_code: 'USD', is_active: true,
};
const mockBrandRange = {
    id: 'b2', slug: 'amazon-us', supplier: 'reloadly',
    denomination_type: 'RANGE', min_denomination: 5, max_denomination: 500,
    currency_code: 'USD', is_active: true,
};

jest.mock('../models', () => {
    const orders = new Map();
    const claims = new Map();
    return {
        GiftCardBrand: {
            findOne: jest.fn(async ({ where }) => {
                if (where.slug === 'target-us') return mockBrandFixed;
                if (where.slug === 'amazon-us') return mockBrandRange;
                return null;
            }),
            findAll: jest.fn(async () => [mockBrandFixed, mockBrandRange]),
            count: jest.fn(async () => 2),
        },
        GiftCardOrder: {
            create: jest.fn(async (fields) => {
                const row = { id: 'order-1', ...fields, update: jest.fn(async function (f) { Object.assign(this, f); return this; }) };
                orders.set(row.id, row);
                return row;
            }),
            findByPk: jest.fn(async (id) => orders.get(id) || null),
            findAndCountAll: jest.fn(async () => ({
                count: 1,
                rows: [{
                    id: 'order-1', user_id: 'u1', brand: mockBrandFixed, supplier: 'reloadly',
                    denomination_value: 25, currency_code: 'USD', price_usd_cents: 2500,
                    status: 'fulfilled', fulfillment_error: null, created_at: new Date(), fulfilled_at: new Date(),
                }],
            })),
            count: jest.fn(async () => 3),
            sum: jest.fn(async () => 7500),
        },
        GiftCardBillingWebhookEvent: {
            findOrCreate: jest.fn(async ({ where, defaults }) => {
                const key = `${where.provider}:${where.event_id}`;
                if (claims.has(key)) return [claims.get(key), false];
                const row = { ...defaults, update: jest.fn(async function (f) { Object.assign(this, f); return this; }) };
                claims.set(key, row);
                return [row, true];
            }),
        },
    };
});

jest.mock('../service/suppliers/supplierRegistry', () => ({
    getSupplier: jest.fn(() => ({
        createOrder: jest.fn(async () => ({ transactionId: 'txn-1' })),
        fetchRedeemCode: jest.fn(async () => ({ code: 'REDEEM-CODE', pin: null })),
    })),
}));

jest.mock('../service/codeVault', () => ({
    encrypt: jest.fn((v) => `enc:${v}`),
    decrypt: jest.fn((v) => v.replace('enc:', '')),
}));

global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ id: 'charge-1', clientParams: { asset: 'USDT_TRC20', address: 'T...', amountValue: '25', amountDisplay: '25 USDT' } }),
}));

const giftcardService = require('../service/giftcardService');

describe('giftcardService.checkout — denomination validation', () => {
    test('accepts a valid FIXED denomination', async () => {
        const result = await giftcardService.checkout('target-us', 'u1', 'u1@example.com', 25, 'USDT_TRC20');
        expect(result.orderId).toBe('order-1');
    });

    test('rejects a FIXED denomination not in the allowed list', async () => {
        await expect(giftcardService.checkout('target-us', 'u1', 'u1@example.com', 30, 'USDT_TRC20'))
            .rejects.toThrow(/denomination must be one of/);
    });

    test('accepts a RANGE denomination within bounds', async () => {
        const result = await giftcardService.checkout('amazon-us', 'u1', 'u1@example.com', 200, 'BTC');
        expect(result.orderId).toBe('order-1');
    });

    test('rejects a RANGE denomination outside bounds', async () => {
        await expect(giftcardService.checkout('amazon-us', 'u1', 'u1@example.com', 9999, 'BTC'))
            .rejects.toThrow(/denomination must be between/);
    });

    test('rejects an unknown brand', async () => {
        await expect(giftcardService.checkout('does-not-exist', 'u1', 'u1@example.com', 25, 'BTC'))
            .rejects.toThrow(/not found/);
    });
});

describe('giftcardService.fulfill — idempotency', () => {
    test('a duplicate eventId is applied only once', async () => {
        const db = require('../models');
        db.GiftCardOrder.findByPk.mockResolvedValueOnce({
            id: 'order-2', user_id: 'u1', supplier: 'reloadly',
            denomination_value: 25, brand: { supplier_product_id: 'p1' },
            update: jest.fn(async function (f) { Object.assign(this, f); return this; }),
        });
        const first = await giftcardService.fulfill({
            eventId: 'evt-1', metadata: { userId: 'u1', orderId: 'order-2' },
            amountMinor: 2500, currency: 'USD', providerRef: 'crypto_abc',
        });
        expect(first.duplicate).toBe(false);

        const second = await giftcardService.fulfill({
            eventId: 'evt-1', metadata: { userId: 'u1', orderId: 'order-2' },
            amountMinor: 2500, currency: 'USD', providerRef: 'crypto_abc',
        });
        expect(second.duplicate).toBe(true);
    });
});

describe('giftcardService admin merchant views', () => {
    test('listOrdersAdmin returns paginated real orders with brand info', async () => {
        const result = await giftcardService.listOrdersAdmin({ limit: 10, offset: 0 });
        expect(result.total).toBe(1);
        expect(result.orders[0]).toMatchObject({ id: 'order-1', userId: 'u1', status: 'fulfilled', supplier: 'reloadly' });
    });

    test('getMerchantStats aggregates real counts and revenue', async () => {
        const stats = await giftcardService.getMerchantStats();
        expect(stats).toEqual({
            totalOrders: 3, fulfilledOrders: 3, pendingOrders: 3, failedOrders: 3,
            revenueUsdCents: 7500, totalBrands: 2, activeBrands: 2,
        });
    });

    test('listCatalogAdmin includes inactive brands and sync metadata', async () => {
        const brands = await giftcardService.listCatalogAdmin();
        expect(brands).toHaveLength(2);
        expect(brands[0]).toHaveProperty('isActive');
        expect(brands[0]).toHaveProperty('lastSyncedAt');
    });
});
