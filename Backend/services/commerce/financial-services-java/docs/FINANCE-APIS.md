# Finance APIs — Trade Finance, Credit, FX & Wallet

Integration reference for the four finance microservices added to the Global Trade
Infrastructure. All are Spring Boot, isolated Postgres schema, Kafka transactional outbox,
RS256 JWT verification via `common-security`.

## Conventions (all services)

- **Base path:** `/api/v1/...` on the service port (below).
- **Auth:** `Authorization: Bearer <RS256 JWT>`. Tenant is derived **from the token** (`org_id`).
  In local dev (`APP_SECURITY_ENABLED=false`) you may pass `X-Tenant-ID: <uuid>` instead.
- **Idempotency:** write endpoints accept `X-Idempotency-Key: <string>` (or a body
  `idempotencyKey`). Re-sending the same key returns the original result — safe to retry.
- **Money:** decimal strings, 4dp. **Currency:** ISO-4217 3-letter codes.
- **Errors:** standard envelope `{ timestamp, status, error, code, message, path, correlationId, fieldErrors? }`.
  `404 NOT_FOUND`, `400 BAD_REQUEST`, `409 CONFLICT`, `422 VALIDATION_FAILED` / `INSUFFICIENT_FUNDS`.
- **Lists:** Spring `Page` (`?page=&size=`) → `{ content:[], totalElements, totalPages, number, size }`.

| Service | Port | Schema |
|---|---|---|
| trade-finance-service | 3036 | `trade_finance` |
| credit-service | 3037 | `credit` |
| fx-service | 3038 | `fx` |
| wallet-service | 3039 | `wallet` |

---

## Trade Finance — `:3036`

### Letters of Credit — `/api/v1/letters-of-credit`
| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Issue a credit (`lcType`, `applicantName`, `beneficiaryName`, `amount`, `currency`, `expiryDate`, …) |
| GET | `/{id}` | Fetch a credit |
| GET | `/?status=&beneficiaryId=&page=&size=` | List credits |
| POST | `/{id}/advise` | ISSUED → ADVISED |
| POST | `/{id}/cancel?reason=` | Cancel (only if undrawn) |
| POST | `/{id}/amendments` | Propose amendment (`newAmount`, `newExpiryDate`, `changes`) |
| GET | `/{id}/amendments` | List amendments |
| POST | `/{id}/amendments/{amendmentId}/decision?accept=true` | Beneficiary consent (UCP 600 art.10) |
| POST | `/{id}/presentations` | Present documents (`presentedAmount`, `documents[]`) |
| GET | `/{id}/presentations` | List presentations |
| POST | `/{id}/presentations/{pid}/examine` | Body `{ "discrepancies": [] }` → COMPLYING / DISCREPANT |
| POST | `/{id}/presentations/{pid}/waive` | Applicant waives discrepancies |
| POST | `/{id}/presentations/{pid}/reject?reason=` | Reject a presentation |
| POST | `/{id}/presentations/{pid}/settle` | Honour → draws the credit, posts ledger settlement |

Lifecycle: `DRAFT→ISSUED→ADVISED→(AMENDED)→DOCS_PRESENTED→DOCS_ACCEPTED|DISCREPANT→SETTLED`;
terminal `SETTLED|EXPIRED|CANCELLED`. Issuance computes a commission + cash margin.

### Bank Guarantees — `/api/v1/bank-guarantees`
| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Issue (`guaranteeType` = BID_BOND/PERFORMANCE/ADVANCE_PAYMENT/FINANCIAL/RETENTION/WARRANTY) |
| GET | `/{id}` · GET `/?status=&beneficiaryId=` | Read / list |
| POST | `/{id}/amend?newAmount=&newExpiryDate=` | Amend / extend |
| POST | `/{id}/cancel?reason=` · POST `/{id}/release` | Close before claim |
| POST | `/{id}/claims` | Beneficiary demand (`claimAmount`, `statement`, `supportingDocuments[]`) |
| GET | `/{id}/claims` | List claims |
| POST | `/{id}/claims/{claimId}/decision?pay=true` | Pay (posts ledger) or reject (body `{ "reason": "" }`) |

---

## Credit — `:3037`

### Invoice Finance — `/api/v1/invoice-finance`
| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Submit a receivable (`invoiceNumber`, `sellerName`, `debtorName`, `faceAmount`, `currency`, `dueDate`). Risk-assessed → APPROVED (with advance/fee/reserve) or REJECTED |
| GET | `/{id}` · GET `/?status=&sellerId=` | Read / list |
| POST | `/{id}/fund` | Disburse advance to seller (APPROVED → FUNDED) |
| POST | `/{id}/collections` | Record debtor payment (`amount`); full collection remits net reserve |
| GET | `/{id}/collections` | Collection history |

