# Global Trade Infrastructure — Financial Services Integration

## What's Been Built

### 1. **Ledger Service** (port 3014)
- Double-entry bookkeeping: `POST /v1/ledger/entries`
- Account statements: `GET /v1/ledger/accounts/{id}/statement`
- Balance tracking: `GET /v1/ledger/accounts/{id}/balance`
- Immutable journal with RLS multi-tenancy

### 2. **Payment Service** (port 3015)
- Transaction initiation: `POST /v1/payments/initiate` (idempotent)
- Fee engine: Tiered, BigDecimal-precise fee calculation
- Scheme routing: NIP, VISA, MASTERCARD, INTERSWITCH, WALLET, INTERNAL, ESCROW
- Bulk disbursement: `POST /v1/payments/bulk` (1000/batch max)
- Reversal/refunds: `POST /v1/payments/{id}/reverse`

## Architecture: Node.js Microservices (not Java)

The MASTER_PROMPT.md references a Java/Spring Boot architecture as **reference**, but the actual implementation for Global Trade Infrastructure uses **Node.js/Express** to:
1. Match existing codebase (20+ Node services already running)
2. Faster iteration + real-time market updates
3. Unified developer experience
4. Leverage existing auth, middleware, observability stack

## Integration Points

```
Global Trade Frontend
        ↓
      API Gateway (Kong)
        ↓
   ┌────┴────┬──────────┬──────────┐
   ↓         ↓          ↓          ↓
Trade-Svc  Payment-Svc Ledger-Svc Settlement-Svc
   ↓         ↓          ↓          ↓
 PostgreSQL (all share payments/ledger schemas with RLS)
   ↓
 Kafka (async events: payments.transaction.*, ledger.entry.*, settlement.batch.*)
   ↓
Redis (idempotency cache, session, locks)
```

## Database (PostgreSQL Multi-Tenant)

- Schema: `payments` (transactions table)
- Schema: `ledger` (journal_entries table)
- RLS enabled: `tenant_id` isolation at DB level
- Indexes: tenant+status+date for dashboard queries
- Unique: `idempotency_key` per tenant (prevents duplicates)

## Authentication & Authorization

- JWT Bearer token (RS256 future, HS256 current)
- `x-tenant-id` header enforcement
- AsyncLocalStorage for tenant context per-request
- Middleware stack: tenantContext → authMiddleware → routes

## Event Streaming (Kafka)

```
payments.transaction.initiated.v1   → ledger-service (posts journal entry)
                                    → notification-service (sends confirmation)
                                    → analytics-service (tracking)

payments.transaction.completed.v1   → settlement-service (batches for payout)
                                    → notification-service

payments.transaction.failed.v1      → notification-service (alert user)
                                    → compliance-service (flagging)
```

## Key Business Rules Implemented

1. **Idempotency**: 24-hour Redis TTL prevents duplicate txn processing
2. **Fee Engine**: 
   - NIP: 0.5% + 50¢ + 5% VAT
   - VISA/MC: 2% + $1 + 5% VAT
   - Interswitch: 1.5% + 75¢ + 5% VAT
   - Internal: 0% (no fee)
3. **Limits**:
   - Min: 100 (1 USD)
   - Max: 500,000 (5,000 USD per txn)
   - Daily: 1,000,000 per account
4. **Reversals**: Create compensating entries (debit/credit swap)

## Observability

- Prometheus metrics: `transactions_initiated_total`, `transactions_failed_total`, `fees_collected_total`
- Health checks: `/health`, `/health/live`, `/health/ready`
- Request correlation: `x-trace-id`, `x-request-id` propagated
- Response timing: `x-response-time` header

## What's Left (Next Phase)

- ✅ Ledger Service (complete)
- ✅ Payment Service (complete)
- 🔄 **Settlement Service** (T+0/T+1 batching, scheme file generation)
- 🔄 **Escrow Service** (conditional holds, disputes, auto-release)
- 🔄 **Reconciliation Service** (inbound file matching, exceptions)
- 🔄 **Risk Service** (velocity checks, geo-blocking, device fingerprint)
- 🔄 **Trade Engine** (order book, matching engine for RFQs)
- 🔄 **Compliance Service** (KYC/AML, sanctions screening)

## Running Locally

```bash
# 1. Start infrastructure
docker-compose up -d postgres redis kafka

# 2. Start services
cd Backend/services/commerce/ledger-service && npm install && npm run migrate && npm start
cd Backend/services/commerce/payment-service && npm install && npm run migrate && npm start

# 3. Frontend
cd Frontend/Global-Trade-Infrastructure-main && npm run dev

# 4. Test
curl -X POST http://localhost:3015/v1/payments/initiate \
  -H "Authorization: Bearer mock-token" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "rfq-12345-pay",
    "sourceAccountId": "550e8400-e29b-41d4-a716-446655440001",
    "destinationAccountId": "550e8400-e29b-41d4-a716-446655440002",
    "amount": "1000000",
    "currency": "USD",
    "paymentScheme": "NIP",
    "description": "RFQ #12345 payment"
  }'
```

---

**Status**: Ledger + Payment services ready for integration testing.  
**Next**: Settlement and Escrow (order fulfillment), then Reconciliation.
