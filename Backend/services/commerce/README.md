# Domain: commerce

Trade, orders, inventory, fulfillment, marketplace and billing — the revenue path.

## Services
| Service | Bounded context | Notes |
|---|---|---|
| `trade-service` | global trade / RFQ / marketplace | real full-stack (Postgres + JWT) |
| `order-service` | order lifecycle | |
| `inventory-service` | stock / catalog inventory | |
| `fulfillment-service` | fulfillment / shipping | |
| `commerce-service` | commerce aggregate / checkout | |
| `market-service` | market data / pricing | |

## Domain rules
- `billing-platform` is the reserved bounded context for billing/metering/payments.
- One DB per service (rule D1); cross-service totals come via contracts/events, not
  shared tables.

> Services migrate into this folder per `Backend/MIGRATION.md`.
