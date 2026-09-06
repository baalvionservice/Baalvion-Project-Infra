import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  Money,
  MoneyError,
  CurrencyMismatchError,
  divideRound,
  exponentOf,
  supportedCurrencies,
  toRazorpayAmount,
  fromRazorpayAmount,
  toStripeAmount,
  toPayUAmount,
  checkCapturedAmount,
} from '../dist/index.mjs';

// ---------------------------------------------------------------- the float bugs this replaces

test('survives the values that break Math.round(Number(x) * 100)', () => {
  // 10000.55 * 100 === 1000054.9999999999 as a double.
  assert.equal(Money.fromDecimal('10000.55', 'INR').minor, 1000055n);
  // 1.005 * 100 === 100.49999999999999, so Math.round gives 100 — a lost paisa.
  assert.equal(Money.fromDecimal('1.005', 'INR', { onExtraPrecision: 'HALF_UP' }).minor, 101n);
  assert.equal(Money.fromDecimal('4999.995', 'INR', { onExtraPrecision: 'HALF_UP' }).minor, 500000n);
});

test('summing a long invoice does not drift', () => {
  const line = Money.fromDecimal('249.99', 'INR');
  let total = Money.zero('INR');
  for (let i = 0; i < 40; i += 1) total = total.add(line);
  // The float version of this sum is 9999.599999999993.
  assert.equal(total.toDecimalString(), '9999.60');
  assert.equal(total.minor, 999960n);
});

test('a percentage discount stays exact', () => {
  const subtotal = Money.fromDecimal('10000.55', 'INR');
  const discount = subtotal.percentage('17.5', 'HALF_UP');
  // The float path lands on 8250.449999999999 and needs an epsilon to compare.
  assert.equal(discount.toDecimalString(), '1750.10');
  assert.equal(subtotal.subtract(discount).toDecimalString(), '8250.45');
});

test('equality is exact, so reconciliation needs no tolerance', () => {
  const a = Money.fromDecimal('10000.55', 'INR').subtract(Money.fromDecimal('1750.10', 'INR'));
  const b = Money.fromDecimal('8250.45', 'INR');
  assert.ok(a.equals(b));
  assert.equal(a.compare(b), 0);
});

// ---------------------------------------------------------------- float rejection

test('refuses floats where a decimal string is required', () => {
  assert.throws(() => Money.fromDecimal(10000.55, 'INR'), (e) => e instanceof MoneyError && e.code === 'FLOAT_REJECTED');
  assert.throws(() => Money.of(1000.5, 'INR'), (e) => e.code === 'FLOAT_REJECTED');
  assert.throws(() => Money.of(Number.MAX_SAFE_INTEGER + 2, 'INR'), (e) => e.code === 'UNSAFE_NUMBER');
});

test('refuses silent precision loss unless a mode is given', () => {
  assert.throws(() => Money.fromDecimal('10.005', 'INR'), (e) => e.code === 'PRECISION_LOSS');
  assert.equal(Money.fromDecimal('10.005', 'INR', { onExtraPrecision: 'HALF_EVEN' }).minor, 1000n);
  assert.equal(Money.fromDecimal('10.015', 'INR', { onExtraPrecision: 'HALF_EVEN' }).minor, 1002n);
});

test('rejects malformed and disguised amounts', () => {
  for (const bad of ['', '  ', '1,000.00', '1e3', '10.0.0', 'INR 10', '--5', 'abc']) {
    assert.throws(() => Money.fromDecimal(bad, 'INR'), MoneyError, `should reject ${JSON.stringify(bad)}`);
  }
});

test('fromLegacyFloat recovers a value that originated as a decimal', () => {
  assert.equal(Money.fromLegacyFloat(8250.449999999999, 'INR').toDecimalString(), '8250.45');
  assert.equal(Money.fromLegacyFloat(0.1 + 0.2, 'INR').toDecimalString(), '0.30');
});

// ---------------------------------------------------------------- currencies

test('minor-unit exponents are per-currency, not assumed', () => {
  assert.equal(exponentOf('INR'), 2);
  assert.equal(exponentOf('JPY'), 0);
  assert.equal(exponentOf('KWD'), 3);
  assert.equal(Money.fromDecimal('1000', 'JPY').minor, 1000n);      // not 100000
  assert.equal(Money.fromDecimal('10.500', 'KWD').minor, 10500n);   // not 1050
  assert.equal(Money.fromDecimal('1000', 'JPY').toDecimalString(), '1000');
});

test('an unknown currency fails closed', () => {
  assert.throws(() => Money.zero('XYZ'), (e) => e.code === 'UNKNOWN_CURRENCY');
  assert.throws(() => Money.zero('inr4'), (e) => e.code === 'UNKNOWN_CURRENCY');
  assert.equal(Money.zero('inr').currency, 'INR');
  assert.ok(supportedCurrencies().includes('INR'));
});

