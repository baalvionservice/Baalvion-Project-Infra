# Multi-Market Pricing (commerce-service)

One shared Amarisé store, authored once in a **base currency (USD)**, sold into **five
markets**. The storefront API converts the base price to each market's currency at read
time (base × FX, with per-market psychological rounding) and attaches the market's tax
rule so the storefront can render correct tax-inclusive / exclusive pricing.

Single source of truth: [`config/markets.js`](../config/markets.js). FX seam:
[`service/fxRateProvider.js`](../service/fxRateProvider.js).

## The 5 markets

| Country | Currency | Locale | Tax | Rate | Inclusive | FX (1 USD =) | Rounding |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `us` | USD | en-US | SALES_TAX | 8.5% | no  | 1     | 2dp |
| `uk` | GBP | en-GB | VAT       | 20%  | yes | 0.79  | 2dp |
| `ae` | AED | ar-AE | VAT       | 5%   | yes | 3.67  | nearest 10 |
| `in` | INR | en-IN | GST       | 18%  | yes | 83.3  | nearest 100 |
| `sg` | SGD | en-SG | GST       | 7%   | yes | 1.35  | 2dp |

- **Base currency:** `USD` (`BASE_CURRENCY`). **Default market:** `us` (`DEFAULT_MARKET`).
- There is **no `ca` market**. Any unknown/unsupported country is rejected at the storefront
  boundary (400) or, internally, passed through as the raw base amount.

### Per-market rounding

Conversion applies psychological rounding per hub (`roundTo`):

- `us` / `uk` / `sg`: 2-decimal precision.
- `ae`: round to the nearest **10 AED** (e.g. `100 USD × 3.67 = 367 → 370`).
- `in`: round to the nearest **100 INR** (e.g. `1 USD × 83.3 = 83.3 → 100`).

All money math is guarded: a `NaN` / `Infinity` / negative / `undefined` input can never
produce a `NaN` / `Infinity` / negative price — it collapses to `0` (`safeAmount`).

## API surface

`config/markets.js` exports (signatures are stable — do not change):

| Export | Returns |
| --- | --- |
| `BASE_CURRENCY` | `'USD'` |
| `DEFAULT_MARKET` | `'us'` |
| `SUPPORTED_MARKETS` | `['us','uk','ae','in','sg']` |
| `getMarket(country)` | the market record, or `null` |
| `listMarkets()` | array of 5 market records (copies) |
| `isSupportedMarket(country)` | `boolean` (case/whitespace-insensitive) |
| `convertFromBase(amountBase, country, baseCurrency?)` | converted + rounded number (finite, ≥ 0) |
| `priceFields(amountBase, country, baseCurrency?)` | `{ price, currencyCode, taxType, taxRate, taxInclusive }` |

The storefront serializer (`utils/storefrontSerializer.js`) calls `priceFields` to attach
`price` / `currencyCode` / `taxType` / `taxRate` / `taxInclusive` to each product when a
`?country=` is supplied. `GET /commerce/markets` (`controller/marketController.js`) returns
`{ baseCurrency, defaultMarket, markets }`.

## FX strategy

### Default: static, env-overridable

Out of the box, every per-market rate is the **static** value in `config/markets.js`,
overridable per environment. With no live feed configured, pricing is byte-identical to the
legacy static behaviour.

```
FX_USD_USD=1
FX_USD_GBP=0.79
FX_USD_AED=3.67
FX_USD_INR=83.3
FX_USD_SGD=1.35
```

Only finite, strictly-positive overrides are honored; anything else falls back to the
hard-coded default for that currency.

### Optional: live FX feed (seam)

`service/fxRateProvider.js` is the boundary between the static rates and a future external
FX API. `convertFromBase` resolves the **effective** rate via
`getEffectiveFxRate(currency, staticRate)`:

1. live feed disabled → returns `staticRate` (today's behaviour);
2. live feed enabled **and** a fresh cached snapshot has the currency → returns the live rate;
3. otherwise → returns `staticRate` (graceful fallback).

The read path is **synchronous** (the hot price-conversion path never awaits I/O): a
background `refreshRates()` job fetches a USD-base snapshot, validates it, writes it to Redis
(`service/cacheService.js`) under `commerce:fx:snapshot:usd` with a TTL, and updates an
in-process memo. If Redis, the feed, or the snapshot is missing / stale / invalid, every
lookup falls back to static — the store can never fail to price a product.

```
FX_LIVE_FEED=false              # true to enable the live feed (default: false)
FX_CACHE_TTL=3600               # seconds; a snapshot older than this is stale → static
FX_REFRESH_INTERVAL_MS=1800000  # suggested background refresh cadence (< TTL)
FX_API_URL=                     # external FX provider endpoint (no key required by default)
FX_API_KEY=
```

#### Wiring a real feed (integration point)

1. Set `FX_LIVE_FEED=true` and `FX_API_URL` / `FX_API_KEY`.
2. Implement `fetchLiveSnapshot()` in `service/fxRateProvider.js` (marked
   **LIVE-FEED INTEGRATION POINT**) to call the real API and return a USD-base rates map
   `{ USD: 1, GBP: 0.79, ... }` (or `null` on failure — never throw).
3. Run the refresh on an interval, and prime the memo on boot:

   ```js
   const fx = require('./service/fxRateProvider');
   fx.primeFromCache().catch(() => {});                       // hydrate from Redis on boot
   setInterval(() => fx.refreshRates().catch(() => {}),       // periodic refresh
               fx.REFRESH_INTERVAL_MS);
   ```

No API key is required for the default static mode; the provider is fully functional and
side-effect-free until a live feed is explicitly turned on.

## Tax handling

`priceFields` attaches the market's tax rule alongside the converted price:

- `taxType` — `SALES_TAX` (US), `VAT` (UK/AE), `GST` (IN/SG).
- `taxRate` — percentage (e.g. `20` for UK VAT).
- `taxInclusive` — `true` when the displayed `price` already includes tax (UK/AE/IN/SG),
  `false` when tax is added at checkout (US sales tax is exclusive).

The backend returns the rule; rendering (inclusive vs. additive) is the storefront's job.
For an unknown market `priceFields` returns only `{ price, currencyCode: baseCurrency }`
(no tax fields), so callers fall back to base behaviour.

## Tests

`tests/markets.test.js` and `tests/fxRateProvider.test.js` (Node's built-in test runner,
matching `tests/media.test.js`):

```bash
node --test "tests/*.test.js"        # run all
node --test tests/markets.test.js    # markets only
```
