# Vendor Integration Contracts

This directory makes the platform's **"INTEGRATION REQUIRED"** external boundaries
explicit, typed (JSDoc), and testable — **without faking any real external
integration**.

Each domain is a swappable seam with four files:

| File | Purpose |
|------|---------|
| `contract.js` | Provider interface + request/response shapes + normalized status enum + `FAILURE_MODES` (timeout / partial / idempotency / fail-open vs fail-closed). No behavior. |
| `mockAdapter.js` | **DEV-ONLY** in-memory adapter (`IS_PRODUCTION_SAFE = false`). For local testing. Legally-charged acts (customs file, eB/L issue/transfer) **throw** "NOT LEGALLY VALID — INTEGRATION REQUIRED". |
| `realAdapter.js` | Scaffold implementing the same contract; every method throws `IntegrationRequiredError`. Header lists required env vars + the certification/licensing prerequisite. |
| `conformance.test.js` | Reusable `runConformanceSuite(adapterFactory, { productionSafe })`. The same suite a future real adapter must pass. |

> **Nothing here is wired into the live order/payment path.** These are seams +
> tests only. Wiring is a later, supervised step. `integrations/index.js` is a
> barrel entry point with no side effects.

## Domains

| Domain | Seam point (existing file it plugs into) | Wired today? | Real-vendor options | Fail posture | Cannot be faked | Real-adapter env vars |
|--------|------------------------------------------|--------------|---------------------|--------------|-----------------|------------------------|
| **payment** (PSP / rail) | `services/paymentClient.js` (POST `/api/v1/payments/initiate`) + `workers/paymentSimulator.js` (emits `payments.transaction.completed`) | **Wired — to an INTERNAL/SIMULATED payment-service** (no real money) | Stripe Treasury, Nium, Currencycloud, Airwallex (SWIFT/SEPA/ACH/UPI/Pix/M-Pesa) | **Fail-CLOSED** (paid only on explicit terminal success) | Moving real funds is regulated; requires a licensed PSP/BaaS | `PAYMENT_PROVIDER`, `PAYMENT_API_BASE_URL`, `PAYMENT_API_KEY/_SECRET`, `PAYMENT_CLIENT_ID`, `PAYMENT_WEBHOOK_SECRET`, `PAYMENT_RAIL_ROUTING_TABLE` |
| **sanctions** | `services/sanctionsClient.js` (POST `/api/v1/sanctions/screen`) + `services/screeningPolicy.js` | **Wired — to risk-service's in-repo Jaro-Winkler watchlist** (not an authoritative list) | ComplyAdvantage, Refinitiv World-Check, Dow Jones (OFAC SDN + EU + UN + UK HMT) | **Fail-CLOSED** (unknown/timeout = BLOCK; blocks CONFIRMED/POTENTIAL) | The consolidated lists are licensed, continuously-refreshed datasets | `SANCTIONS_PROVIDER`, `SANCTIONS_API_BASE_URL`, `SANCTIONS_API_KEY`, `SANCTIONS_LIST_PROFILE`, `SANCTIONS_MIN_SCORE` |
| **kyc** (IDV) | Contract-only here (real KYC lives in Java account-service) | **Contract-only** | Onfido, Persona, Sumsub, Jumio | **Fail-CLOSED** (verified only on explicit APPROVED) | Real identity/biometric verification needs a licensed IDV provider | `KYC_PROVIDER`, `KYC_API_BASE_URL`, `KYC_API_KEY/_SECRET`, `KYC_WORKFLOW_ID`, `KYC_WEBHOOK_SECRET` |
| **customs** (broker / single-window) | Contract-only here | **Contract-only** | Descartes, e2open, US ACE/ABI, EU ICS2, UK CDS, India ICEGATE | **Fail-CLOSED + LEGAL GUARD** (mock never files) | **Filing a declaration is a legal act** with declarant liability | `CUSTOMS_PROVIDER`, `CUSTOMS_API_BASE_URL`, `CUSTOMS_CLIENT_CERT/_KEY`, `CUSTOMS_DECLARANT_ID`, `CUSTOMS_EORI/_BROKER_LICENSE` |
| **carrier** (tracking) | Contract-only here (logistics lives in trade-service) | **Contract-only** | Project44, FourKites, Freightos, carrier EDI, AIS | **Fail-OPEN / DEGRADED** (missing data degrades, never blocks) | Real shipment positions come from carrier/visibility networks | `CARRIER_PROVIDER`, `CARRIER_API_BASE_URL`, `CARRIER_API_KEY/_SECRET`, `CARRIER_ACCOUNT_ID` |
| **ebl** (e-Bill of Lading) | Contract-only here | **Contract-only** | WaveBL, essDOCS/Bolero (MLETR-compliant) | **Fail-CLOSED + LEGAL GUARD** (mock never issues/transfers title) | An eB/L is a **negotiable instrument**; a generated PDF is not | `EBL_PROVIDER`, `EBL_API_BASE_URL`, `EBL_API_KEY/_SECRET`, `EBL_PARTICIPANT_ID`, `EBL_SIGNING_KEY_REF` |

## Fail posture summary

- **Fail-CLOSED** (block on uncertainty): payment, sanctions, kyc, customs, ebl.
- **Fail-OPEN / degraded** (continue with stale data): carrier tracking.
- **Legal guard** (mock must refuse, never pretend): customs filing, eB/L issue/transfer.

## Running the conformance suite

```bash
# If jest picks up this dir (no package.json change needed if testMatch is default **/*.test.js):
npx jest integrations

# Per-domain:
npx jest integrations/payment

# Plain-node fallback (no jest config dependency):
node integrations/run-conformance.js
```

## "Cannot be faked" — what remains physically/legally impossible in-repo

1. **Move real money** — needs a licensed PSP/BaaS + money-transmission license per corridor.
2. **Authoritative sanctions screening** — needs a paid, continuously-refreshed OFAC/EU/UN/UK dataset license.
3. **Real identity verification** — needs a licensed IDV provider inspecting real documents/biometrics.
4. **File a customs declaration** — a legal act requiring a licensed broker / accredited single-window.
5. **Issue/transfer an eB/L** — title transfer is only valid on an MLETR-compliant registry; a PDF is not a negotiable instrument.
6. **Real carrier positions** — require carrier/visibility-network feeds (EDI/AIS).
