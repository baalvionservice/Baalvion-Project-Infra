# Phase 1.1 — Order FX Conversion Bug (P0) — FIXED & VERIFIED

**Status:** ✅ Fixed, unit-tested (28/28), and live-verified across all 5 markets.
**Service:** `Backend/services/commerce/order-service`
**Date:** 2026-06-03

---

## Root cause

The platform has **two independent price paths** that did not agree:

| Path | Code | Behaviour |
|------|------|-----------|
| **Display** (storefront) | `commerce-service` `storefrontSerializer` → `config/markets.priceFields` → `convertFromBase` | Authors prices in **base USD**, multiplies by the market FX rate (`INR=83.3`), applies per-market psychological rounding, attaches the market tax rule. |
| **Order** (persistence) | `order-service` `service/orderService.resolveAuthoritativeItems` | Read the **same base USD** price from `commerce.commerce_product_pricing` / `commerce_product_variants` and stored it **verbatim** with the client-supplied `currencyCode`, with **no FX conversion** and using a per-variant tax rate (always exclusive). |

So an order placed in the IN market stored the base USD number labelled `INR`:

```
Displayed:  ₹28,73,900   = 34,500 (USD base) × 83.3, rounded to nearest 100
Persisted:  ₹34,500      = 34,500 (USD base), un-converted, labelled INR
2,873,900 / 34,500 = 83.30  ← exactly the INR FX rate → proves the missing multiply
```

The order also (a) ignored the market's **inclusive vs exclusive** tax rule, and (b) `discountService` compared/applied **USD-authored** discount values (`fixed_amount`, `min_purchase`, `max_discount`) against a market-currency subtotal — a `$50` coupon would have subtracted `₹50` instead of `~₹4,200`.

---

## The fix

Mirror the storefront's market + FX logic into order-service so the persisted order equals the displayed price, and apply the market tax rule.

### Files changed

| File | Change |
|------|--------|
| `config/markets.js` | **NEW** — mirror of `commerce-service/config/markets.js`. Same FX env vars (`FX_USD_<CCY>`) + defaults + per-market rounding, so conversion is byte-identical to the storefront. |
| `service/fxRateProvider.js` | **NEW** — mirror of commerce's provider. Reads the **same** Redis snapshot key (`commerce:fx:snapshot:usd`) so live-feed rates also match. `cacheService` is lazy-required so pure rate math stays dependency-free. |
| `service/pricing.js` | **NEW** — pure, unit-testable money math: `resolveUnitPricing` (base→market), `computeLine` (gross/net/tax for inclusive & exclusive), `computeOrderTotals`. |
| `service/orderService.js` | `resolveAuthoritativeItems` now converts base USD → market currency and applies the market tax rule. `createOrder` derives **server-authoritative** currency/tax from the market (a client can no longer claim `market=in` but `currencyCode=USD`), recomputes all totals via `pricing.js`, and primes the FX memo. |
| `service/discountService.js` | `fixed_amount`, `min_purchase`, and `max_discount` are converted from USD → order currency; percentages stay currency-agnostic. |
| `migrations/20260220-orders-market-tax-context.js` | Order `market` / `tax_type` / `tax_rate` / `tax_inclusive` columns (pre-existing multi-market work; required by the fix). |
| `tests/pricing.test.js` | **NEW** — 16 tests incl. the exact regression (`$34,500 → ₹2,873,900`). |
| `tests/markets.test.js` | **NEW** — market/FX parity tests. |
| `tests/discount.test.js` | + 4 market-conversion tests. |

### Money model (holds for every market)

```
line.gross = round2(unitPrice × quantity)                 # what the customer sees per line
inclusive: line.tax = round2(gross − gross/(1+rate))      # tax embedded in gross
           line.net = round2(gross − tax)
exclusive: line.net = gross ; line.tax = round2(gross × rate)
order.subtotal = Σ line.net ; order.taxAmount = Σ line.tax
order.total    = subtotal + taxAmount + shipping − discount
⇒ subtotal + taxAmount == Σ line.gross == displayed line totals
```

The **legacy / no-market** path (no `country`/`market` on the request) is preserved unchanged: base USD price, per-variant tax rate, exclusive.

---

## Before / after (the reported defect, IN market, base $34,500)

| Field | Before | After |
|-------|--------|-------|
| `currencyCode` | INR | INR |
| line unit price | 34,500 | **2,873,900** |
| `subtotal` | 34,500 | 2,435,508.47 (net) |
| `taxAmount` | 0 | 438,391.53 (18% GST, inclusive) |
| **`totalAmount`** | **34,500** | **2,873,900.00** ✅ matches display |

---

## Test evidence

**Unit:** `node --test` → **28/28 pass** (`pricing.test.js` 16, `markets.test.js` 8/included, `discount.test.js` 12).

**Live E2E** (guest checkout against the running service on `:3013`, base USD $34,500, persisted rows confirmed in Postgres):

| Market | Currency | Unit (converted) | Subtotal (net) | Tax | **Total** | Tax rule |
|---|---|---|---|---|---|---|
| US | USD | 34,500.00 | 34,500.00 | 2,932.50 | **37,432.50** | 8.5% exclusive |
| UK | GBP | 27,255.00 | 22,712.50 | 4,542.50 | **27,255.00** | 20% incl VAT |
| AE | AED | 126,620 | 120,590.48 | 6,029.52 | **126,620** | 5% incl VAT |
| IN | INR | 2,873,900 | 2,435,508.47 | 438,391.53 | **2,873,900** | 18% incl GST |
| SG | SGD | 46,575.00 | 43,528.04 | 3,046.96 | **46,575.00** | 7% incl GST |

---

## Residual notes (follow-ups, not blockers)

- **Shared package:** `markets.js` / `fxRateProvider.js` are mirrored (services build/deploy independently via turbo prune). Extract to `@baalvion/markets` to remove duplication once the workspace contract review allows.
- **Ledger & payment provider:** captured amounts are now mirrored to the ledger and sent to the payment provider in the **market currency** (correct), but multi-currency reconciliation and provider minor-unit handling (e.g. Razorpay paise, Stripe zero-decimal rules) are owned by the payments integration and should be validated there.
- **Base-price source:** the storefront serializer reads `custom_fields.basePrice ?? variant.price`; order-service reads `commerce_product_pricing.price ?? variant.price`. They agree for the seeded Amarisé catalog (proven above) but should be unified to a single authoritative base-price source.
- **Shipping:** treated as already-in-order-currency (storefront currently sends 0); a per-market shipping table should populate it.
