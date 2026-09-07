'use strict';
const { computeOrderPricing, computeSubtotal } = require('./pricing');

describe('computeSubtotal', () => {
    test('sums quantity × unit_price across lines', () => {
        expect(computeSubtotal([{ quantity: 10, unit_price: 5 }, { quantity: 2, unit_price: 100 }]).toDecimalString()).toBe('250.00');
    });

    test('rounds each line at the currency precision (invoice-line semantics)', () => {
        expect(computeSubtotal([{ quantity: 3, unit_price: 0.333 }]).toDecimalString()).toBe('1.00'); // 0.999 → 1.00
    });

    test('returns 0 for empty / missing lines', () => {
        expect(computeSubtotal([]).toDecimalString()).toBe('0.00');
        expect(computeSubtotal(undefined).toDecimalString()).toBe('0.00');
    });

    test('a fractional quantity is exact, not a float multiply', () => {
        // 2.5 tonnes at 1000.00 — a real trade shape, and where a float multiply drifts.
        expect(computeSubtotal([{ quantity: 2.5, unit_price: 1000 }]).toDecimalString()).toBe('2500.00');
    });
});

describe('computeOrderPricing — money truth', () => {
    test('total is COMPUTED from lines, never trusts a client total', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 100, unit_price: 12.5 }], currency: 'USD' });
        expect(p.subtotal).toBe('1250.00');
        expect(p.totalValue).toBe('1250.00'); // no destination → no duty/tax
        expect(p.dutyAmount).toBe('0.00');
        expect(p.taxAmount).toBe('0.00');
    });

    test('same-currency order normalizes 1:1 to base (fxRateUsed = 1)', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: 1000 }], currency: 'USD', baseCurrency: 'USD', fxRate: 83 });
        expect(p.fxRateUsed).toBe(1); // currency === base → ignore any passed rate
        expect(p.baseCurrencyAmount).toBe('1000.00');
    });

    test('foreign-currency order normalizes to base with the resolved FX rate', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: 1000 }], currency: 'EUR', baseCurrency: 'USD', fxRate: 1.09 });
        expect(p.totalValue).toBe('1000.00');          // in EUR
        expect(p.fxRateUsed).toBe(1.09);
        expect(p.baseCurrencyAmount).toBe('1090.00');  // USD
    });

    test('unresolved FX falls back to identity rather than zeroing the order (fail-open, audited)', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: 500 }], currency: 'EUR', baseCurrency: 'USD' });
        expect(p.fxRateUsed).toBe(1);
        expect(p.baseCurrencyAmount).toBe('500.00');
    });

    test('applies per-line duty + import VAT for an import destination (IN)', () => {
        // 1000 of HS chapter 85 into India: duty 20% = 200; VAT 18% on (1000+200)=1200 → 216.
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: 1000, hs_code: '8501' }], currency: 'USD', destinationCountry: 'IN' });
        expect(p.dutyAmount).toBe('200.00');
        expect(p.taxAmount).toBe('216.00');
        expect(p.totalValue).toBe('1416.00');
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
        expect(p.subtotal).toBe('2000.00');
        expect(p.dutyAmount).toBe('275.00');     // 75 + 200
        expect(p.taxAmount).toBe('409.50');      // 193.5 + 216
        expect(p.totalValue).toBe('2684.50');
    });

    test('handles empty order safely (no NaN)', () => {
        const p = computeOrderPricing({ lines: [], currency: 'USD' });
        expect(p.subtotal).toBe('0.00');
        expect(p.totalValue).toBe('0.00');
        expect(p.baseCurrencyAmount).toBe('0.00');
        expect(p.lineCount).toBe(0);
    });

    test('minor-unit companions match the decimal strings exactly', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: 1000, hs_code: '8501' }], currency: 'USD', destinationCountry: 'IN' });
        expect(p.totalValueMinor).toBe('141600');
        expect(p.dutyAmountMinor).toBe('20000');
        expect(p.taxAmountMinor).toBe('21600');
    });

    // The reason this module was rewritten: `round2` hardcoded two decimals for every currency.
    test('a zero-decimal currency has no minor unit (JPY is not 1/100 of a yen)', () => {
        const p = computeOrderPricing({
            lines: [{ quantity: 1, unit_price: 1000, hs_code: '8501' }],
            currency: 'JPY', baseCurrency: 'JPY', destinationCountry: 'IN',
        });
        expect(p.subtotal).toBe('1000');
        expect(p.dutyAmount).toBe('200');
        expect(p.totalValue).toBe('1416');
        expect(p.totalValueMinor).toBe('1416'); // whole yen, not 141600
    });

    test('a three-decimal currency keeps its third decimal (KWD)', () => {
        const p = computeOrderPricing({ lines: [{ quantity: 1, unit_price: '10.505' }], currency: 'KWD', baseCurrency: 'KWD' });
        expect(p.subtotal).toBe('10.505');
        expect(p.totalValueMinor).toBe('10505');
    });

    test('a long order does not accumulate rounding drift', () => {
        // 40 lines of 249.99 sums to 9999.60 exactly; the float version landed on
        // 9999.599999999993.
        const lines = Array.from({ length: 40 }, () => ({ quantity: 1, unit_price: 249.99 }));
        expect(computeOrderPricing({ lines, currency: 'USD' }).totalValue).toBe('9999.60');
    });
});