### Trade BNPL — `/api/v1/bnpl`
| Method | Path | Purpose |
|---|---|---|
| POST | `/plans` | Create (`buyerName`, `merchantName`, `principal`, `currency`, `termType`=BULLET\|INSTALLMENTS, `installmentCount`, `tenorDays`). Risk-assessed; builds schedule |
| GET | `/plans/{id}` · GET `/plans?status=&buyerId=` | Read / list |
| GET | `/plans/{id}/installments` | Installment schedule |
| POST | `/plans/{id}/disburse` | Pay merchant up-front (APPROVED → ACTIVE) |
| POST | `/plans/{id}/repayments` | Buyer repayment (`amount`); allocated to earliest installments |
| POST | `/plans/{id}/cancel?reason=` · POST `/plans/{id}/write-off` | Cancel / write off |

Risk grades A–E (E declined) drive advance-rate cap and pricing multiplier; overdue
installments accrue late fees and move plans DELINQUENT → DEFAULTED via a daily sweep.

---

## FX — `:3038`

### Rates — `/api/v1/fx/rates`  (read-only, no tenant required)
| Method | Path | Purpose |
|---|---|---|
| GET | `/?base=USD` | All supported pairs vs base |
| GET | `/{base}/{quote}` | One pair (mid/bid/ask, `fresh`) |
| GET | `/quote?sell=USD&buy=INR&amount=1000` | Indicative quote |

### Deals — `/api/v1/fx`
| Method | Path | Purpose |
|---|---|---|
| POST | `/conversions` | Spot convert (`sellCurrency`, `buyCurrency`, `sellAmount`) → executed at dealable rate |
| GET | `/conversions/{id}` · GET `/conversions` | Read / list |
| POST | `/rate-locks` | Lock a firm rate for a window (`sellCurrency`, `buyCurrency`, `sellAmount`, `lockSeconds?`) |
| POST | `/rate-locks/{id}/execute` | Execute before expiry → conversion at locked rate |
| POST | `/rate-locks/{id}/cancel` · GET `/rate-locks/{id}` · GET `/rate-locks?status=` | Manage |

### Forwards — `/api/v1/fx/forwards`
| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Book (`sellCurrency`, `buyCurrency`, `notionalAmount`, `valueDate`) — forward rate via covered interest parity, margin blocked |
| GET | `/{id}` · GET `/?status=` | Read / list |
| POST | `/{id}/settle` | Settle on/after value date → conversion at forward rate |
| POST | `/{id}/cancel?reason=` | Cancel (releases margin) |

---

## Wallet — `:3039`  `/api/v1/wallets`

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Open a wallet (`holderId`, `holderType?`, `defaultCurrency?`) — idempotent per holder |
| GET | `/{id}` · GET `/by-holder/{holderId}` · GET `/` | Read (with balances) / list |
| POST | `/{id}/credit` | Deposit (`currency`, `amount`) |
| POST | `/{id}/debit` | Withdraw/payout (`currency`, `amount`) — 422 INSUFFICIENT_FUNDS if short |
| POST | `/{id}/transfers` | Same-currency transfer (`destinationWalletId`, `currency`, `amount`) |
| POST | `/{id}/conversions` | In-wallet FX (`sellCurrency`, `buyCurrency`, `sellAmount`, `rate`, `fxReferenceId?`) |
| POST | `/{id}/holds` | Reserve funds (`currency`, `amount`, `ttlMinutes?`) |
| GET | `/{id}/holds` | List holds |
| POST | `/holds/{holdId}/release` · `/holds/{holdId}/capture` | Resolve a hold |
| GET | `/{id}/statement?currency=&page=&size=` | Movement ledger |
| POST | `/{id}/freeze` · `/unfreeze` · `/close` | Status control |

Balances are guarded by row-level locking; every movement is idempotent and recorded in an
append-only ledger. Typical FX cash-out flow: **fx** `/rate-locks` → execute → **wallet**
`/{id}/conversions` with the locked `rate`.

---

## Events (Kafka, via outbox)

`tradefinance.lc.{issued,amended,presented,settled,closed}`,
`tradefinance.guarantee.{issued,claimed,claim_paid,closed}`,
`credit.invoice.{funded,collected,closed}`, `credit.bnpl.{disbursed,repaid,settled,delinquent}`,
`fx.{rate_lock.created,conversion.executed,forward.booked,forward.settled}`,
`wallet.{opened,credited,debited,transferred,converted}` — consumed by ledger/account services
for double-entry mirroring.

## External provider seams (no mock business data)

Real conversions/postings always run; only the **external network boundary** is pluggable:
- `app.trade-finance.issuing-bank-provider` = `simulated` (default) | `swift`
- `app.fx.rate-provider` = `simulated` (deterministic in-process feed) | `live`
- `app.credit.credit-bureau-provider` = `internal` (rules engine) | `bureau`

Set the real variant + credentials at deploy time to swap in SWIFT / a live FX feed / a credit
bureau without any code change.