test('cross-currency arithmetic throws instead of guessing a rate', () => {
  const inr = Money.fromDecimal('100.00', 'INR');
  const usd = Money.fromDecimal('100.00', 'USD');
  assert.throws(() => inr.add(usd), CurrencyMismatchError);
  assert.throws(() => inr.compare(usd), CurrencyMismatchError);
  assert.equal(inr.equals(usd), false);
});

// ---------------------------------------------------------------- rounding

test('rounding modes are correct on both signs', () => {
  assert.equal(divideRound(15n, 10n, 'HALF_UP'), 2n);
  assert.equal(divideRound(-15n, 10n, 'HALF_UP'), -2n);
  assert.equal(divideRound(15n, 10n, 'HALF_DOWN'), 1n);
  assert.equal(divideRound(-15n, 10n, 'HALF_DOWN'), -1n);
  assert.equal(divideRound(15n, 10n, 'HALF_EVEN'), 2n);
  assert.equal(divideRound(25n, 10n, 'HALF_EVEN'), 2n);
  assert.equal(divideRound(-25n, 10n, 'HALF_EVEN'), -2n);
  assert.equal(divideRound(-15n, 10n, 'FLOOR'), -2n);
  assert.equal(divideRound(-15n, 10n, 'CEIL'), -1n);
  assert.equal(divideRound(-15n, 10n, 'TRUNCATE'), -1n);
  assert.equal(divideRound(15n, 10n, 'TRUNCATE'), 1n);
  assert.throws(() => divideRound(1n, 0n, 'HALF_UP'), (e) => e.code === 'DIVISION_BY_ZERO');
});

// ---------------------------------------------------------------- allocation

test('allocate never creates or destroys a minor unit', () => {
  const total = Money.of(10n, 'INR');
  const parts = total.allocate([1, 1, 1]);
  assert.deepEqual(parts.map((p) => p.minor), [4n, 3n, 3n]);
  assert.ok(Money.sum(...parts).equals(total));
});

test('weighted marketplace split reconciles to the order total', () => {
  const total = Money.fromDecimal('10000.55', 'INR');
  const parts = total.allocate([70, 20, 10]);
  assert.ok(Money.sum(...parts).equals(total), 'split must sum back to the total');
  assert.deepEqual(parts.map((p) => p.toDecimalString()), ['7000.39', '2000.11', '1000.05']);
});

test('a refund allocates the same way as a charge', () => {
  const refund = Money.fromDecimal('-10000.55', 'INR');
  const parts = refund.allocate([70, 20, 10]);
  assert.ok(Money.sum(...parts).equals(refund));
  assert.ok(parts.every((p) => p.isNegative()));
});

test('split is exact for amounts that do not divide evenly', () => {
  const total = Money.fromDecimal('100.00', 'INR');
  const three = total.split(3);
  assert.deepEqual(three.map((p) => p.toDecimalString()), ['33.34', '33.33', '33.33']);
  assert.ok(Money.sum(...three).equals(total));
});

test('rejects weights that would silently truncate', () => {
  const m = Money.of(100n, 'INR');
  assert.throws(() => m.allocate([0.5, 0.5]), (e) => e.code === 'INVALID_WEIGHTS');
  assert.throws(() => m.allocate([]), (e) => e.code === 'INVALID_WEIGHTS');
  assert.throws(() => m.allocate([0, 0]), (e) => e.code === 'INVALID_WEIGHTS');
  assert.throws(() => m.allocate([-1, 2]), (e) => e.code === 'INVALID_WEIGHTS');
});

// ---------------------------------------------------------------- scale

test('handles a large ledger balance without precision loss', () => {
  // Number.MAX_SAFE_INTEGER paise is about 90.07 trillion rupees; past that a double stops
  // counting individual paise, which is exactly where a group-wide ledger total ends up.
  const huge = Money.fromDecimal('100000000000000.01', 'INR');
  assert.equal(huge.minor, 10000000000000001n);
  assert.equal(huge.add(Money.of(1n, 'INR')).toDecimalString(), '100000000000000.02');
  assert.throws(() => huge.toSafeNumber(), (e) => e.code === 'UNSAFE_NUMBER');

  // Just under the boundary still converts, so PSP boundaries keep working.
  assert.equal(Money.fromDecimal('90000000000000.01', 'INR').toSafeNumber(), 9000000000000001);
});

// ---------------------------------------------------------------- providers

