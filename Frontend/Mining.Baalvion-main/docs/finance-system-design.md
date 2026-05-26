
# GeoTrade Nexus Payment & Escrow System Design

This document outlines the financial architecture for global mineral trade settlement.

## 1. Escrow Workflow

The system uses a milestone-based escrow to protect both parties.

1.  **Funding**: Buyer initiates a `Transaction (ESCROW_DEPOSIT)`. Status of `TradeOrder` moves to `PROCESSING`.
2.  **Verification**: Funds are held. The platform waits for `InspectionReport` and `Shipment (IN_TRANSIT)` events.
3.  **Milestone 1 (Bill of Lading)**: Optional partial release (e.g., 20%) if configured in `BuyerContract`.
4.  **Milestone 2 (Delivery)**: Buyer confirms receipt. Status moves to `COMPLETED`.
5.  **Release**: Platform initiates `Transaction (ESCROW_RELEASE)` to Seller and `Transaction (COMMISSION_FEE)` to platform treasury.

## 2. API Endpoints (Conceptual)

### Payment Operations
- `POST /api/finance/pay`: Initiate bank transfer or wire details.
- `GET /api/finance/escrow/:orderId`: Fetch current balance and release conditions.
- `POST /api/finance/release`: Authorized release of funds (triggered by buyer or admin).

### Invoicing
- `GET /api/finance/invoices`: List all invoices for current company.
- `POST /api/finance/invoices/:orderId/generate`: Create automated PDF metadata.

### Refunds
- `POST /api/finance/refunds`: Buyer submits a request.
- `PATCH /api/finance/refunds/:id`: Admin approves/rejects.

## 3. Security & Fraud Detection
- **Velocity Limits**: Sudden high-volume transfers from new accounts are flagged.
- **Mismatch Detection**: Comparison between `Transaction` amount and `TradeOrder` value.
- **Audit Logging**: Every financial state change (e.g., `Escrow Status` from `HELD` to `RELEASED`) is logged with IP and Admin ID.

## 4. Multi-Currency Logic
- Base currency for internal reporting: `USD`.
- Real-time conversion used for `Bank Transfer` calculations via `currency_rates`.
