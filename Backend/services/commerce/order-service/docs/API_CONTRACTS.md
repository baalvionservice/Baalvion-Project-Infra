# order-service — cross-service API contracts

These are the load-bearing contracts other services (Amarisé storefront FE, admin-platform)
consume. Do not change these shapes without updating every consumer.

## C1 — Payment confirm (`POST /orders/stores/:storeId/orders/:orderId/payments/confirm`)

`confirmPayment` returns **the full updated Order JSON** (raw `model.toJSON()`), with top-level
`id` and `paymentStatus`.

- `paymentStatus` enum: `pending | authorized | paid | partially_paid | refunded | voided | failed`.
- The storefront treats a confirmation as **PAID iff `response.paymentStatus === 'paid'`**.
  There is NO `captured` field and NO separate `{ status, transactionId, order }` envelope.
- The FE shows the real `order.id` (never a synthetic `#AM-####` reference).

### Optional `gateway` (selected storefront gateway)

Both the intent and confirm bodies accept an optional `gateway` field:

```
POST .../payments/intent    { "gateway": "stripe" | "razorpay" | "payu" | "bank" }   // optional
POST .../payments/confirm   { "intentId": "...", "gateway": "...", "verification"?: {...} }
```

- The selected gateway is **recorded** on `order.metadata.selectedGateway` and on the payment row
  metadata (`payment.metadata.gateway`).
- In non-production the provider that actually captures money stays the existing mock
  (`PAYMENT_PROVIDER`); only the shopper's *selection* is recorded. So a client can label intent
  without overriding capture authority (capture is always backend-authoritative).
- Confirm's `gateway` wins over the intent's recorded value; a confirm without a gateway preserves
  the one chosen at intent time.

## C2 — Platform order revenue (`GET /orders/analytics/revenue`)

Cross-store, **earned**, currency-normalized aggregate. NOT mounted under `/stores/:storeId`.

- **Auth:** `authMiddleware` + `requirePlatformAdmin` (`super_admin` or `country_admin`). A
  store-scoped `store_viewer` or a guest token is rejected (403/401).
- **Query:** `from`, `to`, `granularity=day|week|month`, optional `storeId` (filter, not a path param).

Response:

```jsonc
{
  "success": true,
  "data": {
    "totals":  { "revenueBaseUsd": 0, "taxBaseUsd": 0, "orders": 0, "baseCurrency": "USD" },
    "byMarket": [
      { "market": "us|uk|ae|in|sg", "revenue": 0, "currencyCode": "USD", "orders": 0, "sharePct": 0 }
    ],
    "byStatus": [ { "status": "paid|pending|...", "count": 0, "revenue": 0 } ],
    "series":   [ { "date": "YYYY-MM-DD", "revenueBaseUsd": 0, "orders": 0 } ]
  }
}
```

Correctness rules (enforced in `analyticsService.platformRevenue`):

- **Earned** = `payment_status IN ('paid','partially_paid')`. `pending`/`cancelled`/`refunded` are
  reported in `byStatus` separately and **never** summed into the earned totals.
- `byMarket[].revenue` is the **native** market currency; mixed currencies are **never** naively
  summed. `revenueBaseUsd` is computed by FX-converting each market to USD via
  `fxRateProvider.getEffectiveFxRate(currencyCode, markets.getMarket(market).fxRate)`
  (native ÷ USD→market rate). `Σ byMarket.revenueBaseUsd == totals.revenueBaseUsd`.
- Grouping is by the persisted `market` column, **not** `shipping_address` country.
- `byMarket[].sharePct` is the share of `totals.revenueBaseUsd` (comparable across currencies).