test('Razorpay round-trips paise exactly', () => {
  const order = Money.fromDecimal('10000.55', 'INR');
  assert.equal(toRazorpayAmount(order), 1000055);
  assert.ok(fromRazorpayAmount(1000055, 'INR').equals(order));
  assert.throws(() => toRazorpayAmount(order.negate()), MoneyError);
});

test('Stripe zero-decimal and three-decimal rules are enforced', () => {
  assert.equal(toStripeAmount(Money.fromDecimal('1000', 'JPY')), 1000);
  assert.throws(() => toStripeAmount(Money.fromDecimal('10.505', 'KWD')), (e) => e.code === 'INVALID_AMOUNT');
  assert.equal(toStripeAmount(Money.fromDecimal('10.500', 'KWD')), 10500);
});

test('PayU gets the exact signed string', () => {
  assert.equal(toPayUAmount(Money.fromDecimal('10000.55', 'INR')), '10000.55');
  assert.equal(toPayUAmount(Money.fromDecimal('10000.5', 'INR')), '10000.50');
});

test('captured-amount check is exact and reports the shortfall', () => {
  const expected = Money.fromDecimal('10000.55', 'INR');
  assert.equal(checkCapturedAmount(expected, 1000055, 'INR').ok, true);

  const short = checkCapturedAmount(expected, 1000054, 'INR');
  assert.equal(short.ok, false, 'a one-paisa shortfall must not pass');
  assert.equal(short.difference.toDecimalString(), '-0.01');

  const wrongCurrency = checkCapturedAmount(expected, 1000055, 'USD');
  assert.equal(wrongCurrency.ok, false);
});

// ---------------------------------------------------------------- serialisation & display

test('JSON round-trips without touching a float', () => {
  const m = Money.fromDecimal('90000000000000.01', 'INR');
  const wire = JSON.parse(JSON.stringify(m));
  assert.deepEqual(wire, { amount: '9000000000000001', currency: 'INR', exponent: 2 });
  assert.ok(Money.fromJSON(wire).equals(m));
});

test('rejects a payload whose exponent disagrees with this build', () => {
  assert.throws(() => Money.fromJSON({ amount: '1000', currency: 'JPY', exponent: 2 }), (e) => e.code === 'INVALID_AMOUNT');
});

test('formats INR with lakh/crore grouping', () => {
  assert.equal(Money.fromDecimal('10000000.55', 'INR').format(), 'INR 1,00,00,000.55');
  assert.equal(Money.fromDecimal('10000000.55', 'USD').format(), 'USD 10,000,000.55');
  assert.equal(Money.fromDecimal('-1234.50', 'INR').format({ symbol: '₹' }), '-₹1,234.50');
  assert.equal(Money.fromDecimal('1000', 'JPY').format(), 'JPY 1,000');
});

test('is immutable', () => {
  const m = Money.of(100n, 'INR');
  m.add(Money.of(50n, 'INR'));
  assert.equal(m.minor, 100n);
  assert.throws(() => { m.minor = 5n; }, TypeError);
});

test('reads DECIMAL columns exactly, and floats only as a fallback', () => {
  // What the pg driver actually returns for DECIMAL(14,2).
  assert.equal(Money.fromDatabaseValue('10000.55', 'INR').minor, 1000055n);
  assert.equal(Money.fromDatabaseValue('8250.45', 'INR').minor, 825045n);
  // A value already coerced to a float upstream still lands on the intended amount.
  assert.equal(Money.fromDatabaseValue(8250.449999999999, 'INR').minor, 825045n);
  assert.ok(Money.fromDatabaseValue(null, 'INR').isZero());
  assert.ok(Money.fromDatabaseValue(undefined, 'USD').isZero());
});

test('rates become exact fractions, so rate x money is integer arithmetic', async () => {
  const { ratioFromDecimal } = await import('../dist/index.mjs');
  assert.deepEqual(ratioFromDecimal('0.034'), { numerator: 34n, denominator: 1000n });
  assert.deepEqual(ratioFromDecimal(0.18), { numerator: 18n, denominator: 100n });
  assert.deepEqual(ratioFromDecimal('17.5'), { numerator: 175n, denominator: 10n });
  assert.deepEqual(ratioFromDecimal(1), { numerator: 1n, denominator: 1n });
  // Exponent notation is expanded rather than rejected.
  assert.equal(ratioFromDecimal(1e-7).denominator > 0n, true);
  assert.throws(() => ratioFromDecimal('abc'), MoneyError);
  assert.throws(() => ratioFromDecimal(Infinity), MoneyError);

  // 1000 x 18% is exactly 180, not 179.99999999999997.
  const m = Money.fromDecimal('1000.00', 'INR');
  const r = ratioFromDecimal(0.18);
  assert.equal(m.multiplyRatio(r.numerator, r.denominator, 'HALF_UP').toDecimalString(), '180.00');
});
