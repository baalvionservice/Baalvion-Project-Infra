'use strict';
const { computeOrderPricing, computeSubtotal } = require('./pricing');

describe('computeSubtotal', () => {
    test('sums quantity × unit_price across lines', () => {
        expect(computeSubtotal([{ quantity: 10, unit_price: 5 }, { quantity: 2, unit_price: 100 }])).toBe(250);
    });

    test('rounds each line to 2 decimals (invoice-line semantics)', () => {
        expect(computeSubtotal([{ quantity: 3, unit_price: 0.333 }])).toBe(1.0); // 0.999 → 1.00
    });

    test('returns 0 for empty / missing lines', () => {
        expect(computeSubtotal([])).toBe(0);
        expect(computeSubtotal(undefined)).toBe(0);
    });
});

describe('computeOrderPricing — money truth', () => {
    test('total is COMPUTED from lines, never trusts a client total', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 100, unit_price: 12.5 }], currency: 'USD' });
        expect(p.subtotal).toBe(1250);
        expect(p.totalValue).toBe(1250); // no destination → no duty/tax
        expect(p.dutyAmount).toBe(0);
        expect(p.taxAmount).toBe(0);
    });

    test('same-currency order normalizes 1:1 to base (fxRateUsed = 1)', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: 1000 }], currency: 'USD', baseCurrency: 'USD', fxRate: 83 });
        expect(p.fxRateUsed).toBe(1); // currency === base → ignore any passed rate
        expect(p.baseCurrencyAmount).toBe(1000);
    });

    test('foreign-currency order normalizes to base with the resolved FX rate', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: 1000 }], currency: 'EUR', baseCurrency: 'USD', fxRate: 1.09 });
        expect(p.totalValue).toBe(1000);          // in EUR
        expect(p.fxRateUsed).toBe(1.09);
        expect(p.baseCurrencyAmount).toBe(1090);  // USD
    });

    test('unresolved FX falls back to identity rather than zeroing the order (fail-open, audited)', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: 500 }], currency: 'EUR', baseCurrency: 'USD' });
        expect(p.fxRateUsed).toBe(1);
        expect(p.baseCurrencyAmount).toBe(500);
    });

    test('applies per-line duty + import VAT for an import destination (IN)', () => {
        // 1000 of HS chapter 85 into India: duty 20% = 200; VAT 18% on (1000+200)=1200 → 216.
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: 1000, hs_code: '8501' }], currency: 'USD', destinationCountry: 'IN' });
        expect(p.dutyAmount).toBe(200);
        expect(p.taxAmount).toBe(216);
        expect(p.totalValue).toBe(1416);
    });

    test('mixed-commodity order taxes each line by its own HS chapter', () => {
        const p = computeOrderPricing({
            lines: [
                { quantity: 1, unit_price: 1000, hs_code: '7201' }, // steel ch.72 into IN: duty 7.5% = 75; VAT 18% of 1075 = 193.5
                { quantity: 1, unit_price: 1000, hs_code: '8501' }, // ch.85 into IN: duty 20% = 200; VAT 18% of 1200 = 216
            ],
            currency: 'USD',
            destinationCountry: 'IN',
        });
        expect(p.subtotal).toBe(2000);
        expect(p.dutyAmount).toBe(275);     // 75 + 200
        expect(p.taxAmount).toBe(409.5);    // 193.5 + 216
        expect(p.totalValue).toBe(2684.5);
    });

    test('handles empty order safely (no NaN)', () => {
        const p = computeOrderPricing({ lines: [], currency: 'USD' });
        expect(p.subtotal).toBe(0);
        expect(p.totalValue).toBe(0);
        expect(p.baseCurrencyAmount).toBe(0);
        expect(p.lineCount).toBe(0);
    });
});
